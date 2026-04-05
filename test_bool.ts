import { query } from './database/db.js';

async function test() {
  try {
    console.log("Testing boolean with integer 1...");
    // landing_page_content.is_active is BOOLEAN
    await query("UPDATE landing_page_content SET is_active = ? WHERE section = 'hero'", [1]);
    console.log("Update with 1 SUCCESSFUL");
  } catch (err: any) {
    console.error("Update with 1 FAILED:", err.message);
  }

  try {
    console.log("Testing boolean with true...");
    await query("UPDATE landing_page_content SET is_active = ? WHERE section = 'hero'", [true]);
    console.log("Update with true SUCCESSFUL");
  } catch (err: any) {
    console.error("Update with true FAILED:", err.message);
  }
  
  process.exit();
}

test();
