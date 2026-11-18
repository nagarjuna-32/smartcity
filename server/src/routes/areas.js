import express from 'express';
import db, { haversineDistance } from '../database/db.js';
import { authMiddleware, adminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// List all areas in Tumkur City with dynamic facility counts
router.get('/', (req, res) => {
  try {
    const { search, sort } = req.query;

    let query = `
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) AS facilities_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'schools') AS schools_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'hospitals') AS hospitals_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'provision_stores') AS provision_stores_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'medical_stores') AS medical_stores_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'post_offices') AS post_offices_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'residential_layouts') AS layouts_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'sites_and_land') AS sites_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'other_facilities') AS other_count
      FROM areas a
      WHERE 1=1
    `;
    const params = [];

    if (search && search.trim()) {
      query += ' AND (a.name LIKE ? OR a.pin_code LIKE ? OR a.description LIKE ?)';
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    if (sort === 'name_desc') {
      query += ' ORDER BY a.name DESC';
    } else if (sort === 'facilities_desc') {
      query += ' ORDER BY facilities_count DESC';
    } else if (sort === 'population_desc') {
      query += ' ORDER BY a.population DESC';
    } else {
      query += ' ORDER BY a.name ASC';
    }

    const areas = db.prepare(query).all(...params);
    return res.json({ areas, total: areas.length });
  } catch (err) {
    console.error('Areas list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve areas.' });
  }
});

// Single area details + facilities + distance radius search + infrastructure analysis
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { radius_km, category_id } = req.query;

    const area = db.prepare(`
      SELECT 
        a.*,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) AS facilities_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'schools') AS schools_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'hospitals') AS hospitals_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'provision_stores') AS provision_stores_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'medical_stores') AS medical_stores_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'post_offices') AS post_offices_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'residential_layouts') AS layouts_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'sites_and_land') AS sites_count,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id AND f.category_id = 'other_facilities') AS other_count
      FROM areas a
      WHERE a.id = ?
    `).get(id);

    if (!area) {
      return res.status(404).json({ error: `Area '${id}' not found.` });
    }

    // Fetch all facilities in Tumkur to calculate real distance from area centroid
    let facilityQuery = `
      SELECT f.*, fc.name AS category_name, fc.color AS category_color, fc.icon AS category_icon,
        ar.name AS area_name
      FROM facilities f
      JOIN facility_categories fc ON f.category_id = fc.id
      LEFT JOIN areas ar ON f.area_id = ar.id
      WHERE 1=1
    `;
    const fParams = [];

    if (category_id && category_id !== 'all') {
      facilityQuery += ' AND f.category_id = ?';
      fParams.push(category_id);
    }

    const allFacilities = db.prepare(facilityQuery).all(...fParams);

    // Calculate distance from this area's coordinates
    const mappedFacilities = allFacilities.map((f) => {
      const dist = haversineDistance(area.latitude, area.longitude, f.latitude, f.longitude);
      return {
        ...f,
        distance_km: dist,
        distance_meters: dist != null ? Math.round(dist * 1000) : null
      };
    });

    // Filter by radius if requested (e.g. 0.5km, 1km, 2km, 5km)
    let filteredFacilities = mappedFacilities;
    if (radius_km && radius_km !== 'all') {
      const maxDist = parseFloat(radius_km);
      if (!isNaN(maxDist)) {
        filteredFacilities = mappedFacilities.filter(f => f.distance_km != null && f.distance_km <= maxDist);
      }
    }

    // Sort by nearest
    filteredFacilities.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));

    // Proposed development projects in or near this area
    const proposedProjects = db.prepare(`
      SELECT p.*, a.name AS area_name
      FROM proposed_projects p
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.area_id = ?
      ORDER BY p.priority DESC, p.created_at DESC
    `).all(id);

    // Compute area infrastructure gap metrics
    const nearestHospital = mappedFacilities.find(f => f.category_id === 'hospitals');
    const nearestSchool = mappedFacilities.find(f => f.category_id === 'schools');
    const nearestMedicalStore = mappedFacilities.find(f => f.category_id === 'medical_stores');
    const nearestProvisionStore = mappedFacilities.find(f => f.category_id === 'provision_stores');

    const gapAlerts = [];
    if (!nearestHospital || (nearestHospital.distance_km != null && nearestHospital.distance_km > 2.0)) {
      gapAlerts.push({
        id: 'gap_health',
        type: 'Healthcare Access Deficit',
        severity: 'High',
        message: `Nearest hospital is ${(nearestHospital?.distance_km ?? 'N/A')} km away. Priority candidate for a new Urban Health Centre or Clinic.`,
        recommendation: 'Propose Urban Primary Health Centre (UPHC)'
      });
    }

    if (!nearestMedicalStore || (nearestMedicalStore.distance_km != null && nearestMedicalStore.distance_km > 1.2)) {
      gapAlerts.push({
        id: 'gap_pharma',
        type: 'Pharmacy Outreach Gap',
        severity: 'Medium',
        message: `No registered 24/7 medical store within 1 km. Citizens must travel ${(nearestMedicalStore?.distance_km ?? 'N/A')} km for essential medicines.`,
        recommendation: 'Encourage Jan Aushadhi Kendra or 24/7 Retail Pharmacy'
      });
    }

    if (!nearestProvisionStore || (nearestProvisionStore.distance_km != null && nearestProvisionStore.distance_km > 1.0)) {
      gapAlerts.push({
        id: 'gap_grocery',
        type: 'Daily Essentials Deficit',
        severity: 'Low',
        message: `Essential grocery / provision availability is sparse within walking radius (< 1 km).`,
        recommendation: 'Plan neighborhood daily needs shopping complex'
      });
    }

    return res.json({
      area,
      facilities: filteredFacilities,
      total_nearby: filteredFacilities.length,
      proposed_projects: proposedProjects,
      infrastructure_metrics: {
        nearest_hospital_km: nearestHospital?.distance_km ?? null,
        nearest_hospital_name: nearestHospital?.name ?? 'None in survey range',
        nearest_school_km: nearestSchool?.distance_km ?? null,
        nearest_school_name: nearestSchool?.name ?? 'None in survey range',
        nearest_medical_km: nearestMedicalStore?.distance_km ?? null,
        nearest_medical_name: nearestMedicalStore?.name ?? 'None in survey range',
        nearest_provision_km: nearestProvisionStore?.distance_km ?? null,
        nearest_provision_name: nearestProvisionStore?.name ?? 'None in survey range',
        gap_alerts: gapAlerts,
        notice: 'Preliminary analysis based on available mapped data. This does not confirm the absence of facilities.'
      }
    });
  } catch (err) {
    console.error('Area detail error:', err);
    return res.status(500).json({ error: 'Failed to retrieve area details.' });
  }
});

