import { getAll } from './database/db.js';

async function check() {
  try {
    const conn = await getAll("SELECT * FROM user_connections ORDER BY login_at DESC LIMIT 10");
    console.log("User Connections:", JSON.stringify(conn, null, 2));
    
    const visits = await getAll("SELECT * FROM daily_visits LIMIT 10");
    console.log("Daily Visits:", JSON.stringify(visits, null, 2));

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    process.exit();
  }
}

check();
