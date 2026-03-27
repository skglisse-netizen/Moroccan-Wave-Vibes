import express, { Response } from 'express';
import bcrypt from 'bcryptjs';
import { getOne, getAll, query } from '../../database/db.js';
import { authenticate, AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/me", authenticate, async (req: AuthRequest, res: Response) => {
  const user: any = await getOne("SELECT id, username, role FROM users WHERE id = ?", [req.session.userId]);
  if (!user) return res.status(404).json({ error: "User not found" });

  // Get effective permissions
  let permissions = [];
  if (user.role === 'administrateur') {
    const perms = await getAll("SELECT codename FROM permissions");
    permissions = perms.map((p: any) => p.codename);
  } else {
    const perms = await getAll(`
      SELECT DISTINCT p.codename 
      FROM permissions p
      JOIN group_permissions gp ON p.id = gp.permission_id
      JOIN user_groups ug ON gp.group_id = ug.group_id
      WHERE ug.user_id = ?
    `, [user.id]);
    permissions = perms.map((p: any) => p.codename);
  }

  res.json({ ...user, permissions });
});

router.post("/login", async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body;
  const user: any = await getOne("SELECT * FROM users WHERE username = ?", [username]);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session.userId = user.id;
    req.session.lastActivity = Date.now();
    
    // Check if there's an active session on another device
    // A session is considered active if it has been seen in the last 5 minutes and hasn't logged out
    const activeConnection: any = await getOne(`
      SELECT id, session_id, last_seen_at, ip_address
      FROM user_connections 
      WHERE user_id = ? AND logout_at IS NULL 
        AND EXTRACT(EPOCH FROM (now() - last_seen_at)) < 300
      ORDER BY last_seen_at DESC LIMIT 1
    `, [user.id]);

    if (activeConnection && activeConnection.session_id !== req.sessionID) {
      return res.status(401).json({ 
        error: "Une session est déjà ouverte sur un autre équipement. Veuillez vous déconnecter de l'autre appareil ou attendre 5 minutes d'inactivité." 
      });
    }
    
    // Set this as the only valid session
    await query(
      "UPDATE users SET current_session_id = ? WHERE id = ?",
      [req.sessionID, user.id]
    );

    req.session.save(async (err) => {
      if (err) {
        console.error('Session save error:', err);
        res.status(500).json({ error: "Session save failed" });
      } else {
        // Get effective permissions
        let permissions = [];
        if (user.role === 'administrateur') {
          const perms = await getAll("SELECT codename FROM permissions");
          permissions = perms.map((p: any) => p.codename);
        } else {
          const perms = await getAll(`
            SELECT DISTINCT p.codename 
            FROM permissions p
            JOIN group_permissions gp ON p.id = gp.permission_id
            JOIN user_groups ug ON gp.group_id = ug.group_id
            WHERE ug.user_id = ?
          `, [user.id]);
          permissions = perms.map((p: any) => p.codename);
        }

        // Log connection
        const ip = req.ip || req.socket.remoteAddress;
        const ua = req.get('User-Agent');
        await query(
          "INSERT INTO user_connections (user_id, session_id, ip_address, user_agent) VALUES (?, ?, ?, ?)",
          [user.id, req.sessionID, ip, ua]
        );

        // Return token for client-side storage
        res.json({
          success: true,
          token: user.id.toString(),
          user: { id: user.id, username: user.username, role: user.role, permissions }
        });
      }
    });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

router.post("/logout", async (req: AuthRequest, res: Response) => {
  if (req.session.userId) {
    await query(
      "UPDATE user_connections SET logout_at = CURRENT_TIMESTAMP WHERE user_id = ? AND session_id = ? AND logout_at IS NULL",
      [req.session.userId, req.sessionID]
    );
  }
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

export default router;