// Admin: Add new area
router.post('/', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { name, description, latitude, longitude, population, pin_code, infrastructure_summary } = req.body;

    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Name, latitude, and longitude are required.' });
    }

    const id = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');

    // Check duplicate
    const existing = db.prepare('SELECT id FROM areas WHERE id = ? OR name = ?').get(id, name.trim());
    if (existing) {
      return res.status(409).json({ error: `Area with name or ID '${name}' already exists.` });
    }

    db.prepare(`
      INSERT INTO areas (id, name, description, latitude, longitude, population, pin_code, infrastructure_summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      description || '',
      parseFloat(latitude),
      parseFloat(longitude),
      population ? parseInt(population) : null,
      pin_code || '',
      infrastructure_summary || ''
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'CREATE_AREA', ?)
    `).run(req.user.id, `Created new Tumkur City area: ${name} (${id})`);

    const newArea = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
    return res.status(201).json({ message: 'Area added successfully.', area: newArea });
  } catch (err) {
    console.error('Create area error:', err);
    return res.status(500).json({ error: 'Failed to create area.' });
  }
});

// Admin: Update area
router.put('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, latitude, longitude, population, pin_code, infrastructure_summary } = req.body;

    const existing = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Area '${id}' not found.` });
    }

    db.prepare(`
      UPDATE areas
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        population = COALESCE(?, population),
        pin_code = COALESCE(?, pin_code),
        infrastructure_summary = COALESCE(?, infrastructure_summary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      description,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      population != null ? parseInt(population) : null,
      pin_code,
      infrastructure_summary,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_AREA', ?)
    `).run(req.user.id, `Updated area details: ${id}`);

    const updatedArea = db.prepare('SELECT * FROM areas WHERE id = ?').get(id);
    return res.json({ message: 'Area updated successfully.', area: updatedArea });
  } catch (err) {
    console.error('Update area error:', err);
    return res.status(500).json({ error: 'Failed to update area.' });
  }
});

// Admin: Delete area
router.delete('/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;

    const existing = db.prepare('SELECT name FROM areas WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Area '${id}' not found.` });
    }

    db.prepare('DELETE FROM areas WHERE id = ?').run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_AREA', ?)
    `).run(req.user.id, `Deleted area: ${existing.name} (${id})`);

    return res.json({ message: `Area '${existing.name}' deleted successfully.` });
  } catch (err) {
    console.error('Delete area error:', err);
    return res.status(500).json({ error: 'Failed to delete area.' });
  }
});

export default router;
