import pkg from 'pg';
const { Client } = pkg;

async function verifyAll() {
    const client = new Client({
        connectionString: "postgresql://postgres:T%40st1984@localhost:5432/surf_school"
    });
    try {
        await client.connect();
        console.log("DATABASE CONNECTION: SUCCESS");
        
        const tables = [
            'users', 'settings', 'landing_page_content', 'public_services', 
            'spots', 'conseils', 'reservations', 'clients', 'daily_visits', 'rental_items'
        ];
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`Table '${table}' count:`, res.rows[0].count);
            } catch (err) {
                console.error(`Table '${table}' ERROR:`, err.message);
            }
        }
    } catch (e) {
        console.error("DATABASE CONNECTION ERROR:", e.message);
    } finally {
        await client.end();
    }
}
verifyAll();
