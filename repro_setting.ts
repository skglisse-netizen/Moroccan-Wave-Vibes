import { query, getAll } from './database/db.js';

async function test() {
  try {
    console.log("Updating app_name...");
    await query(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value
    `, ['app_name', 'TEST NAME ' + Date.now()]);
    console.log("Update SUCCESSFUL");
    
    const settings = await getAll("SELECT * FROM settings WHERE key = 'app_name'");
    console.log("Current app_name:", JSON.stringify(settings, null, 2));
  } catch (err: any) {
    console.error("Update FAILED:", err.message);
  }
  process.exit();
}

test();
