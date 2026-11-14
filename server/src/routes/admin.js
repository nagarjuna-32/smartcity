import express from 'express';
import axios from 'axios';
import db from '../database/db.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Admin Overview Statistics
router.get('/stats', adminMiddleware, (req, res) => {
  try {
    const totalFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
    const verifiedFacilities = db.prepare("SELECT COUNT(*) as count FROM facilities WHERE verification_status IN ('Officially Verified', 'Admin Verified')").get().count;
    const unverifiedFacilities = db.prepare("SELECT COUNT(*) as count FROM facilities WHERE verification_status IN ('Unverified', 'OpenStreetMap Listed')").get().count;
    const operationalFacilities = db.prepare("SELECT COUNT(*) as count FROM facilities WHERE operational_status = 'Operational'").get().count;
    const totalTaluks = db.prepare('SELECT COUNT(*) as count FROM taluks').get().count;
    const totalAreas = db.prepare('SELECT COUNT(*) as count FROM areas').get().count;
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM proposed_projects').get().count;
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    const dataOrigins = db.prepare(`
      SELECT data_origin, COUNT(*) as count
      FROM facilities
      GROUP BY data_origin
    `).all();

    const verificationBreakdown = db.prepare(`
      SELECT verification_status, COUNT(*) as count
      FROM facilities
      GROUP BY verification_status
    `).all();

    const recentAudits = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 12
    `).all();

    return res.json({
      summary: {
        total_facilities: totalFacilities,
        verified_facilities: verifiedFacilities,
        unverified_facilities: unverifiedFacilities,
        operational_facilities: operationalFacilities,
        total_taluks: totalTaluks,
        total_areas: totalAreas,
        total_projects: totalProjects,
        total_users: totalUsers
      },
      data_origins: dataOrigins,
      verification_breakdown: verificationBreakdown,
      recent_audits: recentAudits
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve admin statistics.' });
  }
});

// User Management
router.get('/users', adminMiddleware, (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, department, created_at FROM users ORDER BY created_at DESC').all();
    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

router.put('/users/:id/role', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Planner', 'User'].includes(role)) {
      return res.status(400).json({ error: 'Role must be Admin, Planner, or User.' });
    }

    // Prevent demoting the last admin
    if (role !== 'Admin') {
      const adminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'").get().count;
      const target = db.prepare('SELECT role FROM users WHERE id = ?').get(id);
      if (target?.role === 'Admin' && adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot demote the sole remaining administrator.' });
      }
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'USER_ROLE_CHANGE', `Changed user ID ${id} role to ${role}`);

    return res.json({ message: `User role updated to ${role} successfully.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// Real Data Integration: Live OpenStreetMap Overpass Ingestion
router.post('/import/osm', adminMiddleware, async (req, res) => {
  try {
    const { taluk_id = 'tumakuru', category = 'hospitals', limit = 15 } = req.body;

    // Tumakuru Bounding Box: [south, west, north, east]
    // Approx Tumakuru district coordinates: [13.0, 76.4, 14.3, 77.5]
    let amenityFilter = 'amenity~"hospital|clinic|doctors"';
    let targetCatId = 'hospitals';
    let defaultSubType = 'Healthcare Facility';

    if (category === 'schools_colleges') {
      amenityFilter = 'amenity~"school|college|university"';
      targetCatId = 'schools_colleges';
      defaultSubType = 'Educational Institution';
    } else if (category === 'post_offices') {
      amenityFilter = 'amenity="post_office"';
      targetCatId = 'post_offices';
      defaultSubType = 'Post Office';
    }

    const overpassQuery = `
      [out:json][timeout:25];
      (
        node[${amenityFilter}](13.1,76.5,13.8,77.3);
        way[${amenityFilter}](13.1,76.5,13.8,77.3);
      );
      out center ${limit};
    `;

    const endpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
    ];

    let osmData = null;
    let usedEndpoint = '';

    for (const ep of endpoints) {
      try {
        const response = await axios.post(ep, `data=${encodeURIComponent(overpassQuery)}`, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        });
        if (response.data?.elements) {
          osmData = response.data.elements;
          usedEndpoint = ep;
          break;
        }
      } catch (e) {
        console.warn(`Overpass mirror ${ep} failed, trying next...`);
      }
    }

    if (!osmData || osmData.length === 0) {
      return res.json({
        message: 'OpenStreetMap query completed. No new facilities returned or service temporarily rate-limited.',
        records_imported: 0
      });
    }

    let inserted = 0;
    let updated = 0;

    const insertFac = db.prepare(`
      INSERT OR REPLACE INTO facilities (
        id, category_id, taluk_id, area_id, name, sub_type, address, pin_code,
        latitude, longitude, operational_status, verification_status,
        data_origin, source_name, source_url, last_verified_at, verification_notes, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?)
    `);

    for (const el of osmData) {
      const lat = el.lat || el.center?.lat;
      const lon = el.lon || el.center?.lon;
      const tags = el.tags || {};
      const name = tags.name || tags['name:en'] || tags['name:kn'];

      if (!name || lat == null || lon == null) continue;

      const facId = `OSM-${el.type[0].toUpperCase()}${el.id}`;
      const address = tags['addr:street'] || tags['addr:full'] || tags['addr:suburb'] || `${name}, Tumakuru District`;
      const pinCode = tags['addr:postcode'] || null;

      const details = {
        osm_id: el.id,
        osm_type: el.type,
        amenity: tags.amenity,
        operator: tags.operator,
        phone: tags.phone || tags['contact:phone'],
        website: tags.website
      };

      insertFac.run(
        facId,
        targetCatId,
        taluk_id.toLowerCase(),
        null,
        name,
        tags.amenity || defaultSubType,
        address,
        pinCode,
        lat,
        lon,
        'Unknown / Unverified', // An OSM map tag does not guarantee active operations!
        'OpenStreetMap Listed',
        'Real Source Data',
        'OpenStreetMap Overpass API',
        `https://www.openstreetmap.org/${el.type}/${el.id}`,
        'Imported via live Overpass API query. Operational status marked Unknown / Unverified pending field audit.',
        JSON.stringify(details)
      );

      inserted++;
    }

    // Log the import
    db.prepare(`
      INSERT INTO data_imports (source_name, query_type, records_count, details)
      VALUES (?, ?, ?, ?)
    `).run(
      'OpenStreetMap Overpass Live API',
      `Live Spatial Ingestion (${category} in Tumakuru)`,
      inserted,
      `Extracted ${inserted} real geographic records from ${usedEndpoint}`
    );

    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'DATA_IMPORT_OSM', `Imported ${inserted} ${category} records from OpenStreetMap`);

    return res.json({
      message: `Successfully processed ${inserted} real facilities from OpenStreetMap Overpass API.`,
      records_imported: inserted,
      category: targetCatId
    });
  } catch (err) {
    console.error('OSM Import Error:', err);
    return res.status(500).json({ error: 'Failed to import OSM data: ' + err.message });
  }
});

// Import History
router.get('/imports', adminMiddleware, (req, res) => {
  try {
    const imports = db.prepare('SELECT * FROM data_imports ORDER BY imported_at DESC LIMIT 50').all();
    return res.json({ imports });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve import logs.' });
  }
});

// Audit Logs
router.get('/logs', adminMiddleware, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT a.*, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 100
    `).all();
    return res.json({ logs });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
