import express, { Response } from 'express';
import { db, query, getOne, getAll } from '../../database/db.js';
import { format } from 'date-fns';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, checkPermission('view_clients'), async (_req, res) => {
  const clients = await getAll("SELECT * FROM clients ORDER BY full_name ASC");
  res.json(clients);
});

router.post("/", authenticate, checkPermission('add_clients'), async (req: AuthRequest, res: Response) => {
  const { full_name, phone, email, address, is_subscriber, total_sessions, selected_service_id } = req.body;
  try {
    const clientId = await db.transaction(async (tx) => {
      const result = await tx.query(`
        INSERT INTO clients (full_name, phone, email, address, is_subscriber, total_sessions, remaining_sessions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [full_name, phone, email, address, is_subscriber ? 1 : 0, total_sessions || 0, total_sessions || 0]);

      const id = result.lastInsertRowid;

      if (selected_service_id) {
        const service: any = await tx.getOne("SELECT * FROM public_services WHERE id = ?", [selected_service_id]);
        if (service) {
          const price = Math.round(service.price * (1 - (service.discount_percentage || 0) / 100));
          const purchaseResult = await tx.query(`
            INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [id, service.id, service.name, price, service.sessions_count || 0, format(new Date(), 'yyyy-MM-dd')]);

          const purchaseId = purchaseResult.lastInsertRowid;

          const revenueType = service.sessions_count && service.sessions_count > 0 ? 'sale' : 'other';
          await tx.query("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)", [`Vente Service: ${service.name} (Client: ${full_name})`, price, revenueType, format(new Date(), 'yyyy-MM-dd'), purchaseId]);
        }
      }
      return id;
    })();

    await logAction(req.session.userId, 'CREATE_CLIENT', `Client ajouté: ${full_name}`);
    res.json({ id: clientId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id/purchases", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const purchases = await getAll("SELECT * FROM client_purchases WHERE client_id = ? ORDER BY created_at DESC", [req.params.id]);
    res.json(purchases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:clientId/purchases/:purchaseId", authenticate, checkPermission('change_clients'), async (req: AuthRequest, res: Response) => {
  const { clientId, purchaseId } = req.params;
  try {
    await db.transaction(async (tx) => {
      const purchase: any = await tx.getOne("SELECT * FROM client_purchases WHERE id = ? AND client_id = ?", [purchaseId, clientId]);
      if (!purchase) {
        throw new Error("Achat non trouvé");
      }

      // Revert sessions (PostgreSQL GREATEST replaces SQLite MAX)
      if (purchase.sessions_added > 0) {
        await tx.query(`
          UPDATE clients 
          SET total_sessions = GREATEST(0, total_sessions - ?), 
              remaining_sessions = GREATEST(0, remaining_sessions - ?)
          WHERE id = ?
        `, [purchase.sessions_added, purchase.sessions_added, clientId]);
      }

      // Delete linked revenue
      await tx.query("DELETE FROM revenue WHERE purchase_id = ?", [purchaseId]);

      // Delete purchase record
      await tx.query("DELETE FROM client_purchases WHERE id = ?", [purchaseId]);
    })();

    await logAction(req.session.userId, 'DELETE_PURCHASE', `Achat supprimé pour le client ID: ${clientId} (Service: ${req.query.service_name || 'Inconnu'})`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete Purchase Error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_clients'), async (req: AuthRequest, res: Response) => {
  const { full_name, phone, email, address, is_subscriber, total_sessions, remaining_sessions, selected_service_id } = req.body;
  try {
    await db.transaction(async (tx) => {
      if (selected_service_id) {
        const service: any = await tx.getOne("SELECT * FROM public_services WHERE id = ?", [selected_service_id]);
        if (service) {
          const sessionsToAdd = service.sessions_count || 0;
          const price = Math.round(service.price * (1 - (service.discount_percentage || 0) / 100));
          
          await tx.query(`
            UPDATE clients 
            SET full_name = ?, phone = ?, email = ?, address = ?, is_subscriber = ?, 
                total_sessions = COALESCE(total_sessions, 0) + ?, 
                remaining_sessions = COALESCE(remaining_sessions, 0) + ?
            WHERE id = ?
          `, [
            full_name, phone, email, address, (is_subscriber || sessionsToAdd > 1) ? 1 : 0, 
            sessionsToAdd, sessionsToAdd, req.params.id
          ]);

          const purchaseResult = await tx.query(`
            INSERT INTO client_purchases (client_id, service_id, service_name, price, sessions_added, date)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [req.params.id, service.id, service.name, price, sessionsToAdd, format(new Date(), 'yyyy-MM-dd')]);

          const purchaseId = purchaseResult.lastInsertRowid;

          const revenueType = sessionsToAdd > 0 ? 'sale' : 'other';
          await tx.query("INSERT INTO revenue (description, amount, type, date, purchase_id) VALUES (?, ?, ?, ?, ?)", [`Vente Service: ${service.name} (Client: ${full_name})`, price, revenueType, format(new Date(), 'yyyy-MM-dd'), purchaseId]);
        }
      } else {
        await tx.query(`
          UPDATE clients 
          SET full_name = ?, phone = ?, email = ?, address = ?, is_subscriber = ?, total_sessions = ?, remaining_sessions = ?
          WHERE id = ?
        `, [full_name, phone, email, address, is_subscriber ? 1 : 0, total_sessions || 0, remaining_sessions || 0, req.params.id]);
      }
    })();

    await logAction(req.session.userId, 'UPDATE_CLIENT', `Client modifié: ${full_name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_clients'), async (req: AuthRequest, res: Response) => {
  try {
    const client: any = await getOne("SELECT full_name FROM clients WHERE id = ?", [req.params.id]);
    await query("DELETE FROM clients WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_CLIENT', `Client supprimé: ${client?.full_name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
