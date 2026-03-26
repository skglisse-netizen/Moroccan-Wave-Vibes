import express, { Response } from 'express';
import { db, getOne, getAll } from '../../database/db.js';
import { format } from 'date-fns';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, checkPermission('view_rentals'), async (_req, res) => {
  const rentals = await getAll(`
    SELECT r.*, s.name as equipment_name 
    FROM rentals r 
    LEFT JOIN stock s ON r.equipment_id = s.id 
    ORDER BY r.created_at DESC
  `);
  res.json(rentals);
});

router.post("/", authenticate, checkPermission('add_rentals'), async (req: AuthRequest, res: Response) => {
  const { customer_name, customer_phone, equipment_id, quantity, start_time, end_time, total_price, date } = req.body;

  try {
    const id = await db.transaction(async (tx) => {
      // Check stock
      const item: any = await tx.getOne("SELECT quantity FROM stock WHERE id = ?", [equipment_id]);
      if (!item || item.quantity < quantity) {
        throw new Error("Stock insuffisant");
      }

      const result = await tx.query(`
        INSERT INTO rentals (customer_name, customer_phone, equipment_id, quantity, start_time, end_time, total_price, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [customer_name, customer_phone, equipment_id, quantity, start_time, end_time, total_price, date || format(new Date(), 'yyyy-MM-dd')]);

      const rentalId = result.lastInsertRowid;

      // Update stock
      await tx.query("UPDATE stock SET quantity = quantity - ? WHERE id = ?", [quantity, equipment_id]);

      // Add to revenue
      const equipment: any = await tx.getOne("SELECT name FROM stock WHERE id = ?", [equipment_id]);
      await tx.query("INSERT INTO revenue (description, amount, type, date, rental_id, category) VALUES (?, ?, 'rental', ?, ?, 'Location')",
        [
          `Location - ${equipment?.name || 'Matériel'} x${quantity} (${customer_name})`,
          total_price,
          new Date().toISOString().split('T')[0],
          rentalId
        ]);
      return rentalId;
    })();

    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_rentals'), async (req: AuthRequest, res: Response) => {
  const { customer_name, customer_phone, equipment_id, quantity, start_time, end_time, total_price, date, status } = req.body;
  const rentalId = req.params.id;

  try {
    await db.transaction(async (tx) => {
      const oldRental: any = await tx.getOne("SELECT * FROM rentals WHERE id = ?", [rentalId]);
      if (!oldRental) throw new Error("Location non trouvée");

      // 1. Revert old stock if it was active
      if (oldRental.status === 'active') {
        await tx.query("UPDATE stock SET quantity = quantity + ? WHERE id = ?", [oldRental.quantity, oldRental.equipment_id]);
      } else if (oldRental.status === 'returned') {
          // If it was returned, equipment was already back. No need to revert stock.
      }

      // 2. Apply new stock if active
      const newStatus = status || oldRental.status;
      if (newStatus === 'active') {
        const item: any = await tx.getOne("SELECT quantity FROM stock WHERE id = ?", [equipment_id]);
        if (!item || item.quantity < quantity) {
          throw new Error("Stock insuffisant");
        }
        await tx.query("UPDATE stock SET quantity = quantity - ? WHERE id = ?", [quantity, equipment_id]);
      }

      // 3. Update rental
      await tx.query(`
        UPDATE rentals 
        SET customer_name = ?, customer_phone = ?, equipment_id = ?, quantity = ?, 
            start_time = ?, end_time = ?, total_price = ?, date = ?, status = ?
        WHERE id = ?
      `, [
        customer_name, customer_phone, equipment_id, quantity,
        start_time || oldRental.start_time, end_time || oldRental.end_time,
        total_price, date || oldRental.date, newStatus, rentalId
      ]);

      // 4. Update linked revenue
      const equipment: any = await tx.getOne("SELECT name FROM stock WHERE id = ?", [equipment_id]);
      await tx.query(`
        UPDATE revenue 
        SET description = ?, amount = ?, date = ? 
        WHERE rental_id = ?
      `, [
        `Location - ${equipment?.name || 'Matériel'} x${quantity} (${customer_name})`,
        total_price,
        date || oldRental.date,
        rentalId
      ]);
    })();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id/return", authenticate, checkPermission('change_rentals'), async (req: AuthRequest, res: Response) => {
  try {
    const rental: any = await getOne("SELECT * FROM rentals WHERE id = ?", [req.params.id]);
    if (!rental || rental.status === 'returned') return res.status(400).json({ error: "Déjà retourné" });

    await db.transaction(async (tx) => {
      await tx.query("UPDATE rentals SET status = 'returned', end_time = ? WHERE id = ?", [new Date().toISOString(), req.params.id]);
      await tx.query("UPDATE stock SET quantity = quantity + ? WHERE id = ?", [rental.quantity, rental.equipment_id]);
    })();

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_rentals'), async (req: AuthRequest, res: Response) => {
  try {
    const rental: any = await getOne("SELECT * FROM rentals WHERE id = ?", [req.params.id]);
    if (!rental) return res.status(404).json({ error: "Location non trouvée" });

    await db.transaction(async (tx) => {
      if (rental.status === 'active') {
        await tx.query("UPDATE stock SET quantity = quantity + ? WHERE id = ?", [rental.quantity, rental.equipment_id]);
      }

      await tx.query("DELETE FROM revenue WHERE rental_id = ?", [req.params.id]);
      await tx.query("DELETE FROM rentals WHERE id = ?", [req.params.id]);
    })();
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete rental error:', err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
