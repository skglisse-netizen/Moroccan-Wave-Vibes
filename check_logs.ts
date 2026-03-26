import { getAll } from './database/db.js';

async function check() {
  try {
    const logs = await getAll("SELECT * FROM logs ORDER BY created_at DESC LIMIT 20");
    console.log("Recent Logs:", JSON.stringify(logs, null, 2));
    
    const settings = await getAll("SELECT * FROM settings");
    console.log("Current Settings:", JSON.stringify(settings, null, 2));

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    process.exit();
  }
}

check();
