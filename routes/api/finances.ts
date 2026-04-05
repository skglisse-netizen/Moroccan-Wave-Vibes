import express, { Response } from 'express';
import { db, query, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

// Expense Routes
router.get("/expenses", authenticate, async (_req, res) => {
  const expenses = await getAll("SELECT * FROM expenses ORDER BY date DESC");
  res.json(expenses);
});

router.post("/expenses", authenticate, checkPermission('add_expenses'), async (req: AuthRequest, res: Response) => {
  const { description, amount, category, sub_category, date, addToStock, stockQuantity, stockCategory, is_rentable, rental_price } = req.body;
  try {
    const id = await db.transaction(async (tx) => {
      const result = await tx.query("INSERT INTO expenses (description, amount, category, sub_category, date) VALUES (?, ?, ?, ?, ?)", 
        [description, amount, category, sub_category || null, date]);

      if (addToStock) {
        await tx.query("INSERT INTO stock (name, quantity, price_unit, category, is_rentable, rental_price) VALUES (?, ?, ?, ?, ?, ?)", 
          [description, stockQuantity || 1, amount / (stockQuantity || 1), stockCategory || category, is_rentable ? 1 : 0, rental_price || 0]);
      }
      return result.lastInsertRowid;
    })();

    await logAction(req.session.userId, 'CREATE_EXPENSE', `Dépense: ${description} (${amount} DH)${addToStock ? ' + Ajout au stock' : ''}`);
    res.json({ id });
  } catch (err: any) {
    console.error('Error inserting expense:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/expenses/:id", authenticate, checkPermission('change_expenses'), async (req: AuthRequest, res: Response) => {
  const { description, amount, category, sub_category, date } = req.body;
  console.log(`PUT /api/expenses/${req.params.id}`, req.body);
  try {
    await query("UPDATE expenses SET description = ?, amount = ?, category = ?, sub_category = ?, date = ? WHERE id = ?",
      [description, amount, category, sub_category || null, date, req.params.id]);
    await logAction(req.session.userId, 'UPDATE_EXPENSE', `Dépense modifiée: ${description} (${amount} DH)`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating expense:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/expenses/:id", authenticate, checkPermission('delete_expenses'), async (req: AuthRequest, res: Response) => {
  console.log(`DELETE /api/expenses/${req.params.id}`);
  try {
    const exp: any = await getOne("SELECT description FROM expenses WHERE id = ?", [req.params.id]);
    await query("DELETE FROM expenses WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_EXPENSE', `Dépense supprimée: ${exp?.description}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting expense:', err);
    res.status(500).json({ error: err.message });
  }
});

// Revenue Routes
router.get("/revenue", authenticate, async (_req, res) => {
  const revenue = await getAll("SELECT * FROM revenue ORDER BY date DESC");
  res.json(revenue);
});

router.post("/revenue", authenticate, checkPermission('add_revenue'), async (req: AuthRequest, res: Response) => {
  const { description, amount, category, sub_category, date } = req.body;
  console.log('POST /api/revenue', req.body);
  try {
    const result = await query("INSERT INTO revenue (description, amount, category, sub_category, date, type) VALUES (?, ?, ?, ?, ?, 'manual')", 
      [description, amount, category, sub_category || null, date]);
    await logAction(req.session.userId, 'CREATE_REVENUE', `Revenu: ${description} (${amount} DH)`);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    console.error('Error inserting revenue:', err);
    res.status(500).json({ error: err.message });
  }
});

router.put("/revenue/:id", authenticate, checkPermission('change_revenue'), async (req: AuthRequest, res: Response) => {
  const { description, amount, category, sub_category, date } = req.body;
  console.log(`PUT /api/revenue/${req.params.id}`, req.body);
  try {
    const existing: any = await getOne("SELECT rental_id FROM revenue WHERE id = ?", [req.params.id]);
    if (existing?.rental_id) {
      return res.status(403).json({ error: "Impossible de modifier un revenu lié à une location" });
    }

    await query("UPDATE revenue SET description = ?, amount = ?, category = ?, sub_category = ?, date = ? WHERE id = ?",
      [description, amount, category, sub_category || null, date, req.params.id]);
    await logAction(req.session.userId, 'UPDATE_REVENUE', `Revenu modifié: ${description} (${amount} DH)`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error updating revenue:', err);
    res.status(500).json({ error: err.message });
  }
});

router.delete("/revenue/:id", authenticate, checkPermission('delete_revenue'), async (req: AuthRequest, res: Response) => {
  try {
    const rev: any = await getOne("SELECT description, rental_id FROM revenue WHERE id = ?", [req.params.id]);
    if (rev?.rental_id) {
      return res.status(403).json({ error: "Impossible de supprimer un revenu lié à une location" });
    }
    await query("DELETE FROM revenue WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_REVENUE', `Revenu supprimé: ${rev?.description}`);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting revenue:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
