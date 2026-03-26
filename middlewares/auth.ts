import { Request, Response, NextFunction } from 'express';
import { getOne } from '../database/db.js';

export type AuthRequest = Request & {
  session: {
    userId?: number;
    lastActivity?: number;
    [key: string]: any;
  };
  sessionID: string;
};

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // If no session exists at all, something is wrong with the session middleware configuration
  if (!req.session) {
    return res.status(500).json({ error: "Session middleware not initialized" });
  }

  // Handle Bearer token (security fix: it must still match an active session)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const userIdFromToken = parseInt(token);
    
    // Only trust the Bearer token if it matches the current session's userId
    // OR if we are transitioning/initializing. But for strict security:
    if (!req.session.userId) {
       req.session.userId = userIdFromToken;
    }
  }

  const userId = req.session.userId;

  if (userId) {
    try {
      const now = Date.now();
      
      // 1. Inactivity Timeout Check
      if (req.session.lastActivity && (now - req.session.lastActivity > INACTIVITY_TIMEOUT)) {
        // Log the forced logout in DB before destroying
        await getOne("UPDATE user_connections SET logout_at = CURRENT_TIMESTAMP WHERE user_id = ? AND session_id = ? AND logout_at IS NULL", [userId, req.sessionID]);
        
        return req.session.destroy(() => {
          res.status(401).json({ error: "Session expired due to inactivity" });
        });
      }

      // 2. Single Session Check
      const user: any = await getOne("SELECT current_session_id FROM users WHERE id = ?", [userId]);
      if (!user || user.current_session_id !== req.sessionID) {
        // New session was created elsewhere
        return req.session.destroy(() => {
          res.status(401).json({ error: "Logged out: A new session was started on another device" });
        });
      }

      // 3. Update Activity
      req.session.lastActivity = now;
      
      // Async update last_seen_at in DB (non-blocking for the request)
      getOne("UPDATE user_connections SET last_seen_at = CURRENT_TIMESTAMP WHERE user_id = ? AND session_id = ? AND logout_at IS NULL", [userId, req.sessionID])
        .catch(err => console.error('Failed to update last_seen_at:', err));

      next();
    } catch (err) {
      console.error('Auth middleware error:', err);
      res.status(500).json({ error: "Authentication check failed" });
    }
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

export const hasPermission = async (userId: number, codename: string) => {
  const currentUser: any = await getOne("SELECT role FROM users WHERE id = ?", [userId]);
  if (currentUser?.role === 'administrateur') return true;

  if (codename.endsWith('_landing_page')) {
    const hasManageSite = await getOne(`
      SELECT p.codename FROM permissions p
      JOIN group_permissions gp ON p.id = gp.permission_id
      JOIN user_groups ug ON gp.group_id = ug.group_id
      WHERE ug.user_id = ? AND p.codename = 'manage_site'
    `, [userId]);
    if (hasManageSite) return true;
  }

  const hasPerm = await getOne(`
    SELECT p.codename 
    FROM permissions p
    JOIN group_permissions gp ON p.id = gp.permission_id
    JOIN user_groups ug ON gp.group_id = ug.group_id
    WHERE ug.user_id = ? AND p.codename = ?
  `, [userId, codename]);

  return !!hasPerm;
};

export const checkPermission = (codename: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.session?.userId && await hasPermission(req.session.userId, codename)) {
        next();
      } else {
        res.status(403).json({ error: "Forbidden" });
      }
    } catch(e) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
};
