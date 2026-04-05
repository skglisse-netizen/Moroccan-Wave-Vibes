import { db, query, getOne, getAll } from './database/db.ts';
import { initDb } from './database/init.ts';

async function testCreation() {
    console.log("Testing creation...");
    
    // Test Staff Creation
    const staffName = "Test Staff " + Date.now();
    const staffId = await db.transaction(async (tx) => {
        const result = await tx.query("INSERT INTO staff (full_name, birth_date, cin, type, status) VALUES (?, ?, ?, ?, ?)",
            [staffName, "1990-01-01", "CIN123", "moniteur", "salarie"]);
        const id = result.lastInsertRowid;
        console.log("Inserted staff ID:", id);
        const autoMatricule = `ST${String(id).padStart(4, '0')}`;
        await tx.query("UPDATE staff SET matricule = ? WHERE id = ?", [autoMatricule, id]);
        return id;
    })();
    
    const createdStaff = await getOne("SELECT * FROM staff WHERE id = ?", [staffId]);
    console.log("Created Staff:", createdStaff);
    
    // Test Client Creation
    const clientName = "Test Client " + Date.now();
    const clientId = await db.transaction(async (tx) => {
        const result = await tx.query(`
            INSERT INTO clients (full_name, phone, email, address, is_subscriber, total_sessions, remaining_sessions)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [clientName, "0600000000", "test@example.com", "Address", 0, 0, 0]);
        const id = result.lastInsertRowid;
        console.log("Inserted client ID:", id);
        const autoMatricule = `CL${String(id).padStart(4, '0')}`;
        await tx.query("UPDATE clients SET matricule = ? WHERE id = ?", [autoMatricule, id]);
        return id;
    })();
    
    const createdClient = await getOne("SELECT * FROM clients WHERE id = ?", [clientId]);
    console.log("Created Client:", createdClient);
    
    // Cleanup
    await query("DELETE FROM staff WHERE id = ?", [staffId]);
    await query("DELETE FROM clients WHERE id = ?", [clientId]);
    console.log("Finished test.");
    process.exit(0);
}

testCreation().catch(err => {
    console.error(err);
    process.exit(1);
});
