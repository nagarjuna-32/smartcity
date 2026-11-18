import express from 'express';
import db from '../database/db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all saved locations for current user
router.get('/', authMiddleware, (req, res) => {
  try {
    const saved = db.prepare(`
      SELECT s.*
      FROM saved_locations s
      WHERE s.user_id = ?
      ORDER BY s.created_at DESC
    `).all(req.user.id);

    // Hydrate details
    const hydrated = saved.map(item => {
      if (item.item_type === 'area') {
        const area = db.prepare(`
          SELECT a.*, (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) as facilities_count
          FROM areas a WHERE a.id = ?
        `).get(item.item_id);
        return { ...item, data: area };
      } else {
        const facility = db.prepare(`
          SELECT f.*, fc.name as category_name, fc.color as category_color, fc.icon as category_icon, a.name as area_name
          FROM facilities f
          JOIN facility_categories fc ON f.category_id = fc.id
          LEFT JOIN areas a ON f.area_id = a.id
          WHERE f.id = ?
        `).get(item.item_id);
        return { ...item, data: facility };
      }
    });

    return res.json({ saved: hydrated });
  } catch (err) {
    console.error('Saved locations error:', err);
    return res.status(500).json({ error: 'Failed to retrieve saved locations.' });
  }
});

// Bookmark an area or facility
router.post('/', authMiddleware, (req, res) => {
  try {
    const { item_type, item_id, notes } = req.body;

    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id are required.' });
    }

    const existing = db.prepare(`
      SELECT id FROM saved_locations
      WHERE user_id = ? AND item_type = ? AND item_id = ?
    `).get(req.user.id, item_type, item_id);

    if (existing) {
      return res.json({ message: 'Item already bookmarked.', id: existing.id });
    }

    const info = db.prepare(`
      INSERT INTO saved_locations (user_id, item_type, item_id, notes)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, item_type, item_id, notes || null);

    return res.status(201).json({ message: 'Saved to bookmarks.', id: info.lastInsertRowid });
  } catch (err) {
    console.error('Save location error:', err);
    return res.status(500).json({ error: 'Failed to save bookmark.' });
  }
});

// Delete bookmark
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM saved_locations WHERE id = ? AND user_id = ?').run(id, req.user.id);
    return res.json({ message: 'Bookmark removed.' });
  } catch (err) {
    console.error('Delete bookmark error:', err);
    return res.status(500).json({ error: 'Failed to delete bookmark.' });
  }
});

export default router;
