import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// List areas with optional taluk filter
router.get('/', (req, res) => {
  try {
    const { taluk_id, category, search } = req.query;

    let query = `
      SELECT a.*, t.name as taluk_name,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) as facilities_count
      FROM areas a
      JOIN taluks t ON a.taluk_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (taluk_id) {
      query += ' AND a.taluk_id = ?';
      params.push(taluk_id.toLowerCase());
    }

    if (category) {
      query += ' AND a.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (a.name LIKE ? OR a.pin_code LIKE ?)';
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ' ORDER BY a.name ASC';

    const areas = db.prepare(query).all(...params);
    return res.json({ areas });
  } catch (err) {
    console.error('Areas list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve areas.' });
  }
});

// Single area details + facilities
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const area = db.prepare(`
      SELECT a.*, t.name as taluk_name
      FROM areas a
      JOIN taluks t ON a.taluk_id = t.id
      WHERE a.id = ?
    `).get(id);

    if (!area) {
      return res.status(404).json({ error: `Area '${id}' not found.` });
    }

    const facilities = db.prepare(`
      SELECT f.*, fc.name as category_name, fc.color as category_color, fc.icon as category_icon
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      WHERE f.area_id = ?
      ORDER BY f.category_id ASC, f.name ASC
    `).all(id);

    const proposedProjects = db.prepare(`
      SELECT * FROM proposed_projects
      WHERE area_id = ?
    `).all(id);

    return res.json({
      area,
      facilities,
      proposed_projects: proposedProjects
    });
  } catch (err) {
    console.error('Area detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve area details.' });
  }
});

export default router;
