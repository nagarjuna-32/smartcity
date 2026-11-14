import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// List all 10 taluks with summary stats
router.get('/', (req, res) => {
  try {
    const taluks = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM areas a WHERE a.taluk_id = t.id) as areas_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id) as facilities_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id AND f.category_id = 'schools_colleges') as schools_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id AND f.category_id = 'hospitals') as hospitals_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id AND f.category_id = 'post_offices') as post_offices_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id AND f.category_id = 'residential_layouts') as layouts_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.taluk_id = t.id AND f.category_id = 'sites_land') as sites_count
      FROM taluks t
      ORDER BY t.population DESC
    `).all();

    return res.json({ taluks });
  } catch (err) {
    console.error('Taluks fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve taluks.' });
  }
});

// Single Taluk Detail
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const taluk = db.prepare('SELECT * FROM taluks WHERE id = ?').get(id.toLowerCase());
    if (!taluk) {
      return res.status(404).json({ error: `Taluk '${id}' not found.` });
    }

    const areas = db.prepare(`
      SELECT a.*,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) as facilities_count
      FROM areas a
      WHERE a.taluk_id = ?
      ORDER BY a.name ASC
    `).all(id);

    const facilities = db.prepare(`
      SELECT f.*, fc.name as category_name, fc.color as category_color, fc.icon as category_icon, a.name as area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.taluk_id = ?
      ORDER BY f.name ASC
    `).all(id);

    const proposedProjects = db.prepare(`
      SELECT p.*, a.name as area_name
      FROM proposed_projects p
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.taluk_id = ?
      ORDER BY p.priority ASC
    `).all(id);

    return res.json({
      taluk,
      areas,
      facilities,
      proposed_projects: proposedProjects
    });
  } catch (err) {
    console.error('Taluk detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve taluk details.' });
  }
});

export default router;
