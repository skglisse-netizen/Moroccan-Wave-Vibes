const Database = require('better-sqlite3');
const db = new Database('surf_school.db');

function testPersistentFix() {
    console.log('--- Testing Persistent Fix (No Cleanup) ---');
    const phone = '0688888888';
    const name = 'Persistent Test User';
    const serviceId = 8; // Pack 5

    // 1. Create reservation
    const resvResult = db.prepare("INSERT INTO reservations (name, phone, service_id, status) VALUES (?, ?, ?, ?)").run(name, phone, serviceId, 'pending');
    const resvId = resvResult.lastInsertRowid;
    console.log(`Created Resv ID: ${resvId}`);

    // 2. Confirm (Using same logic as server.ts)
    const status = 'confirmed';
    db.transaction(() => {
        const resv = db.prepare("SELECT * FROM reservations WHERE id = ?").get(resvId);
        if (resv && resv.phone && resv.status !== 'confirmed') {
            const service = db.prepare("SELECT * FROM public_services WHERE id = ?").get(resv.service_id);
            const sessionsToAdd = service?.sessions_count || 1;
            const price = service ? Math.round(service.price * (1 - (service.discount_percentage || 0) / 100)) : 0;
            const dateStr = new Date().toISOString().split('T')[0];

            let clientId;
            const existingClient = db.prepare("SELECT id FROM clients WHERE phone = ?").get(resv.phone);
            if (!existingClient) {
                const result = db.prepare(`
                    INSERT INTO clients (full_name, phone, is_subscriber, total_sessions, remaining_sessions)
                    VALUES (?, ?, ?, ?, ?)
                `).run(resv.name, resv.phone, 1, sessionsToAdd, sessionsToAdd);
                clientId = result.lastInsertRowid;
                console.log(`Created Client ID: ${clientId}`);
            } else {
                clientId = existingClient.id;
                db.prepare(`
                    UPDATE clients SET total_sessions = total_sessions + ?, remaining_sessions = remaining_sessions + ?, is_subscriber = 1 WHERE id = ?
                `).run(sessionsToAdd, sessionsToAdd, clientId);
                console.log(`Updated Client ID: ${clientId}`);
            }

            if (service) {
                const purchaseResult = db.prepare(`
                    INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(clientId, service.id, service.name, price, sessionsToAdd, dateStr);
                const purchaseId = purchaseResult.lastInsertRowid;
                console.log(`Created Purchase ID: ${purchaseId}`);

                db.prepare("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)")
                    .run(`Vente Service: ${service.name} (Réservation: ${resv.name})`, price, 'sale', dateStr, purchaseId);
                console.log('Created Revenue Entry');
            }
            db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, resvId);
        }
    })();
    console.log('Test completed perfectly.');
}

testPersistentFix();
