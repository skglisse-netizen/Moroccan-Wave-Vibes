import express, { Response } from 'express';
import { query, getAll } from '../../database/db.js';
import { logAction } from '../../utils/logger.js';
import { authenticate, checkPermission, AuthRequest } from '../../middlewares/auth.js';

const router = express.Router();

router.get("/", async (_req, res) => {
  const settings = await getAll("SELECT * FROM settings");
  const settingsObj = settings.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  res.json(settingsObj);
});

router.post("/", authenticate, checkPermission('change_settings'), async (req: AuthRequest, res: Response) => {
  const fields = [
    'app_name', 'app_logo', 'app_bg', 'pages_bg', 'header_color', 'header_text_color',
    'nav_color', 'nav_text_color', 'footer_color', 'footer_text_color', 'body_bg_color',
    'sticky_header', 'sticky_footer', 'services_layout', 'services_title', 'services_subtitle',
    'services_bg_image', 'spots_title', 'spots_subtitle', 'spots_content', 'spots_bg_image', 'spots_layout',
    'reserve_title', 'reserve_subtitle', 'reserve_bg_image', 'reserve_layout',
    'conseils_layout', 'conseils_title', 'conseils_subtitle', 'conseils_button_text',
    'conseils_bg_image', 'title_color', 'subtitle_color',
    'smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_to'
  ];

  try {
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        const value = typeof req.body[field] === 'boolean' ? String(req.body[field]) : req.body[field];
        await query(`
          INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT (key) DO UPDATE SET value = excluded.value
        `, [field, value]);
      }
    }
    await logAction(req.session.userId, 'UPDATE_SETTINGS', 'Paramètres de l\'application mis à jour');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
