import { query } from '../database/db.js';

export async function logAction(userId: number, action: string, details: string) {
  try {
    await query("INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)", [userId, action, details]);
  } catch (err) {
    console.error('Logging error:', err);
  }
}
