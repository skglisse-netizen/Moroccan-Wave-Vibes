import express, { Response } from 'express';
import { db, query, getAll } from '../../database/db.js';
import { authenticate, checkPermission, AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

// --- Admin Landing Page Management ---
router.get("/footer-widgets", authenticate, checkPermission('view_landing_page'), async (_req, res) => {
  const widgets = await getAll("SELECT * FROM footer_widgets ORDER BY order_index ASC");
  res.json(widgets);
});

router.post("/footer-widgets", authenticate, checkPermission('add_landing_page'), async (req, res) => {
  const { title, content, type, order_index } = req.body;
  try {
    const result = await query("INSERT INTO footer_widgets (title, content, type, order_index) VALUES (?, ?, ?, ?)", [title, content, type, order_index || 0]);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/footer-widgets/:id", authenticate, checkPermission('change_landing_page'), async (req, res) => {
  const { title, content, type, order_index } = req.body;
  try {
    await query("UPDATE footer_widgets SET title = ?, content = ?, type = ?, order_index = ? WHERE id = ?",
      [title, content, type, order_index, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/footer-widgets/:id", authenticate, checkPermission('delete_landing_page'), async (req, res) => {
  try {
    await query("DELETE FROM footer_widgets WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/spots", authenticate, checkPermission('view_landing_page'), async (_req, res) => {
  const spots = await getAll("SELECT * FROM spots ORDER BY created_at DESC");
  res.json(spots);
});

router.post("/spots", authenticate, checkPermission('add_landing_page'), async (req: AuthRequest, res: Response) => {
  const { name, description, lat, lng, image_url, difficulty, is_active, suggestion_type, suggestion_name, suggestion_link, live_cam_url, suggestions } = req.body;
  try {
    const result = await query(
      "INSERT INTO spots (name, description, lat, lng, image_url, difficulty, is_active, suggestion_type, suggestion_name, suggestion_link, live_cam_url, suggestions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, description, lat, lng, image_url, difficulty, is_active ?? true, suggestion_type, suggestion_name, suggestion_link, live_cam_url, JSON.stringify(suggestions || [])]
    );
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/spots/:id", authenticate, checkPermission('change_landing_page'), async (req: AuthRequest, res: Response) => {
  const { name, description, lat, lng, image_url, difficulty, is_active, suggestion_type, suggestion_name, suggestion_link, live_cam_url, suggestions } = req.body;
  try {
    await query(
      "UPDATE spots SET name = ?, description = ?, lat = ?, lng = ?, image_url = ?, difficulty = ?, is_active = ?, suggestion_type = ?, suggestion_name = ?, suggestion_link = ?, live_cam_url = ?, suggestions = ? WHERE id = ?",
      [name, description, lat, lng, image_url, difficulty, is_active ?? true, suggestion_type, suggestion_name, suggestion_link, live_cam_url, JSON.stringify(suggestions || []), req.params.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/spots/:id", authenticate, checkPermission('delete_landing_page'), async (req: AuthRequest, res: Response) => {
  try {
    await query("DELETE FROM spots WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/landing-page", authenticate, checkPermission('change_landing_page'), async (req, res) => {
  const { 
    section, title, content, image_url, video_url, title_style, content_style, is_active, button_label,
    show_logo, show_button, button_link, section_button_label, button_label_2, button_link_2, show_button_2,
    cta1_bg_color, cta1_text_color, cta2_bg_color, cta2_text_color
  } = req.body;
  try {
    await query(`
      INSERT INTO landing_page_content (
        section, title, content, image_url, video_url, title_style, content_style, is_active, button_label,
        show_logo, show_button, button_link, section_button_label, button_label_2, button_link_2, show_button_2,
        cta1_bg_color, cta1_text_color, cta2_bg_color, cta2_text_color
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(section) DO UPDATE SET 
        title = excluded.title,
        content = excluded.content,
        image_url = excluded.image_url,
        video_url = excluded.video_url,
        title_style = excluded.title_style,
        content_style = excluded.content_style,
        is_active = excluded.is_active,
        button_label = excluded.button_label,
        show_logo = excluded.show_logo,
        show_button = excluded.show_button,
        button_link = excluded.button_link,
        section_button_label = excluded.section_button_label,
        button_label_2 = excluded.button_label_2,
        button_link_2 = excluded.button_link_2,
        show_button_2 = excluded.show_button_2,
        cta1_bg_color = excluded.cta1_bg_color,
        cta1_text_color = excluded.cta1_text_color,
        cta2_bg_color = excluded.cta2_bg_color,
        cta2_text_color = excluded.cta2_text_color
    `, [
      section, title, content, image_url, video_url, title_style, content_style, 
      is_active ? 1 : 0, button_label,
      show_logo ? 1 : 0, show_button ? 1 : 0, button_link, section_button_label,
      button_label_2, button_link_2, show_button_2 !== undefined ? (show_button_2 ? 1 : 0) : 1,
      cta1_bg_color, cta1_text_color, cta2_bg_color, cta2_text_color
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/public-services", authenticate, async (_req, res) => {
  const services = await getAll("SELECT * FROM public_services");
  res.json(services);
});

router.post("/public-services", authenticate, checkPermission('add_landing_page'), async (req, res) => {
  const { name, description, price, image_url, discount_percentage, sessions_count, is_active, is_pack } = req.body;
  try {
    await query(`
      INSERT INTO public_services (name, description, price, image_url, discount_percentage, sessions_count, is_active, is_pack)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, price, image_url, discount_percentage || 0, sessions_count || 0, is_active ? 1 : 0, is_pack ? 1 : 0]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/public-services/:id", authenticate, checkPermission('change_landing_page'), async (req, res) => {
  const { name, description, price, image_url, is_active, discount_percentage, sessions_count, is_pack } = req.body;
  try {
    await query(`
      UPDATE public_services 
      SET name = ?, description = ?, price = ?, image_url = ?, is_active = ?, discount_percentage = ?, sessions_count = ?, is_pack = ?
      WHERE id = ?
    `, [name, description, price, image_url, is_active ? 1 : 0, discount_percentage || 0, sessions_count || 0, is_pack ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/public-services/:id", authenticate, checkPermission('delete_landing_page'), async (req, res) => {
  try {
    await query("DELETE FROM public_services WHERE id = ?", [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Conseils Admin API ---
router.get("/conseils", authenticate, checkPermission('view_landing_page'), async (_req, res) => {
  const conseils = await getAll("SELECT * FROM conseils ORDER BY created_at DESC");
  res.json(conseils);
});

router.post("/conseils", authenticate, checkPermission('add_landing_page'), async (req, res) => {
  const { title, content, image_url, is_active } = req.body;
  try {
    const result = await query(`
      INSERT INTO conseils (title, content, image_url, is_active)
      VALUES (?, ?, ?, ?)
    `, [title, content, image_url, is_active ? 1 : 0]);
    res.json({ id: result.lastInsertRowid });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/conseils/:id", authenticate, checkPermission('change_landing_page'), async (req, res) => {
  const { id } = req.params;
  const { title, content, image_url, is_active } = req.body;
  try {
    await query(`
      UPDATE conseils 
      SET title = ?, content = ?, image_url = ?, is_active = ?
      WHERE id = ?
    `, [title, content, image_url, is_active ? 1 : 0, id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/conseils/:id", authenticate, checkPermission('delete_landing_page'), async (req, res) => {
  const { id } = req.params;
  try {
    await query("DELETE FROM conseils WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
