import { query, getOne } from './database/db.js';
import { initDb } from './database/init.js';

async function test() {
  try {
    console.log("Initializing DB...");
    await initDb();
    
    console.log("Testing write...");
    const testKey = 'test_write_' + Date.now();
    await query("INSERT INTO settings (key, value) VALUES (?, ?)", [testKey, 'working']);
    
    const result: any = await getOne("SELECT value FROM settings WHERE key = ?", [testKey]);
    if (result && result.value === 'working') {
      console.log("Write test SUCCESSFUL");
      await query("DELETE FROM settings WHERE key = ?", [testKey]);
    } else {
      console.log("Write test FAILED: Result mismatch", result);
    }
  } catch (err) {
    console.error("Write test FAILED with error:", err);
  } finally {
    process.exit();
  }
}

test();
