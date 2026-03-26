const db = require('better-sqlite3')('surf_school.db');

try {
    const stmt1 = db.prepare("UPDATE services SET description = REPLACE(description, 'scéance', 'séance')");
    stmt1.run();
    console.log("Updated services table.");
} catch (e) { console.error("Error updating services:", e.message); }

try {
    const stmt2 = db.prepare("UPDATE public_services SET description = REPLACE(description, 'scéance', 'séance')");
    stmt2.run();
    console.log("Updated public_services table.");
} catch (e) { console.error("Error updating public_services:", e.message); }

try {
    const stmt3 = db.prepare("DELETE FROM conseils WHERE title = 'test' OR title = 'test123'");
    const info = stmt3.run();
    console.log(`Deleted ${info.changes} fake conseils.`);
} catch (e) { console.error("Error deleting from conseils:", e.message); }

console.log("Database update done.");
