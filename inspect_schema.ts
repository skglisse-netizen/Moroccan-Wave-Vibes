import { query, getAll } from './database/db.ts';

async function inspectSchema() {
    const clientsCols = await getAll("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'clients'");
    console.log("Clients columns:", clientsCols);
    
    const staffCols = await getAll("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'staff'");
    console.log("Staff columns:", staffCols);
    process.exit(0);
}

inspectSchema().catch(err => {
    console.error(err);
    process.exit(1);
});
