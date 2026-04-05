import Database from 'better-sqlite3';

const db = new Database('surf_school.db');

try {
  console.log('--- Recent Reservations ---');
  const reservations = db.prepare('SELECT * FROM reservations ORDER BY created_at DESC LIMIT 5').all();
  console.log(JSON.stringify(reservations, null, 2));

  console.log('--- Recent Contact Messages ---');
  const messages = db.prepare('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 5').all();
  console.log(JSON.stringify(messages, null, 2));

  console.log('--- Notifications ---');
  const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 5').all();
  console.log(JSON.stringify(notifications, null, 2));
} catch (e) {
  console.error(e);
}
db.close();
