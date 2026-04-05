import express, { Response } from 'express';
import { db, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission, hasPermission , AuthRequest } from '../../middlewares/auth.js';
import { createNotification } from '../../utils/notifications.js';

const router = express.Router();

router.get("/", authenticate, async (_req, res) => {
  const lessons = await getAll("SELECT * FROM lessons ORDER BY date ASC, time ASC");
  const lessonsWithStats = [];
  for (const lesson of lessons) {
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

    lessonsWithStats.push({
      ...lesson,
      instructors: staff.filter((s: any) => s.role === 'instructor'),
      assistants: staff.filter((s: any) => s.role === 'assistant'),
      clients: sessClients
    });
  }
  res.json(lessonsWithStats);
});

router.post("/", authenticate, checkPermission('add_lessons'), async (req: AuthRequest, res: Response) => {
  const { title, instructor_ids, assistant_ids, student_count, date, time, type, client_ids } = req.body;
  try {
    // Check if any client has no remaining sessions
    if (client_ids && client_ids.length > 0) {
      const placeholders = client_ids.map(() => `?`).join(',');
      const clientsWithNoSessions = await getAll(`
        SELECT full_name FROM clients 
        WHERE id IN (${placeholders}) AND remaining_sessions <= 0
      `, client_ids);

      if (clientsWithNoSessions.length > 0) {
        const names = clientsWithNoSessions.map((c: any) => c.full_name).join(', ');
        return res.status(400).json({ error: `Le(s) client(s) suivant(s) n'ont plus de séances : ${names}` });
      }
    }

    const lessonId = await db.transaction(async (tx) => {
      const result = await tx.query("INSERT INTO lessons (title, student_count, date, time, type, status) VALUES (?, ?, ?, ?, ?, 'scheduled')",
        [title, student_count, date, time, type]);

      const id = result.lastInsertRowid;

      // Insert staff
      if (instructor_ids?.length > 0) {
        for (const staffId of instructor_ids) {
          await tx.query("INSERT INTO lesson_staff (lesson_id, staff_id, role) VALUES (?, ?, 'instructor')", [id, staffId]);
        }
      }
      if (assistant_ids?.length > 0) {
        for (const staffId of assistant_ids) {
          await tx.query("INSERT INTO lesson_staff (lesson_id, staff_id, role) VALUES (?, ?, 'assistant')", [id, staffId]);
        }
      }

      // Insert clients
      if (client_ids?.length > 0) {
        for (const clientId of client_ids) {
          await tx.query("INSERT INTO lesson_clients (lesson_id, client_id) VALUES (?, ?)", [id, clientId]);
        }
      }
      return id;
    })();

    await logAction(req.session.userId, 'CREATE_LESSON', `Cours créé: ${title} (${date} ${time})`);
    res.json({ id: lessonId });
  } catch (err: any) {
    console.error('Error inserting lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_lessons'), async (req: AuthRequest, res: Response) => {
  const { title, instructor_ids, assistant_ids, student_count, date, time, type, client_ids } = req.body;
  try {
    // Check if any client has no remaining sessions
    if (client_ids && client_ids.length > 0) {
      const placeholders = client_ids.map(() => `?`).join(',');
      const clientsWithNoSessions = await getAll(`
        SELECT full_name FROM clients 
        WHERE id IN (${placeholders}) AND remaining_sessions <= 0
      `, client_ids);

      if (clientsWithNoSessions.length > 0) {
        const names = clientsWithNoSessions.map((c: any) => c.full_name).join(', ');
        return res.status(400).json({ error: `Le(s) client(s) suivant(s) n'ont plus de séances : ${names}` });
      }
    }

    await db.transaction(async (tx) => {
      await tx.query("UPDATE lessons SET title = ?, student_count = ?, date = ?, time = ?, type = ? WHERE id = ?",
        [title, student_count, date, time, type, req.params.id]);

      // Update staff
      await tx.query("DELETE FROM lesson_staff WHERE lesson_id = ?", [req.params.id]);
      if (instructor_ids?.length > 0) {
        for (const staffId of instructor_ids) {
          await tx.query("INSERT INTO lesson_staff (lesson_id, staff_id, role) VALUES (?, ?, 'instructor')", [req.params.id, staffId]);
        }
      }
      if (assistant_ids?.length > 0) {
        for (const staffId of assistant_ids) {
          await tx.query("INSERT INTO lesson_staff (lesson_id, staff_id, role) VALUES (?, ?, 'assistant')", [req.params.id, staffId]);
        }
      }

      // Update clients
      await tx.query("DELETE FROM lesson_clients WHERE lesson_id = ?", [req.params.id]);
      if (client_ids?.length > 0) {
        for (const clientId of client_ids) {
          await tx.query("INSERT INTO lesson_clients (lesson_id, client_id) VALUES (?, ?)", [req.params.id, clientId]);
        }
      }
    })();

    await logAction(req.session.userId, 'UPDATE_LESSON', `Cours modifié: ${title}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/status", authenticate, async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const userId = req.session.userId;

  // Check permissions based on status
  if (status === 'completed') {
    if (!(await hasPermission(userId, 'complete_lessons'))) {
      return res.status(403).json({ error: "Permission 'complete_lessons' requise" });
    }
  } else if (status === 'scheduled') {
    if (!(await hasPermission(userId, 'remettre_lessons'))) {
      return res.status(403).json({ error: "Permission 'remettre_lessons' requise" });
    }
  }

  try {
    await db.transaction(async (tx) => {
      await tx.query("UPDATE lessons SET status = ? WHERE id = ?", [status, req.params.id]);

      if (status === 'completed') {
        // Get all linked clients to determine who pays and who uses subscription
        const clients = await tx.getAll(`
          SELECT lc.client_id, lc.is_deducted, c.is_subscriber, c.remaining_sessions 
          FROM lesson_clients lc 
          JOIN clients c ON lc.client_id = c.id 
          WHERE lc.lesson_id = ?
        `, [req.params.id]);

        // Deduct sessions for subscriber clients
        for (const client of clients as any[]) {
          if (client.is_subscriber && !client.is_deducted) {
            if (client.remaining_sessions > 0) {
              await tx.query("UPDATE clients SET remaining_sessions = remaining_sessions - 1 WHERE id = ?", [client.client_id]);
              await tx.query("UPDATE lesson_clients SET is_deducted = 1 WHERE lesson_id = ? AND client_id = ?", [req.params.id, client.client_id]);
            }
          }
        }
      } else {
        // Reverse session deduction if needed
        const clients = await tx.getAll(`
          SELECT lc.client_id, lc.is_deducted, c.is_subscriber 
          FROM lesson_clients lc 
          JOIN clients c ON lc.client_id = c.id 
          WHERE lc.lesson_id = ?
        `, [req.params.id]);

        for (const client of clients as any[]) {
          if (client.is_subscriber && client.is_deducted) {
            await tx.query("UPDATE clients SET remaining_sessions = remaining_sessions + 1 WHERE id = ?", [client.client_id]);
            await tx.query("UPDATE lesson_clients SET is_deducted = 0 WHERE lesson_id = ? AND client_id = ?", [req.params.id, client.client_id]);
          }
        }
      }
    })();

    if (status === 'completed') {
        const lesson: any = await getOne("SELECT title, date FROM lessons WHERE id = ?", [req.params.id]);
        await createNotification(
          'lesson_completed',
          'Cours Réalisé',
          `Le cours "${lesson?.title}" du ${lesson?.date} a été marqué comme réalisé.`,
          '/admin/planning'
        );
    }

    await logAction(req.session.userId, 'UPDATE_LESSON_STATUS', `Statut cours ${req.params.id}: ${status}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_lessons'), async (req: AuthRequest, res: Response) => {
  console.log(`DELETE /api/lessons/${req.params.id}`);
  try {
    const lesson: any = await getOne("SELECT status, title FROM lessons WHERE id = ?", [req.params.id]);
    if (lesson && lesson.status === 'completed') {
      return res.status(400).json({ error: "Impossible de supprimer un cours déjà réalisé" });
    }

    await db.transaction(async (tx) => {
      await tx.query("DELETE FROM lessons WHERE id = ?", [req.params.id]);
      // Delete corresponding revenue
      await tx.query("DELETE FROM revenue WHERE lesson_id = ?", [req.params.id]);
    })();
    await logAction(req.session.userId, 'DELETE_LESSON', `Cours supprimé: ${lesson?.title}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting lesson:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
