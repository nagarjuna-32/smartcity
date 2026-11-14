import express from 'express';
import db, { haversineDistance } from '../database/db.js';
import { adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// List categories
router.get('/categories', (req, res) => {
  try {
    const categories = db.prepare(`
      SELECT fc.*,
        (SELECT COUNT(*) FROM facilities f WHERE f.category_id = fc.id) as count
      FROM facility_categories fc
      ORDER BY fc.name ASC
    `).all();
    return res.json({ categories });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve categories.' });
  }
});

// List facilities with multi-criteria filtering & spatial proximity
router.get('/', (req, res) => {
  try {
    const {
      category_id,
      taluk_id,
      area_id,
      operational_status,
      verification_status,
      data_origin,
      search,
      user_lat,
      user_lng,
      radius_km,
      limit = 100,
      offset = 0
    } = req.query;

    let query = `
      SELECT f.*,
        fc.name as category_name, fc.color as category_color, fc.icon as category_icon,
        t.name as taluk_name,
        a.name as area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN taluks t ON f.taluk_id = t.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (category_id && category_id !== 'all') {
      query += ' AND f.category_id = ?';
      params.push(category_id);
    }

    if (taluk_id && taluk_id !== 'all') {
      query += ' AND f.taluk_id = ?';
      params.push(taluk_id.toLowerCase());
    }

    if (area_id && area_id !== 'all') {
      query += ' AND f.area_id = ?';
      params.push(area_id);
    }

    if (operational_status && operational_status !== 'all') {
      query += ' AND f.operational_status = ?';
      params.push(operational_status);
    }

    if (verification_status && verification_status !== 'all') {
      query += ' AND f.verification_status = ?';
      params.push(verification_status);
    }

    if (data_origin && data_origin !== 'all') {
      query += ' AND f.data_origin = ?';
      params.push(data_origin);
    }

    if (search && search.trim()) {
      const s = `%${search.trim()}%`;
      query += ' AND (f.name LIKE ? OR f.sub_type LIKE ? OR f.address LIKE ? OR f.pin_code LIKE ?)';
      params.push(s, s, s, s);
    }

    query += ' ORDER BY f.name ASC';

    let facilities = db.prepare(query).all(...params);

    // Compute Haversine distance if user coordinates provided
    const uLat = parseFloat(user_lat);
    const uLng = parseFloat(user_lng);
    const maxRadius = radius_km ? parseFloat(radius_km) : null;

    if (!isNaN(uLat) && !isNaN(uLng)) {
      facilities = facilities.map(f => {
        const distance = haversineDistance(uLat, uLng, f.latitude, f.longitude);
        return { ...f, distance_km: distance };
      });

      if (maxRadius) {
        facilities = facilities.filter(f => f.distance_km <= maxRadius);
      }

      // Sort by proximity
      facilities.sort((a, b) => a.distance_km - b.distance_km);
    }

    const total = facilities.length;
    const paginated = facilities.slice(Number(offset), Number(offset) + Number(limit));

    // Safely parse details_json
    const parsed = paginated.map(f => {
      let details = null;
      try {
        if (f.details_json) details = JSON.parse(f.details_json);
      } catch (e) {}
      return { ...f, details };
    });

    return res.json({
      total,
      limit: Number(limit),
      offset: Number(offset),
      facilities: parsed
    });
  } catch (err) {
    console.error('Facilities list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve facilities.' });
  }
});

// Single Facility Detail
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { user_lat, user_lng } = req.query;

    const facility = db.prepare(`
      SELECT f.*,
        fc.name as category_name, fc.color as category_color, fc.icon as category_icon,
        t.name as taluk_name,
        a.name as area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN taluks t ON f.taluk_id = t.id
      LEFT JOIN areas a ON f.area_id = a.id
      WHERE f.id = ?
    `).get(id);

    if (!facility) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    let details = null;
    try {
      if (facility.details_json) details = JSON.parse(facility.details_json);
    } catch (e) {}

    let distance_km = null;
    const uLat = parseFloat(user_lat);
    const uLng = parseFloat(user_lng);
    if (!isNaN(uLat) && !isNaN(uLng)) {
      distance_km = haversineDistance(uLat, uLng, facility.latitude, facility.longitude);
    }

    // Nearby facilities in the same area or taluk
    const nearby = db.prepare(`
      SELECT f.id, f.name, f.category_id, f.sub_type, f.latitude, f.longitude,
             fc.name as category_name, fc.color as category_color, fc.icon as category_icon
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      WHERE f.taluk_id = ? AND f.id != ?
      LIMIT 8
    `).all(facility.taluk_id, id).map(item => ({
      ...item,
      distance_km: haversineDistance(facility.latitude, facility.longitude, item.latitude, item.longitude)
    })).sort((a, b) => a.distance_km - b.distance_km);

    return res.json({
      facility: {
        ...facility,
        details,
        distance_km
      },
      nearby
    });
  } catch (err) {
    console.error('Facility detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve facility details.' });
  }
});

// Admin: Create Facility
router.post('/', adminMiddleware, (req, res) => {
  try {
    const {
      id,
      category_id,
      taluk_id,
      area_id,
      name,
      sub_type,
      address,
      pin_code,
      contact_phone,
      contact_email,
      website,
      latitude,
      longitude,
      operational_status = 'Unknown / Unverified',
      verification_status = 'Admin Verified',
      data_origin = 'Admin Verified Data',
      source_name = 'Tumakuru Municipal Authority Record',
      source_url = '',
      verification_notes = '',
      details = {}
    } = req.body;

    if (!name || !category_id || !taluk_id || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Name, category_id, taluk_id, latitude, and longitude are required.' });
    }

    const facId = id?.trim() || `FAC-MANUAL-${Date.now().toString(36).toUpperCase()}`;

    const insert = db.prepare(`
      INSERT INTO facilities (
        id, category_id, taluk_id, area_id, name, sub_type, address, pin_code,
        contact_phone, contact_email, website, latitude, longitude,
        operational_status, verification_status, data_origin, source_name,
        source_url, last_verified_at, verification_notes, details_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?)
    `);

    insert.run(
      facId,
      category_id,
      taluk_id,
      area_id || null,
      name.trim(),
      sub_type || 'General Facility',
      address || 'Tumakuru District',
      pin_code || null,
      contact_phone || null,
      contact_email || null,
      website || null,
      parseFloat(latitude),
      parseFloat(longitude),
      operational_status,
      verification_status,
      data_origin,
      source_name,
      source_url,
      verification_notes,
      JSON.stringify(details)
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'FACILITY_CREATE', `Created facility ${facId} (${name}) in ${taluk_id}`);

    const created = db.prepare('SELECT * FROM facilities WHERE id = ?').get(facId);
    return res.status(201).json({ message: 'Facility registered successfully', facility: created });
  } catch (err) {
    console.error('Facility create error:', err);
    return res.status(500).json({ error: 'Failed to create facility: ' + err.message });
  }
});

// Admin: Update Facility
router.put('/:id', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    const {
      name = existing.name,
      category_id = existing.category_id,
      taluk_id = existing.taluk_id,
      area_id = existing.area_id,
      sub_type = existing.sub_type,
      address = existing.address,
      pin_code = existing.pin_code,
      contact_phone = existing.contact_phone,
      contact_email = existing.contact_email,
      website = existing.website,
      latitude = existing.latitude,
      longitude = existing.longitude,
      operational_status = existing.operational_status,
      verification_status = existing.verification_status,
      data_origin = existing.data_origin,
      source_name = existing.source_name,
      source_url = existing.source_url,
      verification_notes = existing.verification_notes,
      details
    } = req.body;

    const detailsJson = details ? JSON.stringify(details) : existing.details_json;

    db.prepare(`
      UPDATE facilities SET
        name = ?, category_id = ?, taluk_id = ?, area_id = ?, sub_type = ?,
        address = ?, pin_code = ?, contact_phone = ?, contact_email = ?,
        website = ?, latitude = ?, longitude = ?, operational_status = ?,
        verification_status = ?, data_origin = ?, source_name = ?,
        source_url = ?, last_verified_at = date('now'), verification_notes = ?,
        details_json = ?
      WHERE id = ?
    `).run(
      name, category_id, taluk_id, area_id, sub_type, address, pin_code,
      contact_phone, contact_email, website, parseFloat(latitude), parseFloat(longitude),
      operational_status, verification_status, data_origin, source_name, source_url,
      verification_notes, detailsJson, id
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'FACILITY_UPDATE', `Updated facility ${id} (${name})`);

    const updated = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    return res.json({ message: 'Facility updated successfully', facility: updated });
  } catch (err) {
    console.error('Facility update error:', err);
    return res.status(500).json({ error: 'Failed to update facility: ' + err.message });
  }
});

// Admin: Quick Verify Status
router.put('/:id/verify', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { operational_status, verification_status, notes } = req.body;

    const existing = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    db.prepare(`
      UPDATE facilities SET
        operational_status = COALESCE(?, operational_status),
        verification_status = COALESCE(?, verification_status),
        verification_notes = COALESCE(?, verification_notes),
        last_verified_at = date('now')
      WHERE id = ?
    `).run(operational_status, verification_status, notes, id);

    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'FACILITY_VERIFY', `Verified facility ${id} as ${operational_status} / ${verification_status}`);

    const updated = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    return res.json({ message: 'Verification status updated', facility: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Verification update failed: ' + err.message });
  }
});

// Admin: Delete Facility
router.delete('/:id', adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM facilities WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Facility '${id}' not found.` });
    }

    db.prepare('DELETE FROM facilities WHERE id = ?').run(id);

    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'FACILITY_DELETE', `Deleted facility ${id} (${existing.name})`);

    return res.json({ message: `Facility '${id}' deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ error: 'Delete failed: ' + err.message });
  }
});

export default router;
