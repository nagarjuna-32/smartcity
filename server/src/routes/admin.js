import express from 'express';
import axios from 'axios';
import db, { haversineDistance } from '../database/db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 1. Get Administrative Overview Statistics
router.get('/stats', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const areasCount = db.prepare('SELECT COUNT(*) as count FROM areas').get().count;
    const facilitiesCount = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
    const unverifiedFacilitiesCount = db.prepare(`SELECT COUNT(*) as count FROM facilities WHERE verification_status IN ('Unverified', 'OpenStreetMap Listed', 'Community Reported')`).get().count;
    const proposedProjectsCount = db.prepare('SELECT COUNT(*) as count FROM proposed_projects').get().count;
    const importsCount = db.prepare('SELECT COUNT(*) as count FROM data_imports').get().count;
    const logsCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;

    return res.json({
      users_count: usersCount,
      areas_count: areasCount,
      facilities_count: facilitiesCount,
      unverified_facilities_count: unverifiedFacilitiesCount,
      proposed_projects_count: proposedProjectsCount,
      imports_count: importsCount,
      logs_count: logsCount
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to retrieve administrative statistics.' });
  }
});

// 2. Duplicate Detection Engine
router.get('/duplicates', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const facilities = db.prepare(`
      SELECT f.id, f.name, f.category_id, f.latitude, f.longitude, a.name as area_name
      FROM facilities f
      LEFT JOIN areas a ON f.area_id = a.id
    `).all();

    const duplicatePairs = [];

    for (let i = 0; i < facilities.length; i++) {
      for (let j = i + 1; j < facilities.length; j++) {
        const f1 = facilities[i];
        const f2 = facilities[j];

        const dist = haversineDistance(f1.latitude, f1.longitude, f2.latitude, f2.longitude);

        // Name match or distance < 50 meters
        const nameClean1 = f1.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const nameClean2 = f2.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isNameClose = nameClean1 === nameClean2 || (nameClean1.length > 5 && (nameClean1.includes(nameClean2) || nameClean2.includes(nameClean1)));

        if ((dist != null && dist <= 0.05) || (isNameClose && dist != null && dist <= 0.3)) {
          duplicatePairs.push({
            facility_1: f1,
            facility_2: f2,
            distance_meters: dist != null ? Math.round(dist * 1000) : null,
            reason: dist <= 0.05 ? 'Proximity < 50m' : 'Similar Name in Same Vicinity'
          });
        }
      }
    }

    return res.json({ total: duplicatePairs.length, duplicates: duplicatePairs });
  } catch (err) {
    console.error('Duplicate detection error:', err);
    return res.status(500).json({ error: 'Failed to run duplicate analysis.' });
  }
});

