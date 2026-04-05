import express, { Response } from 'express';
import { db, query, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, async (_req, res) => {
  const staff = await getAll("SELECT * FROM staff ORDER BY full_name ASC");
  res.json(staff);
});

router.post("/", authenticate, checkPermission('add_staff'), async (req: AuthRequest, res: Response) => {
  try {
    const { full_name, birth_date, cin, type, status } = req.body;
    const staffId = await db.transaction(async (tx) => {
      const result = await tx.query("INSERT INTO staff (full_name, birth_date, cin, type, status) VALUES (?, ?, ?, ?, ?)",
        [full_name, birth_date, cin, type, status]);
      
      return result.lastInsertRowid;
    })();

    await logAction(req.session.userId, 'CREATE_STAFF', `Personnel ajouté: ${full_name}`);
    res.json({ id: staffId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_staff'), async (req: AuthRequest, res: Response) => {
  const { full_name, birth_date, cin, type, status } = req.body;
  try {
    await query("UPDATE staff SET full_name = ?, birth_date = ?, cin = ?, type = ?, status = ? WHERE id = ?",
      [full_name, birth_date, cin, type, status, req.params.id]);
    await logAction(req.session.userId, 'UPDATE_STAFF', `Personnel modifié: ${full_name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_staff'), async (req: AuthRequest, res: Response) => {
  try {
    const s: any = await getOne("SELECT full_name FROM staff WHERE id = ?", [req.params.id]);
    await query("DELETE FROM staff WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_STAFF', `Personnel supprimé: ${s?.full_name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
