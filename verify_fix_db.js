import Database from 'better-sqlite3';

const db = new Database('surf_school.db');

async function verify() {
  console.log('--- Verifying Database State ---');
  
  // Check if tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('Tables:', tables.map(t => t.name).join(', '));

  // Check recent entries
  const recentRes = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 1').get();
  console.log('Last Reservation:', recentRes);

  const recentContact = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 1').get();
  console.log('Last Contact:', recentContact);
  
  console.log('--- End of Verification ---');
}

verify().catch(console.error).finally(() => db.close());
