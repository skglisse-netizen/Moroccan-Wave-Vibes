import express, { Response } from 'express';
import { getOne, getAll } from '../../database/db.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, checkPermission('view_logs'), async (req: AuthRequest, res: Response) => {
  const { limit = 25, offset = 0, action, date, username } = req.query;
  let sql = `
    SELECT l.*, u.username 
    FROM logs l 
    LEFT JOIN users u ON l.user_id = u.id 
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIdx = 1;

  if (action) {
    sql += ` AND l.action LIKE ?`;
    params.push(`%${action}%`);
  }
  if (date) {
    sql += ` AND l.created_at::date = ?`;
    params.push(date);
  }
  if (username) {
    sql += ` AND u.username LIKE ?`;
    params.push(`%${username}%`);
  }

  sql += ` ORDER BY l.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), parseInt(offset as string));

  const logs = await getAll(sql, params);
  const totalCount: any = await getOne("SELECT COUNT(*) as count FROM logs");

  res.json({ logs, total: parseInt(totalCount.count) });
});

export default router;
