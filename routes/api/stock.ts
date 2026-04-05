import express, { Response } from 'express';
import { db, query, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, async (_req, res) => {
  const stock = await getAll("SELECT * FROM stock ORDER BY name ASC");
  res.json(stock);
});

router.post("/", authenticate, checkPermission('add_stock'), async (req: AuthRequest, res: Response) => {
  const { name, quantity, price_unit, category, is_rentable, rental_price } = req.body;
  try {
    const result = await query("INSERT INTO stock (name, quantity, price_unit, category, is_rentable, rental_price) VALUES (?, ?, ?, ?, ?, ?)",
      [name, quantity, price_unit, category, is_rentable ? 1 : 0, rental_price || 0]);
    await logAction(req.session.userId, 'CREATE_STOCK', `Matériel ajouté: ${name} (${quantity})`);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_stock'), async (req: AuthRequest, res: Response) => {
  const { name, quantity, price_unit, category, is_rentable, rental_price } = req.body;
  try {
    await query("UPDATE stock SET name = ?, quantity = ?, price_unit = ?, category = ?, is_rentable = ?, rental_price = ? WHERE id = ?",
      [name, quantity, price_unit, category, is_rentable ? 1 : 0, rental_price || 0, req.params.id]);
    await logAction(req.session.userId, 'UPDATE_STOCK', `Matériel modifié: ${name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_stock'), async (req: AuthRequest, res: Response) => {
  try {
    const item: any = await getOne("SELECT name FROM stock WHERE id = ?", [req.params.id]);
    await query("DELETE FROM stock WHERE id = ?", [req.params.id]);
    await logAction(req.session.userId, 'DELETE_STOCK', `Matériel supprimé: ${item?.name}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/:id/sell", authenticate, checkPermission('change_stock'), async (req: AuthRequest, res: Response) => {
  const { quantity, price_sale, date } = req.body;
  try {
    const item: any = await getOne("SELECT * FROM stock WHERE id = ?", [req.params.id]);
    if (!item || item.quantity < quantity) {
      return res.status(400).json({ error: "Quantité insuffisante" });
    }

    let totalAmountToLog = 0;
    await db.transaction(async (tx) => {
      await tx.query("UPDATE stock SET quantity = quantity - ? WHERE id = ?", [quantity, req.params.id]);

      const totalAmount = quantity * price_sale;
      totalAmountToLog = totalAmount;
      await tx.query("INSERT INTO revenue (description, amount, type, date) VALUES (?, ?, 'sale', ?)",
        [`Vente: ${item.name} (x${quantity})`, totalAmount, date]);
    })();

    await logAction(req.session.userId, 'SELL_STOCK', `Vente matériel: ${item.name} (x${quantity}, ${totalAmountToLog} DH)`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
