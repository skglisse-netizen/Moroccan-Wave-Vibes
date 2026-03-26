import pkg from 'pg';
const { Client } = pkg;

async function check() {
    const client = new Client({
        connectionString: "postgresql://postgres:T%40st1984@localhost:5432/surf_school"
    });
    try {
        await client.connect();
        const res = await client.query("SELECT * FROM landing_page_content");
        console.log("CONTENT:", JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e.message);
    } finally {
        await client.end();
    }
}
check();
