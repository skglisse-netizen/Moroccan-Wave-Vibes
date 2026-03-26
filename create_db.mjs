import pkg from 'pg';
const { Client } = pkg;

async function createDatabase() {
    // Note: URL encoding for '@' is '%40'
    const client = new Client({
        connectionString: "postgresql://postgres:T%40st1984@localhost:5432/postgres"
    });
    try {
        await client.connect();
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'surf_school'");
        if (res.rowCount === 0) {
            console.log("Création de la base de données surf_school en cours...");
            await client.query("CREATE DATABASE surf_school");
            console.log("Base de données 'surf_school' créée avec succès !");
        } else {
            console.log("La base de données 'surf_school' existe déjà.");
        }
    } catch (e) {
        console.error("Échec :", e.message);
    } finally {
        await client.end();
    }
}
createDatabase();
