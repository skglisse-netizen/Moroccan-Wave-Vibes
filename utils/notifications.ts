import { WebSocket } from 'ws';
import { query } from '../database/db.js';

export const clients = new Set<WebSocket>();

export const broadcastNotification = (notification: any) => {
  const data = JSON.stringify(notification);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

export const createNotification = async (type: string, title: string, message: string, link: string = '') => {
  try {
    const result = await query(
      "INSERT INTO notifications (type, title, message, link) VALUES (?, ?, ?, ?)",
      [type, title, message, link]
    );

    const notification = {
      id: result.lastInsertRowid,
      type,
      title,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    };

    broadcastNotification(notification);
    return notification;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};
