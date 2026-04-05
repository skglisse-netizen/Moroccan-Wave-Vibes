const db = require('better-sqlite3')('surf_school.db');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Tables in SQLite:", tables.map(t => t.name).join(', '));

for (const table of tables) {
  if (table.name === 'sqlite_sequence') continue;
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table.name}`).get();
  console.log(`- ${table.name}: ${count.count} rows`);
}
