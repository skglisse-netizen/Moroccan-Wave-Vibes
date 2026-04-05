import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, query, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

// Group & Permission Routes
router.get("/permissions", authenticate, async (_req: AuthRequest, res: Response) => {
  const perms = await getAll("SELECT * FROM permissions ORDER BY name");
  res.json(perms);
});

router.get("/groups", authenticate, async (_req: AuthRequest, res: Response) => {
  const groups = await getAll("SELECT * FROM groups ORDER BY name");
  const groupsWithPerms = [];
  for (const g of groups) {
    const perms = await getAll(`
      SELECT p.* 
      FROM permissions p
      JOIN group_permissions gp ON p.id = gp.permission_id
      WHERE gp.group_id = ?
    `, [g.id]);
    groupsWithPerms.push({ ...g, permissions: perms });
  }
  res.json(groupsWithPerms);
});

router.post("/groups", authenticate, checkPermission('add_groups'), async (req: AuthRequest, res: Response) => {
  const { name, permission_ids } = req.body;
  try {
    const result = await query("INSERT INTO groups (name) VALUES (?)", [name]);
    const groupId = result.lastInsertRowid;

    if (Array.isArray(permission_ids)) {
      for (const pid of permission_ids) {
        await query("INSERT INTO group_permissions (group_id, permission_id) VALUES (?, ?)", [groupId, pid]);
      }
    }

    await logAction(req.session.userId, 'CREATE_GROUP', `Created group ${name}`);
    res.status(201).json({ id: groupId, name });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.put("/groups/:id", authenticate, checkPermission('change_groups'), async (req: AuthRequest, res: Response) => {
  const { name, permission_ids } = req.body;
  try {
    await query("UPDATE groups SET name = ? WHERE id = ?", [name, req.params.id]);

    if (Array.isArray(permission_ids)) {
      await query("DELETE FROM group_permissions WHERE group_id = ?", [req.params.id]);
      for (const pid of permission_ids) {
        await query("INSERT INTO group_permissions (group_id, permission_id) VALUES (?, ?)", [req.params.id, pid]);
      }
    }

    await logAction(req.session.userId, 'UPDATE_GROUP', `Updated group ${name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/groups/:id", authenticate, checkPermission('delete_groups'), async (req: AuthRequest, res: Response) => {
  try {
    const g: any = await getOne("SELECT name FROM groups WHERE id = ?", [req.params.id]);
    await query("DELETE FROM groups WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_GROUP', `Deleted group ${g?.name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// User Management
router.get("/users", authenticate, checkPermission('view_users'), async (_req: AuthRequest, res: Response) => {
  const users = await getAll("SELECT id, username, role FROM users");
  const usersWithGroups = [];
  for (const u of users) {
    const groups = await getAll("SELECT group_id FROM user_groups WHERE user_id = ?", [u.id]);
    usersWithGroups.push({ ...u, group_ids: groups.map(g => g.group_id) });
  }
  res.json(usersWithGroups);
});

router.post("/users", authenticate, checkPermission('add_users'), async (req: AuthRequest, res: Response) => {
  const { username, password, role, group_ids } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query("INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hashedPassword, role || 'utilisateur']);
    const userId = result.lastInsertRowid;

    if (Array.isArray(group_ids)) {
      for (const gid of group_ids) {
        await query("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)", [userId, gid]);
      }
    }

    await logAction(req.session.userId, 'CREATE_USER', `Utilisateur créé: ${username}`);
    res.json({ success: true, id: userId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/users/:id", authenticate, checkPermission('change_users'), async (req: AuthRequest, res: Response) => {
  const { role, group_ids, password } = req.body;
  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, req.params.id]);
    }

    if (role) {
      await query("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
    }

    if (Array.isArray(group_ids)) {
      await query("DELETE FROM user_groups WHERE user_id = ?", [req.params.id]);
      for (const gid of group_ids) {
        await query("INSERT INTO user_groups (user_id, group_id) VALUES (?, ?)", [req.params.id, gid]);
      }
    }

    const user: any = await getOne("SELECT username FROM users WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'UPDATE_USER', `Utilisateur ${user?.username} mis à jour`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/users/:id", authenticate, checkPermission('delete_users'), async (req: AuthRequest, res: Response) => {
  if (parseInt(req.params.id) === req.session.userId) return res.status(400).json({ error: "Cannot delete self" });

  try {
    const user: any = await getOne("SELECT username FROM users WHERE id = ?", [req.params.id]);
    await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_USER', `Utilisateur supprimé: ${user?.username}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
