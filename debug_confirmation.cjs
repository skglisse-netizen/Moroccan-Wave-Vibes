const Database = require('better-sqlite3');
const db = new Database('surf_school.db');

function debugConfirmation(resvId) {
    console.log(`--- Debugging Confirmation for Resv ID: ${resvId} ---`);
    const status = 'confirmed';
    
    db.transaction(() => {
        const resv = db.prepare("SELECT * FROM reservations WHERE id = ?").get(resvId);
        console.log('Resv found:', resv);

        if (resv && resv.phone && resv.status !== 'confirmed') {
            const service = db.prepare("SELECT * FROM public_services WHERE id = ?").get(resv.service_id);
            console.log('Service found:', service);
            
            const sessionsToAdd = service?.sessions_count || 1;
            const price = service ? Math.round(service.price * (1 - (service.discount_percentage || 0) / 100)) : 0;
            const dateStr = new Date().toISOString().split('T')[0];
            console.log(`SessionsToAdd: ${sessionsToAdd}, Price: ${price}, Date: ${dateStr}`);

            let clientId;
            const existingClient = db.prepare("SELECT id FROM clients WHERE phone = ?").get(resv.phone);
            console.log('Existing Client:', existingClient);

            if (!existingClient) {
                const result = db.prepare(`
                    INSERT INTO clients (full_name, phone, email, is_subscriber, total_sessions, remaining_sessions)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(resv.name, resv.phone, resv.email || null, sessionsToAdd > 0 ? 1 : 0, sessionsToAdd, sessionsToAdd);
                clientId = result.lastInsertRowid;
                console.log('Created NEW Client ID:', clientId);
            } else {
                clientId = existingClient.id;
                db.prepare(`
                    UPDATE clients 
                    SET total_sessions = total_sessions + ?, 
                        remaining_sessions = remaining_sessions + ?,
                        is_subscriber = CASE WHEN ? > 0 THEN 1 ELSE is_subscriber END
                    WHERE id = ?
                `).run(sessionsToAdd, sessionsToAdd, sessionsToAdd, clientId);
                console.log('Updated EXISTING Client ID:', clientId);
            }

            if (service) {
                const purchaseResult = db.prepare(`
                    INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
                    VALUES (?, ?, ?, ?, ?, ?)
                `).run(clientId, service.id, service.name, price, sessionsToAdd, dateStr);
                const purchaseId = purchaseResult.lastInsertRowid;
                console.log('Created Purchase ID:', purchaseId);

                const revenueType = sessionsToAdd > 0 ? 'sale' : 'other';
                db.prepare("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)")
                    .run(`Vente Service: ${service.name} (Réservation: ${resv.name})`, price, revenueType, dateStr, purchaseId);
                console.log('Created Revenue Entry');
            }
            
            db.prepare("UPDATE reservations SET status = ? WHERE id = ?").run(status, resvId);
            console.log('Reservation status updated to confirmed');
        } else {
            console.log('Condition (resv && resv.phone && resv.status !== "confirmed") FAILED');
        }
    })();
}

try {
    debugConfirmation(8);
} catch (e) {
    console.error('Debug script crash:', e);
}
