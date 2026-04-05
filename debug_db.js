const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');

try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        logout_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    console.log("Table user_connections created or already exists.");
} catch (err) {
    console.error("Error creating table:", err.message);
    console.error(err.stack);
}
