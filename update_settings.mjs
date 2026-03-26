import pkg from 'pg';
const { Client } = pkg;

async function update() {
    const client = new Client({
        connectionString: "postgresql://postgres:T%40st1984@localhost:5432/surf_school"
    });
    try {
        await client.connect();
        const res = await client.query("UPDATE settings SET value = '' WHERE key IN ('app_name', 'app_logo')");
        console.log("UPDATE SUCCESS:", res.rowCount, "rows affected.");
        
        const verify = await client.query("SELECT * FROM settings WHERE key IN ('app_name', 'app_logo')");
        console.log("VERIFICATION:", JSON.stringify(verify.rows, null, 2));
    } catch (e) {
        console.error("ERROR:", e.message);
    } finally {
        await client.end();
    }
}
update();
