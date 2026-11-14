import express from 'express';
import db from '../database/db.js';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }

    const term = `%${q.trim()}%`;
    const results = [];

    // 1. Search Taluks
    const taluks = db.prepare(`
      SELECT id, name, 'taluk' as type, headquarters as subtitle, latitude, longitude
      FROM taluks
      WHERE name LIKE ? OR headquarters LIKE ?
      LIMIT 5
    `).all(term, term);

    results.push(...taluks.map(t => ({
      id: t.id,
      title: t.name,
      subtitle: `Taluk Headquarters: ${t.subtitle}`,
      type: 'Taluk',
      category: 'Administrative Region',
      latitude: t.latitude,
      longitude: t.longitude,
      url: `/taluks/${t.id}`
    })));

    // 2. Search Areas / Localities
    const areas = db.prepare(`
      SELECT a.id, a.name, a.category, a.pin_code, a.latitude, a.longitude, t.name as taluk_name, t.id as taluk_id
      FROM areas a
      JOIN taluks t ON a.taluk_id = t.id
      WHERE a.name LIKE ? OR a.pin_code LIKE ?
      LIMIT 6
    `).all(term, term);

    results.push(...areas.map(a => ({
      id: a.id,
      title: a.name,
      subtitle: `${a.taluk_name} • ${a.category}${a.pin_code ? ' (PIN ' + a.pin_code + ')' : ''}`,
      type: 'Area',
      category: a.category,
      latitude: a.latitude,
      longitude: a.longitude,
      url: `/areas/${a.id}`
    })));

    // 3. Search Facilities (Schools, Hospitals, Post Offices, Layouts, Sites)
    const facilities = db.prepare(`
      SELECT f.id, f.name, f.sub_type, f.address, f.latitude, f.longitude,
             fc.name as category_name, t.name as taluk_name, a.name as area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN taluks t ON f.taluk_id = t.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.name LIKE ? OR f.sub_type LIKE ? OR f.address LIKE ? OR f.pin_code LIKE ?
      LIMIT 10
    `).all(term, term, term, term);

    results.push(...facilities.map(f => ({
      id: f.id,
      title: f.name,
      subtitle: `${f.sub_type} • ${f.area_name || f.taluk_name || 'Tumakuru'}`,
      type: f.category_name,
      category: f.sub_type,
      latitude: f.latitude,
      longitude: f.longitude,
      url: `/facilities?id=${f.id}`
    })));

    return res.json({ query: q, total: results.length, results });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

export default router;
