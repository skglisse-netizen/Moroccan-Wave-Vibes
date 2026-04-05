import { db, query, getOne, getAll } from './database/db.ts';

async function checkDatabase() {
    const clients = await getAll("SELECT id, full_name, matricule FROM clients ORDER BY id DESC LIMIT 5");
    console.log("Latest Clients:", clients);
    
    const staff = await getAll("SELECT id, full_name, matricule FROM staff ORDER BY id DESC LIMIT 5");
    console.log("Latest Staff:", staff);
    process.exit(0);
}

checkDatabase().catch(err => {
    console.error(err);
    process.exit(1);
});
