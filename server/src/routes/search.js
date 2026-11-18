import express from 'express';
import db, { haversineDistance } from '../database/db.js';

const router = express.Router();

// Global omnibar search across Tumkur City areas and facilities
router.get('/', (req, res) => {
  try {
    const { q, lat, lng } = req.query;

    if (!q || !q.trim() || q.trim().length < 2) {
      return res.json({ query: q, total: 0, results: [] });
    }

    const searchTerm = `%${q.trim()}%`;
    const userLat = lat ? parseFloat(lat) : null;
    const userLng = lng ? parseFloat(lng) : null;

    // 1. Search Areas
    const areas = db.prepare(`
      SELECT 
        id, name, description, latitude, longitude, pin_code,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = areas.id) as facilities_count
      FROM areas
      WHERE name LIKE ? OR pin_code LIKE ? OR description LIKE ?
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm);

    const formattedAreas = areas.map(a => {
      let dist = null;
      if (userLat && userLng) {
        dist = haversineDistance(userLat, userLng, a.latitude, a.longitude);
      }
      return {
        id: a.id,
        title: a.name,
        subtitle: `Tumkur Locality • ${a.facilities_count} Mapped Facilities • PIN: ${a.pin_code || '572101'}`,
        type: 'area',
        category: 'Locality',
        latitude: a.latitude,
        longitude: a.longitude,
        distance_km: dist,
        url: `/areas/${a.id}`
      };
    });

    // 2. Search Facilities
    const facilities = db.prepare(`
      SELECT 
        f.id, f.name, f.sub_type, f.address, f.latitude, f.longitude,
        f.category_id, fc.name AS category_name, fc.color AS category_color, fc.icon AS category_icon,
        a.name AS area_name, a.id AS area_id
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.name LIKE ? OR f.address LIKE ? OR f.sub_type LIKE ? OR a.name LIKE ?
      LIMIT 16
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);

    const formattedFacilities = facilities.map(f => {
      let dist = null;
      if (userLat && userLng) {
        dist = haversineDistance(userLat, userLng, f.latitude, f.longitude);
      }
      return {
        id: f.id,
        title: f.name,
        subtitle: `${f.category_name} • ${f.sub_type} • ${f.area_name || 'Tumkur'}`,
        type: 'facility',
        category: f.category_name,
        category_id: f.category_id,
        category_color: f.category_color,
        category_icon: f.category_icon,
        latitude: f.latitude,
        longitude: f.longitude,
        distance_km: dist,
        url: `/facilities?id=${f.id}`
      };
    });

    const results = [...formattedAreas, ...formattedFacilities];

    return res.json({
      query: q,
      total: results.length,
      results
    });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ error: 'Failed to process search query.' });
  }
});

export default router;
