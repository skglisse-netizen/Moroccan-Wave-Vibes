const db = require('better-sqlite3')('surf_school.db');

function verifyFullFix() {
    console.log('--- Verifying Full Session & Purchase Fix ---');
    
    // 1. Setup: Create a test service (Pack 10)
    const serviceName = 'Full Test Pack 10';
    const price = 1000;
    const sessions = 10;
    const serviceResult = db.prepare("INSERT INTO public_services (name, sessions_count, price, is_active) VALUES (?, ?, ?, ?)").run(serviceName, sessions, price, 1);
    const serviceId = serviceResult.lastInsertRowid;
    console.log(`Created test service ID: ${serviceId} with ${sessions} sessions for ${price} DH`);

    // 2. Setup: Create a test reservation
    const phone = '0699999999';
    const clientName = 'Full Test User';
    const resvResult = db.prepare("INSERT INTO reservations (name, phone, service_id, status) VALUES (?, ?, ?, ?)").run(clientName, phone, serviceId, 'pending');
    const resvId = resvResult.lastInsertRowid;
    console.log(`Created test reservation ID: ${resvId}`);

    // 3. Simulate confirmation (Logic from server.ts)
    const status = 'confirmed';
    db.transaction(() => {
        const resv = db.prepare("SELECT * FROM reservations WHERE id = ?").get(resvId);
        if (resv && resv.phone && resv.status !== 'confirmed') {
            const service = db.prepare("SELECT * FROM public_services WHERE id = ?").get(resv.service_id);
            const sessionsToAdd = service?.sessions_count || 1;
            const finalPrice = service ? Math.round(service.price * (1 - (service.discount_percentage || 0) / 100)) : 0;
            const dateStr = new Date().toISOString().split('T')[0];

            let clientId;
            const existingClient = db.prepare("SELECT id FROM clients WHERE phone = ?").get(resv.phone);
            if (!existingClient) {
                const result = db.prepare(`
                    INSERT INTO clients (full_name, phone, is_subscriber, total_sessions, remaining_sessions)
                    VALUES (?, ?, ?, ?, ?)
                `).run(resv.name, resv.phone, sessionsToAdd > 0 ? 1 : 0, sessionsToAdd, sessionsToAdd);
                clientId = result.lastInsertRowid;
            } else {
                clientId = existingClient.id;
                db.prepare(`
                    UPDATE clients SET total_sessions = total_sessions + ?, remaining_sessions = remaining_sessions + ?, is_subscriber = CASE WHEN ? > 0 THEN 1 ELSE is_subscriber END WHERE id = ?
                `).run(sessionsToAdd, sessionsToAdd, sessionsToAdd, clientId);
            }

            if (service) {
                const purchaseResult = db.prepare(`
                    INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(clientId, service.id, service.name, finalPrice, sessionsToAdd, dateStr);
                
                const purchaseId = purchaseResult.lastInsertRowid;

                db.prepare("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)")
                    .run(`Vente Service: ${service.name}`, finalPrice, 'sale', dateStr, purchaseId);
            }
            db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, resvId);
        }
    })();

    // 4. Verification
    const client = db.prepare("SELECT * FROM clients WHERE phone = ?").get(phone);
    console.log(`Client: is_subscriber=${client.is_subscriber}, total=${client.total_sessions}, remaining=${client.remaining_sessions}`);
    
    const purchase = db.prepare("SELECT * FROM client_purchases WHERE client_id = ?").get(client.id);
    console.log(`Purchase: service=${purchase?.service_name}, added=${purchase?.sessions_added}`);

    const revenue = db.prepare("SELECT * FROM revenue WHERE purchase_id = ?").get(purchase?.id);
    console.log(`Revenue: amount=${revenue?.amount}, desc=${revenue?.description}`);

    if (client.is_subscriber === 1 && client.remaining_sessions === 10 && purchase && revenue) {
        console.log('✅ FULL VERIFICATION SUCCESS!');
    } else {
        console.error('❌ FULL VERIFICATION FAILED!');
    }

    // Cleanup
    db.prepare("DELETE FROM reservations WHERE id = ?").run(resvId);
    db.prepare("DELETE FROM revenue WHERE purchase_id = ?").run(purchase?.id);
    db.prepare("DELETE FROM client_purchases WHERE client_id = ?").run(client.id);
    db.prepare("DELETE FROM clients WHERE id = ?").run(client.id);
    db.prepare("DELETE FROM public_services WHERE id = ?").run(serviceId);
    console.log('Cleanup done.');
}

try {
    verifyFullFix();
} catch (e) {
    console.error('Verification script crashed:', e);
}
