import express from 'express';
import db from '../database/db.js';

const router = express.Router();

// Tumakuru District Overview
router.get('/', (req, res) => {
  try {
    const district = db.prepare('SELECT * FROM districts WHERE id = ?').get('tumakuru');
    if (!district) {
      return res.status(404).json({ error: 'District not found.' });
    }

    const totalTaluks = db.prepare('SELECT COUNT(*) as count FROM taluks WHERE district_id = ?').get('tumakuru').count;
    const totalAreas = db.prepare('SELECT COUNT(*) as count FROM areas').get().count;
    const totalFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;

    // Counts per core category
    const categoryCounts = db.prepare(`
      SELECT fc.id, fc.name, fc.icon, fc.color, COUNT(f.id) as count
      FROM facility_categories fc
      LEFT JOIN facilities f ON fc.id = f.category_id
      GROUP BY fc.id
    `).all();

    // Verification stats
    const verificationBreakdown = db.prepare(`
      SELECT verification_status, COUNT(*) as count
      FROM facilities
      GROUP BY verification_status
    `).all();

    return res.json({
      district,
      stats: {
        total_taluks: totalTaluks,
        total_areas: totalAreas,
        total_facilities: totalFacilities,
        categories: categoryCounts,
        verification: verificationBreakdown
      }
    });
  } catch (err) {
    console.error('District fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve district data.' });
  }
});

// Surrounding Districts
router.get('/surrounding', (req, res) => {
  try {
    const surrounding = db.prepare(`
      SELECT * FROM surrounding_districts
      ORDER BY distance_km ASC
    `).all();
    return res.json({ surrounding });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve surrounding districts.' });
  }
});

export default router;