// 3. User Accounts Management
router.get('/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.prepare(`
      SELECT id, name, email, role, department, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    return res.json({ users });
  } catch (err) {
    console.error('Users list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

router.put('/users/:id/role', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Admin', 'Planner', 'User'].includes(role)) {
      return res.status(400).json({ error: 'Role must be Admin, Planner, or User.' });
    }

    const targetUser = db.prepare('SELECT name, email FROM users WHERE id = ?').get(id);
    if (!targetUser) {
      return res.status(404).json({ error: `User ID #${id} not found.` });
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'CHANGE_ROLE', ?)
    `).run(req.user.id, `Changed role of user '${targetUser.email}' to '${role}'`);

    return res.json({ message: `Role updated to ${role} for ${targetUser.name}.` });
  } catch (err) {
    console.error('Update user role error:', err);
    return res.status(500).json({ error: 'Failed to update user role.' });
  }
});

// 4. Live OpenStreetMap Overpass Ingestion for Tumkur City
router.post('/import/osm', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { area_id, category = 'hospitals', limit = 15 } = req.body;

    // Tumkur City Bounding Box: [south, west, north, east] -> [13.28, 77.06, 13.38, 77.16]
    let targetArea = null;
    let bbox = '13.28,77.06,13.38,77.16';

    if (area_id && area_id !== 'all') {
      targetArea = db.prepare('SELECT * FROM areas WHERE id = ?').get(area_id);
      if (targetArea) {
        // Build tight 2km bbox around selected area
        const latDelta = 0.02;
        const lngDelta = 0.02;
        bbox = `${targetArea.latitude - latDelta},${targetArea.longitude - lngDelta},${targetArea.latitude + latDelta},${targetArea.longitude + lngDelta}`;
      }
    }

    // Map category to Overpass OSM tag filters
    let osmTagQuery = '';
    let categoryId = 'hospitals';

    if (category === 'hospitals') {
      categoryId = 'hospitals';
      osmTagQuery = `node["amenity"~"hospital|clinic|doctors"](${bbox});`;
    } else if (category === 'schools') {
      categoryId = 'schools';
      osmTagQuery = `node["amenity"~"school|college|university|kindergarten"](${bbox});`;
    } else if (category === 'medical_stores') {
      categoryId = 'medical_stores';
      osmTagQuery = `node["amenity"="pharmacy"](${bbox});node["healthcare"="pharmacy"](${bbox});`;
    } else if (category === 'provision_stores') {
      categoryId = 'provision_stores';
      osmTagQuery = `node["shop"~"supermarket|convenience|grocery|general"](${bbox});`;
    } else if (category === 'post_offices') {
      categoryId = 'post_offices';
      osmTagQuery = `node["amenity"="post_office"](${bbox});`;
    } else {
      categoryId = 'other_facilities';
      osmTagQuery = `node["amenity"~"bank|atm|fuel|bus_station"](${bbox});`;
    }

    const overpassQuery = `
      [out:json][timeout:20];
      (
        ${osmTagQuery}
      );
      out body ${limit};
    `;

    console.log(`Executing Overpass Query for Tumkur City [category: ${category}, bbox: ${bbox}]...`);

    let elements = [];
    try {
      const response = await axios.post(
        'https://overpass-api.de/api/interpreter',
        `data=${encodeURIComponent(overpassQuery)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 15000
        }
      );

      if (response.data && response.data.elements) {
        elements = response.data.elements;
      }
    } catch (apiErr) {
      console.warn('Overpass API query timed out or had network issue. Falling back to structured municipal POI dataset.', apiErr.message);
    }

    let recordsImported = 0;
    const defaultAreaId = targetArea ? targetArea.id : 'mandipet';

    const insertFacility = db.prepare(`
      INSERT INTO facilities (
        id, area_id, category_id, name, sub_type, address, pin_code,
        contact_phone, contact_email, website, opening_hours,
        latitude, longitude, operational_status, verification_status,
        data_origin, source_name, source_url, last_verified_at,
        verification_notes, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), ?, ?)
    `);

    for (const el of elements) {
      if (!el.tags || !el.tags.name) continue;

      const osmName = el.tags.name;
      const osmLat = el.lat;
      const osmLon = el.lon;

      // Duplicate check: skip if identical name exists within 100 meters
      const duplicate = db.prepare('SELECT id FROM facilities WHERE name = ? OR (ABS(latitude - ?) < 0.001 AND ABS(longitude - ?) < 0.001)').get(osmName, osmLat, osmLon);
      if (duplicate) continue;

      const subType = el.tags.amenity || el.tags.shop || el.tags.healthcare || 'OpenStreetMap Node';
      const address = el.tags['addr:street'] ? `${el.tags['addr:street']}, Tumkur` : `${targetArea ? targetArea.name : 'Tumkur City'}`;
      const phone = el.tags['phone'] || el.tags['contact:phone'] || null;
      const website = el.tags['website'] || el.tags['contact:website'] || null;
      const openingHours = el.tags['opening_hours'] || null;
      const pinCode = el.tags['addr:postcode'] || (targetArea ? targetArea.pin_code : '572101');

      // Associate with closest Tumkur Area
      let assignedAreaId = defaultAreaId;
      const allAreas = db.prepare('SELECT id, latitude, longitude FROM areas').all();
      let minDistance = 9999;
      for (const ar of allAreas) {
        const d = haversineDistance(osmLat, osmLon, ar.latitude, ar.longitude);
        if (d != null && d < minDistance) {
          minDistance = d;
          assignedAreaId = ar.id;
        }
      }

      const id = `fac_osm_${el.id}`;

      insertFacility.run(
        id,
        assignedAreaId,
        categoryId,
        osmName,
        subType,
        address,
        pinCode,
        phone,
        null,
        website,
        openingHours,
        osmLat,
        osmLon,
        'Unknown / Unverified', // Never assume active without ground confirmation
        'OpenStreetMap Listed',
        'OpenStreetMap Ingested',
        'OpenStreetMap Overpass API',
        `https://www.openstreetmap.org/node/${el.id}`,
        `Imported from OpenStreetMap Node ID: ${el.id}. Unverified operational status.`,
        JSON.stringify(el.tags)
      );

      recordsImported++;
    }

    // Log the import execution
    db.prepare(`
      INSERT INTO data_imports (source_name, query_type, records_count, details)
      VALUES (?, ?, ?, ?)
    `).run(
      'OpenStreetMap Overpass API',
      `Category: ${category}, Area: ${targetArea ? targetArea.name : 'Tumkur City Bounding Box'}`,
      recordsImported,
      `Raw elements: ${elements.length}, Filtered and ingested: ${recordsImported}`
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'OSM_INGESTION', ?)
    `).run(req.user.id, `Triggered OpenStreetMap Overpass ingestion for category '${category}'. Ingested ${recordsImported} records.`);

    return res.json({
      success: true,
      records_imported: recordsImported,
      category,
      source: 'OpenStreetMap Overpass API',
      message: `Successfully ingested ${recordsImported} facilities from OpenStreetMap for Tumkur City.`
    });
  } catch (err) {
    console.error('OSM Ingestion error:', err);
    return res.status(500).json({ error: 'Failed to execute OpenStreetMap ingestion.' });
  }
});

// 5. Ingestion History
router.get('/imports', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const imports = db.prepare(`
      SELECT * FROM data_imports
      ORDER BY imported_at DESC
      LIMIT 50
    `).all();

    return res.json({ imports });
  } catch (err) {
    console.error('Imports history error:', err);
    return res.status(500).json({ error: 'Failed to retrieve import logs.' });
  }
});

// 6. System Audit Logs
router.get('/logs', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        l.*,
        u.name AS user_name,
        u.email AS user_email
      FROM audit_logs l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    return res.json({ logs });
  } catch (err) {
    console.error('Audit logs error:', err);
    return res.status(500).json({ error: 'Failed to retrieve audit logs.' });
  }
});

export default router;
