import express, { Response } from 'express';
import { db, query, getOne, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission , AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", authenticate, checkPermission('view_debts'), async (_req, res) => {
  const items = await getAll("SELECT * FROM debts_loans ORDER BY date DESC");
  res.json(items);
});

router.post("/", authenticate, checkPermission('add_debts'), async (req: AuthRequest, res: Response) => {
  const { description, amount, type, person, date, due_date, status } = req.body;
  try {
    const result = await query(
      "INSERT INTO debts_loans (description, amount, type, person, date, due_date, status, paid_amount) VALUES (?, ?, ?, ?, ?, ?, ?, 0)",
      [description, amount, type, person, date, due_date || null, status || 'pending']
    );
    
    const id = result.lastInsertRowid;

    if (status === 'paid') {
      // Auto-create financial entry if created as paid
      await query("UPDATE debts_loans SET paid_amount = ? WHERE id = ?", [amount, id]);
      if (type === 'debt') {
        await query(
          "INSERT INTO expenses (description, amount, category, date, debt_loan_id) VALUES (?, ?, ?, ?, ?)",
          [`Remboursement dette: ${description}`, amount, 'Paiement', date, id]
        );
      } else {
        await query(
          "INSERT INTO revenue (description, amount, category, date, type, debt_loan_id) VALUES (?, ?, ?, ?, 'manual', ?)",
          [`Remboursement prêt: ${description}`, amount, 'other', date, id]
        );
      }
    }

    await logAction(req.session.userId, 'CREATE_DEBT_LOAN', `${type === 'debt' ? 'Dette' : 'Prêt'}: ${description} (${amount} DH)`);
    res.json({ id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/:id", authenticate, checkPermission('change_debts'), async (req: AuthRequest, res: Response) => {
  const { description, amount, type, person, date, due_date, status } = req.body;
  const id = req.params.id;
  try {
    const oldItem: any = await getOne("SELECT * FROM debts_loans WHERE id = ?", [id]);
    
    await query(
      "UPDATE debts_loans SET description = ?, amount = ?, type = ?, person = ?, date = ?, due_date = ?, status = ? WHERE id = ?",
      [description, amount, type, person, date, due_date, status, id]
    );

    // Handle status change to paid
    if (status === 'paid' && oldItem.status !== 'paid') {
      const remainingToPay = amount - oldItem.paid_amount;
      if (remainingToPay > 0) {
        // Create history record for the final jump
        const paymentResult = await query(
          "INSERT INTO debt_payments (debt_loan_id, amount, date, note) VALUES (?, ?, ?, ?)",
          [id, remainingToPay, date, "Règlement complet (manuel)"]
        );
        const paymentId = paymentResult.lastInsertRowid;

        await query("UPDATE debts_loans SET paid_amount = ? WHERE id = ?", [amount, id]);
        if (type === 'debt') {
          await query(
            "INSERT INTO expenses (description, amount, category, date, debt_loan_id, debt_payment_id) VALUES (?, ?, ?, ?, ?, ?)",
            [`Remboursement dette: ${description}`, remainingToPay, 'Paiement', date, id, paymentId]
          );
        } else {
          await query(
            "INSERT INTO revenue (description, amount, category, date, type, debt_loan_id, debt_payment_id) VALUES (?, ?, ?, ?, 'manual', ?, ?)",
            [`Remboursement prêt: ${description}`, remainingToPay, 'other', date, id, paymentId]
          );
        }
      }
    } 
    // Handle status change back to pending
    else if (status === 'pending' && oldItem.status === 'paid') {
      // Optionally reverse? Usually better to keep history but for now let's just update paid_amount if needed
      // or let the user manage it manually. The requirement says "reverse" if status goes back to pending.
      // Let's delete financial entries linked only to the debt itself (not partial payments)
      if (type === 'debt') {
        await query("DELETE FROM expenses WHERE debt_loan_id = ? AND debt_payment_id IS NULL", [id]);
      } else {
        await query("DELETE FROM revenue WHERE debt_loan_id = ? AND debt_payment_id IS NULL", [id]);
      }
      await query("UPDATE debts_loans SET paid_amount = 0 WHERE id = ?", [id]);
      await query("DELETE FROM debt_payments WHERE debt_loan_id = ?", [id]);
    }

    await logAction(req.session.userId, 'UPDATE_DEBT_LOAN', `Mise à jour ${type === 'debt' ? 'dette' : 'prêt'}: ${description}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", authenticate, checkPermission('delete_debts'), async (req: AuthRequest, res: Response) => {
  const id = req.params.id;
  try {
    const item: any = await getOne("SELECT description, type FROM debts_loans WHERE id = ?", [id]);
    
    // Cleanup linked finances
    if (item?.type === 'debt') {
      await query("DELETE FROM expenses WHERE debt_loan_id = ?", [id]);
    } else {
      await query("DELETE FROM revenue WHERE debt_loan_id = ?", [id]);
    }
    
    await query("DELETE FROM debts_loans WHERE id = ?", [id]);
    await logAction(req.session.userId, 'DELETE_DEBT_LOAN', `Suppression ${item?.type === 'debt' ? 'dette' : 'prêt'}: ${item?.description}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Partial Payments Routes
router.get("/:id/payments", authenticate, checkPermission('view_debts'), async (req, res) => {
  const payments = await getAll("SELECT * FROM debt_payments WHERE debt_loan_id = ? ORDER BY date DESC", [req.params.id]);
  res.json(payments);
});

router.post("/:id/payments", authenticate, checkPermission('change_debts'), async (req: AuthRequest, res: Response) => {
  const { amount, date, note } = req.body;
  const debtId = req.params.id;
  try {
    const debt: any = await getOne("SELECT * FROM debts_loans WHERE id = ?", [debtId]);
    if (!debt) return res.status(404).json({ error: "Dette/Prêt introuvable" });

    const result = await query(
      "INSERT INTO debt_payments (debt_loan_id, amount, date, note) VALUES (?, ?, ?, ?)",
      [debtId, amount, date, note]
    );
    const paymentId = result.lastInsertRowid;

    // Update debt paid_amount
    const newPaidAmount = (debt.paid_amount || 0) + parseFloat(amount);
    const newStatus = newPaidAmount >= debt.amount ? 'paid' : 'pending';
    
    await query("UPDATE debts_loans SET paid_amount = ?, status = ? WHERE id = ?", [newPaidAmount, newStatus, debtId]);

    // Create financial entry
    if (debt.type === 'debt') {
      await query(
        "INSERT INTO expenses (description, amount, category, date, debt_loan_id, debt_payment_id) VALUES (?, ?, ?, ?, ?, ?)",
        [`Paiement partiel dette: ${debt.description}`, amount, 'Paiement', date, debtId, paymentId]
      );
    } else {
      await query(
        "INSERT INTO revenue (description, amount, category, date, type, debt_loan_id, debt_payment_id) VALUES (?, ?, ?, ?, 'manual', ?, ?)",
        [`Remboursement partiel prêt: ${debt.description}`, amount, 'other', date, debtId, paymentId]
      );
    }

    await logAction(req.session.userId, 'CREATE_DEBT_PAYMENT', `Paiement ${amount} DH pour ${debt.description}`);
    res.json({ id: paymentId, newStatus, newPaidAmount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id/payments/:paymentId", authenticate, checkPermission('change_debts'), async (req: AuthRequest, res: Response) => {
  const { id, paymentId } = req.params;
  try {
    const payment: any = await getOne("SELECT * FROM debt_payments WHERE id = ?", [paymentId]);
    const debt: any = await getOne("SELECT * FROM debts_loans WHERE id = ?", [id]);
    
    if (!payment || !debt) return res.status(404).json({ error: "Paiement ou Dette introuvable" });

    // Reverse finances
    if (debt.type === 'debt') {
      await query("DELETE FROM expenses WHERE debt_payment_id = ?", [paymentId]);
    } else {
      await query("DELETE FROM revenue WHERE debt_payment_id = ?", [paymentId]);
    }

    // Update debt
    const newPaidAmount = Math.max(0, debt.paid_amount - payment.amount);
    await query("UPDATE debts_loans SET paid_amount = ?, status = 'pending' WHERE id = ?", [newPaidAmount, id]);

    await query("DELETE FROM debt_payments WHERE id = ?", [paymentId]);
    await logAction(req.session.userId, 'DELETE_DEBT_PAYMENT', `Suppression paiement de ${payment.amount} DH pour ${debt.description}`);
    res.json({ success: true, newPaidAmount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
