import express from 'express';
import db, { haversineDistance } from '../database/db.js';
import { authMiddleware, adminMiddleware, plannerOrAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// 1. Get All 8 Facility Categories with Dynamic Counts
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT 
        fc.*,
        (SELECT COUNT(*) FROM facilities f WHERE f.category_id = fc.id) as count
      FROM facility_categories fc
      ORDER BY fc.name ASC
    `).all();

    return res.json({ categories });
  } catch (err) {
    console.error('Categories error:', err);
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// 2. Get Facilities with Multi-Category, Area, Radius, and Distance Sorting
router.get('/', (req, res) => {
  try {
    const {
      area_id,
      category_id,
      categories,
      search,
      lat,
      lng,
      radius_km,
      verified_only,
      operational_status,
      sort,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT 
        f.*,
        fc.name AS category_name,
        fc.color AS category_color,
        fc.icon AS category_icon,
        a.name AS area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by single area
    if (area_id && area_id !== 'all') {
      query += ' AND f.area_id = ?';
      params.push(area_id.toLowerCase());
    }

    // Filter by single or multiple categories
    if (categories) {
      const catList = categories.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
      if (catList.length > 0) {
        const placeholders = catList.map(() => '?').join(',');
        query += ` AND f.category_id IN (${placeholders})`;
        params.push(...catList);
      }
    } else if (category_id && category_id !== 'all') {
      query += ' AND f.category_id = ?';
      params.push(category_id.toLowerCase());
    }

    // Filter by verification status
    if (verified_only === 'true') {
      query += ` AND f.verification_status IN ('Officially Verified', 'Admin Verified')`;
    }

    // Filter by operational status
    if (operational_status && operational_status !== 'all') {
      query += ' AND f.operational_status = ?';
      params.push(operational_status);
    }

    // Filter by search query
    if (search && search.trim()) {
      query += ' AND (f.name LIKE ? OR f.address LIKE ? OR f.sub_type LIKE ? OR a.name LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    let rows = db.prepare(query).all(...params);

    // Calculate distance if lat/lng are provided
    const userLat = lat != null ? parseFloat(lat) : null;
    const userLng = lng != null ? parseFloat(lng) : null;

    if (userLat != null && userLng != null && !isNaN(userLat) && !isNaN(userLng)) {
      rows = rows.map((f) => {
        const dist = haversineDistance(userLat, userLng, f.latitude, f.longitude);
        return {
          ...f,
          distance_km: dist,
          distance_meters: dist != null ? Math.round(dist * 1000) : null
        };
      });

      // Filter by radius if specified
      if (radius_km && radius_km !== 'all') {
        const maxDist = parseFloat(radius_km);
        if (!isNaN(maxDist)) {
          rows = rows.filter(f => f.distance_km != null && f.distance_km <= maxDist);
        }
      }

      // Sort by distance if requested or default
      if (sort === 'nearest' || !sort) {
        rows.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));
      }
    }

    if (sort === 'name_asc') {
      rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'category') {
      rows.sort((a, b) => a.category_name.localeCompare(b.category_name));
    }

    const total = rows.length;
    const paginated = rows.slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    return res.json({
      total,
      facilities: paginated,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Facilities list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve facilities.' });
  }
});

// 3. Single Facility Details + Nearby Facilities
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { user_lat, user_lng } = req.query;

    const facility = db.prepare(`
      SELECT 
        f.*,
        fc.name AS category_name,
        fc.color AS category_color,
        fc.icon AS category_icon,
        a.name AS area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.id = ?
    `).get(id);

    if (!facility) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    if (user_lat && user_lng) {
      const uLat = parseFloat(user_lat);
      const uLng = parseFloat(user_lng);
      facility.distance_km = haversineDistance(uLat, uLng, facility.latitude, facility.longitude);
    }

    // Parse details_json safely
    if (facility.details_json) {
      try {
        facility.details = JSON.parse(facility.details_json);
      } catch (e) {
        facility.details = {};
      }
    }

    // Nearby facilities within 3 km
    const nearby = db.prepare(`
      SELECT 
        f.*,
        fc.name AS category_name,
        fc.color AS category_color,
        fc.icon AS category_icon,
        a.name AS area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.id != ?
    `).all(id)
      .map(f => ({
        ...f,
        distance_km: haversineDistance(facility.latitude, facility.longitude, f.latitude, f.longitude)
      }))
      .filter(f => f.distance_km != null && f.distance_km <= 3.0)
      .sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999))
      .slice(0, 8);

    return res.json({ facility, nearby });
  } catch (err) {
    console.error('Facility detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve facility details.' });
  }
});

// 4. Create Facility (Admin or Planner)
router.post('/', authMiddleware, plannerOrAdminMiddleware, (req, res) => {
  try {
    const {
      area_id,
      category_id,
      name,
      sub_type,
      address,
      pin_code,
      contact_phone,
      contact_email,
      website,
      opening_hours,
      latitude,
      longitude,
      operational_status = 'Operational',
      verification_status = 'Admin Verified',
      data_origin = 'Admin Verified Data',
      source_name = 'Tumkur Urban Management System',
      source_url,
      verification_notes,
      details_json
    } = req.body;

    if (!name || !category_id || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Facility name, category_id, latitude, and longitude are required.' });
    }

    const id = `fac_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    db.prepare(`
      INSERT INTO facilities (
        id, area_id, category_id, name, sub_type, address, pin_code,
        contact_phone, contact_email, website, opening_hours,
        latitude, longitude, operational_status, verification_status,
        data_origin, source_name, source_url, last_verified_at,
        verification_notes, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE('now'), ?, ?)
    `).run(
      id,
      area_id || null,
      category_id,
      name.trim(),
      sub_type || 'General Facility',
      address || 'Tumkur City',
      pin_code || '572101',
      contact_phone || null,
      contact_email || null,
      website || null,
      opening_hours || null,
      parseFloat(latitude),
      parseFloat(longitude),
      operational_status,
      verification_status,
      data_origin,
      source_name,
      source_url || null,
      verification_notes || `Added by user ${req.user.name}`,
      typeof details_json === 'object' ? JSON.stringify(details_json) : (details_json || null)
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'CREATE_FACILITY', ?)
    `).run(req.user.id, `Created facility '${name}' in area '${area_id}'`);

    const created = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    return res.status(201).json({ message: 'Facility created successfully.', facility: created });
  } catch (err) {
    console.error('Create facility error:', err);
    return res.status(500).json({ error: 'Failed to create facility.' });
  }
});

// 5. Update Facility (Admin or Planner)
router.put('/:id', authMiddleware, plannerOrAdminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    const {
      area_id,
      category_id,
      name,
      sub_type,
      address,
      pin_code,
      contact_phone,
      contact_email,
      website,
      opening_hours,
      latitude,
      longitude,
      operational_status,
      verification_status,
      verification_notes,
      details_json
    } = req.body;

    db.prepare(`
      UPDATE facilities
      SET
        area_id = COALESCE(?, area_id),
        category_id = COALESCE(?, category_id),
        name = COALESCE(?, name),
        sub_type = COALESCE(?, sub_type),
        address = COALESCE(?, address),
        pin_code = COALESCE(?, pin_code),
        contact_phone = COALESCE(?, contact_phone),
        contact_email = COALESCE(?, contact_email),
        website = COALESCE(?, website),
        opening_hours = COALESCE(?, opening_hours),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        operational_status = COALESCE(?, operational_status),
        verification_status = COALESCE(?, verification_status),
        verification_notes = COALESCE(?, verification_notes),
        details_json = COALESCE(?, details_json),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      area_id,
      category_id,
      name ? name.trim() : null,
      sub_type,
      address,
      pin_code,
      contact_phone,
      contact_email,
      website,
      opening_hours,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      operational_status,
      verification_status,
      verification_notes,
      typeof details_json === 'object' ? JSON.stringify(details_json) : details_json,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_FACILITY', ?)
    `).run(req.user.id, `Updated facility details for: ${id}`);

    const updated = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    return res.json({ message: 'Facility updated successfully.', facility: updated });
  } catch (err) {
    console.error('Update facility error:', err);
    return res.status(500).json({ error: 'Failed to update facility.' });
  }
});

// 6. Verify Facility Record (Admin only)
router.put('/:id/verify', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { operational_status, verification_status, notes } = req.body;

    const existing = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    db.prepare(`
      UPDATE facilities
      SET
        operational_status = COALESCE(?, operational_status),
        verification_status = COALESCE(?, 'Officially Verified'),
        last_verified_at = DATE('now'),
        verification_notes = COALESCE(?, verification_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(operational_status, verification_status, notes, id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'VERIFY_FACILITY', ?)
    `).run(req.user.id, `Verified facility '${existing.name}' (${id}) status: ${verification_status}`);

    const updated = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    return res.json({ message: 'Facility verified successfully.', facility: updated });
  } catch (err) {
    console.error('Verify facility error:', err);
    return res.status(500).json({ error: 'Failed to verify facility.' });
  }
});

// 7. Delete Facility (Admin only)
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT name FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    db.prepare('DELETE FROM facilities WHERE id = ?').run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_FACILITY', ?)
    `).run(req.user.id, `Deleted facility '${existing.name}' (${id})`);

    return res.json({ message: `Facility '${existing.name}' deleted successfully.` });
  } catch (err) {
    console.error('Delete facility error:', err);
    return res.status(500).json({ error: 'Failed to delete facility.' });
  }
});

export default router;
