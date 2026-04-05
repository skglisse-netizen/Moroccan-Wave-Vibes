import { getOne } from './database/db.js';

async function run() {
    try {
        const table = await getOne(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public' AND tablename = 'user_connections'
        `);
        if (table) {
            console.log("Table 'user_connections' exists.");
            const rows: any = await getOne("SELECT COUNT(*) as count FROM user_connections");
            console.log("Row count:", rows.count);
        } else {
            console.log("Table 'user_connections' DOES NOT exist.");
        }
    } catch (err) {
        console.error("Error checking table:", err);
    } finally {
        process.exit(0);
    }
}
run();
