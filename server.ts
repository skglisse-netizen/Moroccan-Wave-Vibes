import express, { Response } from "express";
import { createServer as createViteServer } from "vite";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import multer from 'multer';
import fs from 'fs';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import compression from 'compression';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

import { db, query, getOne, getAll } from './database/db.js';
import { initDb } from './database/init.js';
import { logAction } from './utils/logger.js';
import { clients, createNotification } from './utils/notifications.js';
import { authenticate, checkPermission, hasPermission, AuthRequest } from './middlewares/auth.js';
import usersRoutes from './routes/api/users.js';
import authRoutes from './routes/api/auth.js';
import stockRoutes from './routes/api/stock.js';
import financesRoutes from './routes/api/finances.js';
import rentalsRoutes from './routes/api/rentals.js';
import clientsRoutes from './routes/api/clients.js';
import lessonsRoutes from './routes/api/lessons.js';
import staffRoutes from './routes/api/staff.js';
import landingRoutes from './routes/api/landing.js';
import debtsLoansRoutes from './routes/api/debts_loans.js';
import logsRoutes from './routes/api/logs.js';
import settingsRoutes from './routes/api/settings.js';

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}





async function startServer() {
  await initDb();
  const app = express();
  app.use(compression());
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = Number(process.env.PORT) || 3000;
  const upload = multer({ dest: 'uploads/' });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(session({
    secret: process.env.SESSION_SECRET || "surf-school-secret-key",
    resave: true,
    saveUninitialized: true,
    proxy: isProduction,
    cookie: {
      secure: isProduction && process.env.HTTPS === 'true',
      sameSite: (isProduction && process.env.HTTPS === 'true') ? 'none' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Trust proxy for secure cookies
  app.set('trust proxy', true);

  // Register extracted routes
  app.use('/api', usersRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/stock', stockRoutes);
  app.use('/api', financesRoutes);
  app.use('/api/admin/rentals', rentalsRoutes);
  app.use('/api/clients', clientsRoutes);
  app.use('/api/lessons', lessonsRoutes);
  app.use('/api/staff', staffRoutes);
  app.use('/api/admin', landingRoutes);
  app.use('/api/debts_loans', debtsLoansRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/settings', settingsRoutes);

  // Export Route




  // Export Route
  app.get("/api/export/:type", authenticate, async (req, res) => {
    const { type } = req.params;
    let data: any[] = [];
    let filename = `export_${type}_${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'expenses') data = await getAll("SELECT * FROM expenses");
    else if (type === 'revenue') data = await getAll("SELECT * FROM revenue");
    else if (type === 'lessons') data = await getAll("SELECT * FROM lessons");
    else if (type === 'staff') data = await getAll("SELECT * FROM staff");
    else if (type === 'debts_loans') data = await getAll("SELECT * FROM debts_loans");

    if (data.length === 0) return res.status(404).send("No data found");

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  });

  // Full Backup Route
  app.get("/api/backup/full", authenticate, checkPermission('view_settings'), async (req: AuthRequest, res: Response) => {
    const tables = [
      'users', 'groups', 'permissions', 'group_permissions', 'user_groups',
      'expenses', 'revenue', 'lessons', 'lesson_staff', 'staff',
      'categories', 'clients', 'client_purchases', 'stock',
      'reservations', 'rentals', 'rental_items', 'contact_messages',
      'landing_page_content', 'public_services', 'spots', 'conseils',
      'debts_loans', 'settings', 'logs'
    ];

    const backup: any = {};
    try {
      for (const table of tables) {
        try {
          const rows = await getAll(`SELECT * FROM ${table}`);
          backup[table] = rows;
        } catch (e) {
          console.warn(`Table ${table} not found or inaccessible during backup`);
        }
      }

      const filename = `backup_full_${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(JSON.stringify(backup, null, 2));
      await logAction(req.session.userId, 'FULL_BACKUP', 'Sauvegarde complÃ¨te effectuÃ©e');
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Restore Route
  app.post("/api/backup/restore", authenticate, checkPermission('view_settings'), upload.single('file'), async (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Aucun fichier tÃ©lÃ©chargÃ©" });

    try {
      const backup = JSON.parse(fs.readFileSync(file.path, 'utf-8'));
      const tables = Object.keys(backup);

      await db.transaction(async (tx) => {
        // Order tables to avoid foreign key issues (rough order)
        const orderedTables = [
          'user_groups', 'group_permissions', 'lesson_staff', 'rental_items',
          'lesson_clients', 'client_purchases', 'debts_loans', 'revenue',
          'expenses', 'lessons', 'rentals', 'reservations', 'staff',
          'stock', 'clients', 'categories', 'users', 'groups', 'permissions',
          'settings', 'logs', 'landing_page_content', 'public_services',
          'spots', 'conseils', 'contact_messages', 'notifications', 'app_notifications'
        ];

        // Delete in order
        for (const table of orderedTables) {
          if (tables.includes(table)) {
            await tx.query(`DELETE FROM ${table}`);
          }
        }

        // Insert in reverse order
        for (const table of orderedTables.reverse()) {
          if (tables.includes(table)) {
            const rows = backup[table];
            if (rows && rows.length > 0) {
              const columns = Object.keys(rows[0]);
              const placeholders = columns.map(() => `?`).join(',');
              const sql = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`;

              for (const row of rows) {
                await tx.query(sql, columns.map(col => row[col]));
              }
            }
          }
        }
      })();

      fs.unlinkSync(file.path);
      await logAction(req.session.userId, 'RESTORE_BACKUP', 'Restauration complÃ¨te effectuÃ©e');
      res.json({ success: true, message: "Restauration rÃ©ussie" });
    } catch (err: any) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      console.error('Restore error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Visitor Analytics// Real-time tracking
  const activeVisitors = new Map<string, number>();
  const activeStaff = new Map<number, { lastSeen: number, username: string, role: string, sessionId: string }>();

  // Cleanup stale sessions every minute
  setInterval(() => {
    const now = Date.now();
    // Cleanup visitors
    for (const [ip, lastSeen] of activeVisitors.entries()) {
      if (now - lastSeen > 60000) activeVisitors.delete(ip);
    }
    // Cleanup staff
    for (const [userId, data] of activeStaff.entries()) {
      if (now - data.lastSeen > 60000) activeStaff.delete(userId);
    }
  }, 30000);

  app.post("/api/public/visit", async (req, res) => {
    const { session_id } = req.body;
    if (session_id) {
      activeVisitors.set(session_id, Date.now());
      try {
        await query(`
          INSERT INTO daily_visits (session_id, date) 
          VALUES (?, CURRENT_DATE)
          ON CONFLICT (session_id, date) DO NOTHING
        `, [session_id]);
      } catch (e) {
        console.error("Error logging visit:", e);
      }
    }
    res.json({ success: true, active: activeVisitors.size });
  });

  // Staff Presence & Analytics
  app.post("/api/auth/ping", authenticate, async (req: AuthRequest, res) => {
    const userId = req.session.userId!;
    const user: any = await getOne("SELECT username, role FROM users WHERE id = ?", [userId]);
    if (user) {
      activeStaff.set(userId, {
        lastSeen: Date.now(),
        username: user.username,
        role: user.role,
        sessionId: req.sessionID
      });

      // Ensure a connection record exists for this session, then update last_seen_at
      const connection: any = await getOne(
        "SELECT id FROM user_connections WHERE user_id = ? AND session_id = ? AND logout_at IS NULL",
        [userId, req.sessionID]
      );

      if (!connection) {
        const ip = req.ip || req.socket.remoteAddress;
        const ua = req.get('User-Agent');
        await query(
          "INSERT INTO user_connections (user_id, session_id, ip_address, user_agent) VALUES (?, ?, ?, ?)",
          [userId, req.sessionID, ip, ua]
        );
      } else {
        await query(
          "UPDATE user_connections SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?",
          [connection.id]
        );
      }
    }
    res.sendStatus(200);
  });

  app.get("/api/admin/staff/active", authenticate, checkPermission('view_staff'), (req, res) => {
    const list = Array.from(activeStaff.values()).map(s => ({
      username: s.username,
      role: s.role,
      lastSeen: s.lastSeen
    }));
    res.json(list);
  });

  app.get("/api/admin/staff/history", authenticate, checkPermission('view_logs'), async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const history = await getAll(`
      SELECT uc.*, u.username, u.role
      FROM user_connections uc
      JOIN users u ON uc.user_id = u.id
      ORDER BY uc.login_at DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset]);

    const total: any = await getOne("SELECT COUNT(*) as count FROM user_connections");
    res.json({ history, total: total.count });
  });

  app.get("/api/admin/stats/visitors", authenticate, async (req, res) => {
    try {
      const activeCount = activeVisitors.size;
      const { filter = 'daily' } = req.query;
      const history: any[] = [];

      if (filter === 'daily') {
        const now = new Date();
        const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
        const month = req.query.month ? parseInt(req.query.month as string) - 1 : now.getMonth();

        const lastDay = new Date(year, month + 1, 0).getDate();
        for (let i = 1; i <= lastDay; i++) {
          const d = new Date(year, month, i);
          const dateStr = format(d, 'yyyy-MM-dd');
          const row: any = await getOne("SELECT COUNT(DISTINCT session_id) as total FROM daily_visits WHERE date = ?", [dateStr]);
          history.push({
            date: dateStr,
            name: format(d, 'd', { locale: fr }),
            visitors: parseInt(row.total) || 0
          });
        }
      } else if (filter === 'monthly') {
        const year = new Date().getFullYear();
        for (let m = 0; m < 12; m++) {
          const monthStr = `${year}-${(m + 1).toString().padStart(2, '0')}`;
          const row: any = await getOne("SELECT COUNT(DISTINCT session_id) as total FROM daily_visits WHERE to_char(date::date, 'YYYY-MM') = ?", [monthStr]);
          history.push({
            date: monthStr,
            name: format(new Date(year, m, 1), 'MMM', { locale: fr }),
            visitors: parseInt(row.total) || 0
          });
        }
      } else if (filter === 'yearly') {
        const currentYear = new Date().getFullYear();
        for (let y = currentYear - 4; y <= currentYear; y++) {
          const row: any = await getOne("SELECT COUNT(DISTINCT session_id) as total FROM daily_visits WHERE to_char(date::date, 'YYYY') = ?", [y.toString()]);
          history.push({
            date: y.toString(),
            name: y.toString(),
            visitors: parseInt(row.total) || 0
          });
        }
      }

      res.json({ activeCount, history });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Public Landing Page API ---
  app.get("/api/public/content", async (_req, res) => {
    const content = await getAll("SELECT * FROM landing_page_content");
    const services = await getAll("SELECT * FROM public_services WHERE is_active = TRUE");
    const spots = await getAll("SELECT * FROM spots WHERE is_active = TRUE ORDER BY created_at DESC");
    const conseils = await getAll("SELECT * FROM conseils WHERE is_active = TRUE");
    res.json({ content, services, spots, conseils });
  });

  app.post("/api/public/reservations", async (req, res) => {
    const { name, email, phone, service_id, date, time, guests } = req.body;

    // Minimum requirements: name, email and service_id
    if (!name || !email || !service_id) {
      console.error('Reservation validation failed: Missing basic fields', { name, email, service_id });
      return res.status(400).json({ error: "Champs obligatoires manquants (Nom, Email, Service)" });
    }

    try {
      // Create notification message with available info
      const dateStr = date ? `le ${date}` : "date Ã  confirmer";
      const timeStr = time ? ` Ã  ${time}` : "";

      const result = await query(`
        INSERT INTO reservations (name, email, phone, service_id, date, time, guests)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [name, email, phone, service_id, date || "", time || "", guests || 1]);

      await createNotification(
        'reservation',
        'Nouvelle RÃ©servation',
        `${name} a rÃ©servÃ© ${dateStr}${timeStr} (${guests || 1} pers.)`,
        '/admin/reservations',
        result.lastInsertRowid as number,
        'reservation'
      );

      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      console.error('Reservation error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/public/contact", async (req, res) => {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      console.error('Contact validation failed: Missing fields', { name, email, message });
      return res.status(400).json({ error: "Champs obligatoires manquants" });
    }
    try {
      const result = await query(
        `INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)`,
        [name, email, subject, message]
      );

      await createNotification(
        'message',
        'Nouveau Message',
        `${name} (${email}): ${subject || 'Sans sujet'}`,
        '/admin/messages',
        result.lastInsertRowid as number,
        'message'
      );

      // --- Send email via SMTP if configured ---
      try {
        const smtpHost = await getOne("SELECT value FROM settings WHERE key = 'smtp_host'") as any;
        const smtpPort = await getOne("SELECT value FROM settings WHERE key = 'smtp_port'") as any;
        const smtpUser = await getOne("SELECT value FROM settings WHERE key = 'smtp_user'") as any;
        const smtpPass = await getOne("SELECT value FROM settings WHERE key = 'smtp_pass'") as any;
        const smtpFrom = await getOne("SELECT value FROM settings WHERE key = 'smtp_from'") as any;
        const smtpTo = await getOne("SELECT value FROM settings WHERE key = 'smtp_to'") as any;

        if (smtpHost?.value && smtpUser?.value && smtpPass?.value && smtpTo?.value) {
          const transporter = nodemailer.createTransport({
            host: smtpHost.value,
            port: parseInt(smtpPort?.value || '587'),
            secure: parseInt(smtpPort?.value || '587') === 465,
            auth: { user: smtpUser.value, pass: smtpPass.value },
          });
          await transporter.sendMail({
            from: smtpFrom?.value || smtpUser.value,
            to: smtpTo.value,
            replyTo: email,
            subject: `[Contact Site] ${subject || 'Nouveau message'} â€” ${name}`,
            text: `Nom: ${name}\nEmail: ${email}\nSujet: ${subject || '-'}\n\n${message}`,
            html: `<p><strong>Nom:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Sujet:</strong> ${subject || '-'}</p><hr/><p style="white-space:pre-wrap">${message}</p>`,
          });
        }
      } catch (mailErr) {
        console.error('Email sending failed (non-blocking):', mailErr);
      }
      // -----------------------------------------

      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      console.error('Contact error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // --- Contact Messages API (Admin) ---
  app.get("/api/contact_messages", authenticate, checkPermission('view_messages'), async (_req, res) => {
    const messages = await getAll("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(messages);
  });

  app.patch("/api/contact_messages/:id/read", authenticate, async (req: AuthRequest, res: Response) => {
    try {
      await query("UPDATE contact_messages SET is_read = TRUE WHERE id = ?", [req.params.id]);
      // Auto-mark notification as read
      await query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'message' AND reference_id = ?", [req.params.id]);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/contact_messages/:id", authenticate, checkPermission('delete_messages'), async (req: AuthRequest, res: Response) => {
    try {
      await query("DELETE FROM contact_messages WHERE id = ?", [req.params.id]);
      await logAction(req.session.userId, 'DELETE_MESSAGE', `Message ${req.params.id} supprimÃ©`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Placeholder removed, upload is now at the top of the file
  if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
  }

  // Helper to slugify filenames
  const slugify = (text: string) => {
    const parts = text.split('.');
    const ext = parts.pop() || '';
    const name = parts.join('.');
    return name
      .toString()
      .normalize('NFD')                   // split accented characters into their base characters and diacritical marks
      .replace(/[\u0300-\u036f]/g, '')     // remove all the accents, which happen to be all in the \u03xx UNICODE block.
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')         // remove non-alphanumeric characters
      .replace(/\s+/g, '-')                // replace spaces with hyphens
      .replace(/-+/g, '-') + (ext ? `.${ext.toLowerCase()}` : '');
  };

  // Media Upload Route
  app.post("/api/upload/media", authenticate, upload.single('file'), (req: AuthRequest, res: Response) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "Aucun fichier téléchargé" });
    }

    const overwrite = req.query.overwrite === 'true';

    try {
      // Create a sensible filename based on original name slugified
      const newFilename = slugify(file.originalname);
      const newPath = path.join('uploads', newFilename);

      // Check if file already exists
      if (fs.existsSync(newPath) && !overwrite) {
        // Clean up the temporary file created by multer
        fs.unlinkSync(file.path);
        return res.status(409).json({ 
          error: "FILE_EXISTS", 
          message: `Un fichier nommé "${newFilename}" existe déjà. Voulez-vous l'écraser ?`,
          filename: newFilename 
        });
      }

      // Rename/Overwrite the file
      // If overwrite is true and file exists, renameSync will overwrite it naturally on most OS
      fs.renameSync(file.path, newPath);

      // Return the public URL
      res.json({
        success: true,
        url: `/uploads/${newFilename}`,
        filename: newFilename
      });
    } catch (err: any) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Import Route
  app.post("/api/import/:type", authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
    const { type } = req.params;
    const file = req.file;
    const userId = req.session.userId;

    if (!file) return res.status(400).json({ error: "Aucun fichier tÃ©lÃ©chargÃ©" });

    // Check permissions
    if (type === 'revenue' && !(await hasPermission(userId, 'add_revenue'))) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ error: "Permission 'add_revenue' requise" });
    }
    if (type === 'expenses' && !(await hasPermission(userId, 'add_expenses'))) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(403).json({ error: "Permission 'add_expenses' requise" });
    }

    try {
      const content = fs.readFileSync(file.path, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        fs.unlinkSync(file.path);
        return res.status(400).json({ error: "Le fichier est vide ou invalide" });
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') inQuotes = !inQuotes;
          else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current);
        return values;
      });

      const items = rows.map(row => {
        const item: any = {};
        headers.forEach((header, i) => {
          item[header] = row[i]?.trim();
        });
        return item;
      });

      await db.transaction(async (tx) => {
        if (type === 'revenue') {
          for (const item of items) {
            await tx.query("INSERT INTO revenue (description, amount, type, date, lesson_id) VALUES (?, ?, ?, ?, ?)",
              [item.description, parseFloat(item.amount), item.type, item.date, item.lesson_id || null]);
          }
        } else if (type === 'expenses') {
          for (const item of items) {
            await tx.query("INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)",
              [item.description, parseFloat(item.amount), item.category, item.date]);
          }
        } else if (type === 'reservations') {
          for (const item of items) {
            await tx.query("INSERT INTO reservations (name, email, phone, service_id, date, time, guests, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
              [item.name, item.email, item.phone, item.service_id || null, item.date, item.time, parseInt(item.guests) || 1, item.status || 'pending']);
          }
        } else if (type === 'clients') {
          for (const item of items) {
            await tx.query("INSERT INTO clients (full_name, email, phone, created_at) VALUES (?, ?, ?, ?)",
              [item.full_name, item.email, item.phone, item.created_at || new Date().toISOString()]);
          }
        } else if (type === 'stock') {
          for (const item of items) {
            await tx.query("INSERT INTO stock (name, category, quantity, condition, rental_price) VALUES (?, ?, ?, ?, ?)",
              [item.name, item.category, parseInt(item.quantity) || 0, item.condition || 'good', parseFloat(item.rental_price) || 0]);
          }
        } else if (type === 'rentals') {
          for (const item of items) {
            await tx.query("INSERT INTO rentals (customer_name, customer_phone, equipment_id, quantity, date, total_price, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [item.customer_name, item.customer_phone, item.equipment_id || null, parseInt(item.quantity) || 1, item.date || new Date().toISOString().split('T')[0], parseFloat(item.total_price) || 0, item.status || 'active']);
          }
        } else if (type === 'lessons') {
          for (const item of items) {
            await tx.query("INSERT INTO lessons (title, student_count, price, date, time, type, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
              [item.title, parseInt(item.student_count) || 1, parseFloat(item.price) || 0, item.date, item.time, item.type || 'group', item.status || 'scheduled']);
          }
        }
      })();

      fs.unlinkSync(file.path);
      await logAction(userId, 'IMPORT_DATA', `Importation rÃ©ussie pour ${type} (${items.length} lignes)`);
      res.json({ success: true, count: items.length });
    } catch (err: any) {
      if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
      console.error('Import error:', err);
      res.status(500).json({ error: err.message });
    }
  });



  // Categories Routes
  app.get("/api/categories", authenticate, async (_req, res) => {
    const categories = await getAll("SELECT * FROM categories ORDER BY name ASC");
    res.json(categories);
  });

  app.post("/api/categories", authenticate, checkPermission('add_categories'), async (req: AuthRequest, res: Response) => {
    const { name, type, parent_id } = req.body;
    try {
      await query("INSERT INTO categories (name, type, parent_id) VALUES (?, ?, ?)",
        [name, type, parent_id || null]);
      await logAction(req.session.userId, 'CREATE_CATEGORY', `CatÃ©gorie crÃ©Ã©e: ${name} (${type})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/categories/:id", authenticate, checkPermission('change_categories'), async (req: AuthRequest, res: Response) => {
    const { name, type, parent_id } = req.body;
    try {
      await query("UPDATE categories SET name = ?, type = ?, parent_id = ? WHERE id = ?",
        [name, type, parent_id || null, req.params.id]);
      await logAction(req.session.userId, 'UPDATE_CATEGORY', `CatÃ©gorie modifiÃ©e: ${name} (${type})`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/categories/:id", authenticate, checkPermission('delete_categories'), async (req: AuthRequest, res: Response) => {
    try {
      const cat: any = await getOne("SELECT name FROM categories WHERE id = ?", [req.params.id]);
      await query("DELETE FROM categories WHERE id = ?", [req.params.id]);
      await logAction(req.session.userId, 'DELETE_CATEGORY', `CatÃ©gorie supprimÃ©e: ${cat?.name}`);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Dashboard Stats
  app.get("/api/stats/financial", authenticate, async (req, res) => {
    const { filter = 'monthly' } = req.query;
    const data: any[] = [];

    if (filter === 'daily') {
      const now = new Date();
      const year = req.query.year ? parseInt(req.query.year as string) : now.getFullYear();
      const month = req.query.month ? parseInt(req.query.month as string) - 1 : now.getMonth();

      const lastDay = new Date(year, month + 1, 0).getDate();
      for (let i = 1; i <= lastDay; i++) {
        const d = new Date(year, month, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const rev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE date = ?", [dateStr]);
        const exp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE date = ?", [dateStr]);
        const revenue = parseFloat(rev.total) || 0;
        const expenses = parseFloat(exp.total) || 0;
        data.push({
          name: format(d, 'd', { locale: fr }),
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    } else if (filter === 'monthly') {
      // Current year months
      const year = new Date().getFullYear();
      for (let m = 0; m < 12; m++) {
        const monthStr = `${year}-${(m + 1).toString().padStart(2, '0')}`;
        const rev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE to_char(date::date, 'YYYY-MM') = ?", [monthStr]);
        const exp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE to_char(date::date, 'YYYY-MM') = ?", [monthStr]);
        const revenue = parseFloat(rev.total) || 0;
        const expenses = parseFloat(exp.total) || 0;
        data.push({
          name: format(new Date(year, m, 1), 'MMM', { locale: fr }),
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    } else if (filter === 'yearly') {
      const currentYear = new Date().getFullYear();
      for (let y = currentYear - 4; y <= currentYear; y++) {
        const rev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE to_char(date::date, 'YYYY') = ?", [y.toString()]);
        const exp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE to_char(date::date, 'YYYY') = ?", [y.toString()]);
        const revenue = parseFloat(rev.total) || 0;
        const expenses = parseFloat(exp.total) || 0;
        data.push({
          name: y.toString(),
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    }
    res.json(data);
  });

  app.get("/api/stats", authenticate, async (req, res) => {
    const { limit = 10, offset = 0, status, date } = req.query;
    const targetDate = date ? (date as string) : new Date().toISOString().split('T')[0];
    const now = new Date();
    const currentMonth = format(now, 'yyyy-MM');
    const lastMonthRaw = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = format(lastMonthRaw, 'yyyy-MM');

    // Current Month Stats
    const totalExpenses: any = await getOne("SELECT SUM(amount) as total FROM expenses");
    const totalRevenue: any = await getOne("SELECT SUM(amount) as total FROM revenue");

    // Trend Calculations (Month vs Last Month)
    const currentMonthRev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE to_char(date::date, 'YYYY-MM') = ?", [currentMonth]);
    const lastMonthRev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE to_char(date::date, 'YYYY-MM') = ?", [lastMonth]);

    const currentMonthExp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE to_char(date::date, 'YYYY-MM') = ?", [currentMonth]);
    const lastMonthExp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE to_char(date::date, 'YYYY-MM') = ?", [lastMonth]);

    const calcTrend = (curr: number, prev: number) => {
      if (!prev || prev === 0) return curr > 0 ? "+100%" : "0%";
      const diff = ((curr - prev) / prev) * 100;
      return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    const dailyRev: any = await getOne("SELECT SUM(amount) as total FROM revenue WHERE date = ?", [targetDate]);
    const dailyExp: any = await getOne("SELECT SUM(amount) as total FROM expenses WHERE date = ?", [targetDate]);

    const revTrend = calcTrend(parseFloat(currentMonthRev.total) || 0, parseFloat(lastMonthRev.total) || 0);
    const expTrend = calcTrend(parseFloat(currentMonthExp.total) || 0, parseFloat(lastMonthExp.total) || 0);

    // Profit Trend
    const currProfit = (parseFloat(currentMonthRev.total) || 0) - (parseFloat(currentMonthExp.total) || 0);
    const prevProfit = (parseFloat(lastMonthRev.total) || 0) - (parseFloat(lastMonthExp.total) || 0);
    const profitTrend = calcTrend(currProfit, prevProfit);

    let lessonQuery = "SELECT * FROM lessons WHERE date = ?";
    const lessonParams: any[] = [targetDate];

    if (status) {
      lessonQuery += ` AND status = ?`;
      lessonParams.push(status);
    }

    lessonQuery += ` ORDER BY time ASC LIMIT ? OFFSET ?`;
    lessonParams.push(parseInt(limit as string), parseInt(offset as string));

    const todayLessons = await getAll(lessonQuery, lessonParams);
    const todayLessonsWithStaff = [];
    for (const lesson of todayLessons) {
      const staff = await getAll(`
        SELECT s.id, s.full_name, ls.role 
        FROM staff s 
        JOIN lesson_staff ls ON s.id = ls.staff_id 
        WHERE ls.lesson_id = ?
      `, [lesson.id]);

      const sessClients = await getAll(`
        SELECT c.*, lc.is_deducted 
        FROM clients c 
        JOIN lesson_clients lc ON c.id = lc.client_id 
        WHERE lc.lesson_id = ?
      `, [lesson.id]);

      todayLessonsWithStaff.push({
        ...lesson,
        instructors: staff.filter((s: any) => s.role === 'instructor'),
        assistants: staff.filter((s: any) => s.role === 'assistant'),
        clients: sessClients
      });
    }

    let countQuery = "SELECT COUNT(*) as count FROM lessons WHERE date = ?";
    const countParams: any[] = [targetDate];
    if (status) {
      countQuery += " AND status = ?";
      countParams.push(status);
    }
    const totalLessonsToday: any = await getOne(countQuery, countParams);

    const pendingDebts: any = await getOne("SELECT SUM(amount - paid_amount) as total FROM debts_loans WHERE type = 'debt' AND status = 'pending'");
    const pendingLoans: any = await getOne("SELECT SUM(amount - paid_amount) as total FROM debts_loans WHERE type = 'loan' AND status = 'pending'");
    const totalDebts: any = await getOne("SELECT SUM(amount) as total FROM debts_loans WHERE type = 'debt'");
    const totalLoans: any = await getOne("SELECT SUM(amount) as total FROM debts_loans WHERE type = 'loan'");

    res.json({
      totalExpenses: parseFloat(totalExpenses.total) || 0,
      totalRevenue: parseFloat(totalRevenue.total) || 0,
      dailyRevenue: parseFloat(dailyRev.total) || 0,
      dailyExpenses: parseFloat(dailyExp.total) || 0,
      totalLessonsToday: totalLessonsToday.count || 0,
      todayLessons: todayLessonsWithStaff,
      trends: {
        revenue: revTrend,
        expenses: expTrend,
        profit: profitTrend
      },
      debts: {
        pendingDebts: parseFloat(pendingDebts.total) || 0,
        pendingLoans: parseFloat(pendingLoans.total) || 0,
        totalDebts: parseFloat(totalDebts.total) || 0,
        totalLoans: parseFloat(totalLoans.total) || 0
      }
    });
  });

  // --- Admin Reservations API ---
  // --- Admin Reservations API ---
  app.get("/api/admin/reservations", authenticate, checkPermission('view_reservations'), async (_req, res) => {
    const reservations = await getAll(`
      SELECT r.*, s.name as service_name 
      FROM reservations r 
      LEFT JOIN public_services s ON r.service_id = s.id 
      ORDER BY r.created_at DESC
    `);
    res.json(reservations);
  });

  app.patch("/api/admin/reservations/:id", authenticate, checkPermission('change_reservations'), async (req, res) => {
    const { status, name, email, phone, service_id, date, time, guests } = req.body;
    try {
      await db.transaction(async (tx) => {
        if (status !== undefined) {
          // If confirmed, auto-create a client if they don't exist and increment sessions
          if (status === 'confirmed') {
            const resv: any = await tx.getOne("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
            // Only increment if it wasn't already confirmed
            if (resv && resv.phone && resv.status !== 'confirmed') {
              const service: any = await tx.getOne("SELECT * FROM public_services WHERE id = ?", [resv.service_id]);
              const sessionsToAdd = service?.sessions_count || 1;
              const price = service ? Math.round(service.price * (1 - (service.discount_percentage || 0) / 100)) : 0;
              const dateStr = format(new Date(), 'yyyy-MM-dd');

              let clientId: number;
              const existingClient: any = await tx.getOne("SELECT id FROM clients WHERE phone = ?", [resv.phone]);
              if (!existingClient) {
                const result = await tx.query(`
                  INSERT INTO clients (full_name, phone, email, is_subscriber, total_sessions, remaining_sessions)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [resv.name, resv.phone, resv.email || null, 1, sessionsToAdd, sessionsToAdd]);
                clientId = result.lastInsertRowid as number;
              } else {
                clientId = existingClient.id;
                await tx.query(`
                  UPDATE clients 
                  SET total_sessions = total_sessions + ?, 
                      remaining_sessions = remaining_sessions + ?,
                      is_subscriber = 1
                  WHERE id = ?
                `, [sessionsToAdd, sessionsToAdd, clientId]);
              }

              // Record Purchase history
              if (service) {
                const purchaseResult = await tx.query(`
                  INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
                  VALUES (?, ?, ?, ?, ?, ?)
                `, [clientId, service.id, service.name, price, sessionsToAdd, dateStr]);

                const purchaseId = purchaseResult.lastInsertRowid;

                // Record Revenue
                const revenueType = sessionsToAdd > 0 ? 'sale' : 'other';
                await tx.query("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)",
                  [`Vente Service: ${service.name} (RÃ©servation: ${resv.name})`, price, revenueType, dateStr, purchaseId]);
              }

              // Now proceed to update reservation status
              await tx.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
              // Auto-mark notification as read
              await tx.query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'reservation' AND reference_id = ?", [req.params.id]);
            } else {
              await tx.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
              // Auto-mark notification as read even if already confirmed (e.g. status change)
              await tx.query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'reservation' AND reference_id = ?", [req.params.id]);
            }
          } else if (status === 'cancelled') {
            // Reverse confirmation effects if the reservation was previously confirmed
            const resv: any = await tx.getOne("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
            if (resv && resv.status === 'confirmed' && resv.phone) {
              const service: any = await tx.getOne("SELECT * FROM public_services WHERE id = ?", [resv.service_id]);
              const sessionsToRemove = service?.sessions_count || 1;

              // Find the client by phone
              const client: any = await tx.getOne("SELECT id FROM clients WHERE phone = ?", [resv.phone]);
              if (client) {
                // Revert sessions
                await tx.query(`
                  UPDATE clients 
                  SET total_sessions = GREATEST(0, total_sessions - ?), 
                      remaining_sessions = GREATEST(0, remaining_sessions - ?)
                  WHERE id = ?
                `, [sessionsToRemove, sessionsToRemove, client.id]);

                // Find and delete the linked purchase & revenue
                const purchase: any = await tx.getOne(`
                  SELECT id FROM client_purchases 
                  WHERE client_id = ? AND service_id = ?
                  ORDER BY created_at DESC LIMIT 1
                `, [client.id, resv.service_id]);

                if (purchase) {
                  await tx.query("DELETE FROM revenue WHERE purchase_id = ?", [purchase.id]);
                  await tx.query("DELETE FROM client_purchases WHERE id = ?", [purchase.id]);
                }
              }
            }
            await tx.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
            // Auto-mark notification as read
            await tx.query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'reservation' AND reference_id = ?", [req.params.id]);
          } else {
            await tx.query("UPDATE reservations SET status = ? WHERE id = ?", [status, req.params.id]);
            // Auto-mark notification as read
            await tx.query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'reservation' AND reference_id = ?", [req.params.id]);
          }
        }

        if (name !== undefined) await tx.query("UPDATE reservations SET name = ? WHERE id = ?", [name, req.params.id]);
        if (email !== undefined) await tx.query("UPDATE reservations SET email = ? WHERE id = ?", [email, req.params.id]);
        if (phone !== undefined) await tx.query("UPDATE reservations SET phone = ? WHERE id = ?", [phone, req.params.id]);
        if (service_id !== undefined) await tx.query("UPDATE reservations SET service_id = ? WHERE id = ?", [service_id, req.params.id]);
        if (date !== undefined) await tx.query("UPDATE reservations SET date = ? WHERE id = ?", [date, req.params.id]);
        if (time !== undefined) await tx.query("UPDATE reservations SET time = ? WHERE id = ?", [time, req.params.id]);
        if (guests !== undefined) await tx.query("UPDATE reservations SET guests = ? WHERE id = ?", [guests, req.params.id]);
      })();

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/admin/reservations/:id", authenticate, checkPermission('delete_reservations'), async (req, res) => {
    await query("DELETE FROM reservations WHERE id = ?", [req.params.id]);
    // Also mark related notifications as read
    await query("UPDATE notifications SET is_read = TRUE WHERE reference_type = 'reservation' AND reference_id = ?", [req.params.id]);
    res.json({ success: true });
  });



  // Serve uploads directory with 7-day caching
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '7d',
    immutable: true
  }));

  // Notification Routes
  app.get("/api/admin/notifications", authenticate, async (_req, res) => {
    const notifications = await getAll("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50");
    res.json(notifications);
  });

  app.get("/api/admin/notifications/unread-count", authenticate, async (_req, res) => {
    const count: any = await getOne("SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE");
    res.json({ count: parseInt(count.count || 0) });
  });

  app.post("/api/admin/notifications/mark-read", authenticate, async (req, res) => {
    const { ids } = req.body;
    if (Array.isArray(ids) && ids.length > 0) {
      const placeholders = ids.map(() => `?`).join(',');
      await query(`UPDATE notifications SET is_read = TRUE WHERE id IN (${placeholders})`, ids);
    } else {
      await query("UPDATE notifications SET is_read = TRUE");
    }
    res.json({ success: true });
  });

  app.get("/api/admin/sidebar/unread-counts", authenticate, async (_req, res) => {
    const notifications: any = await getOne("SELECT COUNT(*) as count FROM notifications WHERE is_read = FALSE");
    const messages: any = await getOne("SELECT COUNT(*) as count FROM contact_messages WHERE is_read = FALSE");
    const reservations: any = await getOne("SELECT COUNT(*) as count FROM reservations WHERE status = 'pending'");
    res.json({
      notifications: parseInt(notifications.count || 0),
      messages: parseInt(messages.count || 0),
      reservations: parseInt(reservations.count || 0)
    });
  });

  // Public Spots Forecast Route
  app.get("/api/public/spots/:id/forecast", async (req, res) => {
    try {
      const spot: any = await getOne("SELECT lat, lng FROM spots WHERE id = ?", [req.params.id]);
      if (!spot) return res.status(404).json({ error: "Spot not found" });

      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${spot.lat}&longitude=${spot.lng}&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m&wind_speed_unit=kmh&timezone=auto`;
      const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.lat}&longitude=${spot.lng}&hourly=wave_height,wave_period,wave_direction,sea_level_height_msl&timezone=auto`;
      
      const [weatherRes, marineRes] = await Promise.all([
        fetch(weatherUrl),
        fetch(marineUrl)
      ]);
      
      const weatherData = await weatherRes.json() as any;
      const marineData = await marineRes.json() as any;

      if (!marineData.hourly || !weatherData.hourly) return res.status(500).json({ error: "No forecast data" });

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      const filtered = {
        times: [] as string[],
        waveHeight: [] as number[],
        wavePeriod: [] as number[],
        waveDirection: [] as number[],
        windSpeed: [] as number[],
        windGusts: [] as number[],
        windDirection: [] as number[],
        seaLevel: [] as number[]
      };

      marineData.hourly.time.forEach((t: string, i: number) => {
        if (t.startsWith(todayStr)) {
          const hour = parseInt(t.split('T')[1].split(':')[0]);
          if (hour >= 6 && hour <= 21) {
            filtered.times.push(t);
            filtered.waveHeight.push(marineData.hourly.wave_height[i] || 0);
            filtered.wavePeriod.push(marineData.hourly.wave_period[i] || 0);
            filtered.waveDirection.push(marineData.hourly.wave_direction[i] || 0);
            filtered.seaLevel.push(marineData.hourly.sea_level_height_msl[i] !== null ? marineData.hourly.sea_level_height_msl[i] : 0);
            
            // Explicitly find the matching time in weather data
            const wIdx = weatherData.hourly.time.indexOf(t);
            if (wIdx !== -1) {
              filtered.windSpeed.push(weatherData.hourly.wind_speed_10m[wIdx] || 0);
              filtered.windGusts.push(weatherData.hourly.wind_gusts_10m[wIdx] || 0);
              filtered.windDirection.push(weatherData.hourly.wind_direction_10m[wIdx] || 0);
            } else {
              filtered.windSpeed.push(0);
              filtered.windGusts.push(0);
              filtered.windDirection.push(0);
            }
          }
        }
      });

      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files but DON'T serve index.html automatically (we want to inject data into it)
    // Add aggressive caching for hashed assets in /assets/
    app.use(express.static(path.join(__dirname, "dist"), { 
      index: false,
      maxAge: '1h',
      setHeaders: (res, path) => {
        if (path.includes('/assets/')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    
    app.get("*", async (_req, res) => {
      try {
        const indexPath = path.join(__dirname, "dist", "index.html");
        if (!fs.existsSync(indexPath)) {
          return res.status(404).send("Build not found");
        }
        
        let html = fs.readFileSync(indexPath, "utf8");

        // 1. Fetch data with a safety catch
        let settings: any = {};
        let initialData: any = { content: [], services: [], spots: [], conseils: [] };
        
        try {
          const settingsResult = await getAll("SELECT * FROM settings");
          settings = settingsResult.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
          }, {});
          
          const [content, services, spots, conseils] = await Promise.all([
            getAll("SELECT * FROM landing_page_content"),
            getAll("SELECT * FROM public_services"),
            getAll("SELECT * FROM spots"),
            getAll("SELECT * FROM conseils WHERE is_active = TRUE")
          ]);
          initialData = { settings, content, services, spots, conseils };
        } catch (dbErr) {
          console.error("Database pre-fetch failed:", dbErr);
          // We continue anyway to show the logo/branding
        }

        // 2. Prepare Branding
        const title = settings.app_name || 'Moroccan Wave Vibes';
        const logo = settings.app_logo || '/favicon.ico';
        const bgColor = settings.body_bg_color || '#ffffff';
        
        // 3. Inject Branding & Data
        const scriptTag = `\n    <script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, '\\u003c')};</script>`;
        
        const extraHeadTags = `
    <title>${title}</title>
    <link id="app-favicon" rel="icon" href="${logo}" />
    <style>
      body { background-color: ${bgColor} !important; border: none; margin: 0; padding: 0; }
      .splash-container {
        position: fixed; top: 0; left: 0; width: 100%; height: 100vh;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background-color: ${bgColor}; z-index: 99999;
        transition: opacity 0.4s ease, visibility 0.4s;
      }
      .splash-logo { width: 140px; height: 140px; object-fit: contain; animation: splashPulse 2s infinite ease-in-out; }
      @keyframes splashPulse { 0%,100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.1); opacity: 1; } }
      #root:not(:empty) + .splash-container { opacity: 0; visibility: hidden; pointer-events: none; }
    </style>${scriptTag}`;

        html = html.replace(/<title>.*?<\/title>/, '');
        html = html.replace('<head>', `<head>${extraHeadTags}`);
        
        const splashHtml = `
    <div id="root"></div>
    <div class="splash-container">
      <img src="${logo}" alt="${title}" class="splash-logo" onerror="this.style.display='none'" />
    </div>`;

        html = html.replace('<div id="root"></div>', splashHtml);

        res.send(html);
      } catch (err) {
        console.error("Critical Injection error:", err);
        res.sendFile(path.join(__dirname, "dist", "index.html"));
      }
    });
  }

  // Overdue debts/loans check
  const checkOverdue = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const overdueItems = await getAll(
        "SELECT * FROM debts_loans WHERE status = 'pending' AND due_date IS NOT NULL AND due_date < ?",
        [today]
      );

      for (const item of overdueItems as any[]) {
        const typeLabel = item.type === 'debt' ? 'Dette' : 'PrÃªt';
        await createNotification(
          'warning',
          `${typeLabel} en retard : ${item.description}`,
          `Le paiement de ${item.amount} DH attendu le ${item.due_date} est en retard.`,
          '#debts_loans',
          item.id,
          'debt_loan'
        );
      }
    } catch (e) {
      console.error('Error checking overdue debts:', e);
    }
  };

  checkOverdue();

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
