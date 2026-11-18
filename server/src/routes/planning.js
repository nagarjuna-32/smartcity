import express from 'express';
import db from '../database/db.js';
import { authMiddleware, plannerOrAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * 1. Area-Level Smart City Planning & Infrastructure Analytics
 */
router.get('/analytics', (req, res) => {
  try {
    const { area_id } = req.query;

    // Fetch all areas with category counts
    let areasQuery = `
      SELECT 
        a.id,
        a.name,
        a.population,
        a.latitude,
        a.longitude,
        (SELECT COUNT(*) FROM facilities f WHERE f.area_id = a.id) AS total_facilities,
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

    if (area_id && area_id !== 'all') {
      areasQuery += ' AND a.id = ?';
      params.push(area_id.toLowerCase());
    }

    areasQuery += ' ORDER BY total_facilities ASC';

    const areaStats = db.prepare(areasQuery).all(...params);

    // Compute Automated Infrastructure Gap Analysis
    const gapAnalysis = [];

    for (const a of areaStats) {
      // Healthcare deficit: 0 hospitals in area
      if (a.hospitals_count === 0) {
        gapAnalysis.push({
          id: `gap_health_${a.id}`,
          area_id: a.id,
          area_name: a.name,
          category: 'Hospitals & Healthcare',
          title: `Healthcare Deficit in ${a.name}`,
          severity: 'High',
          supporting_data: `${a.name} has 0 registered primary hospitals or clinics. Population of ~${(a.population || 15000).toLocaleString()} must travel outside locality for emergency care.`,
          recommendation: `Establish an Urban Primary Health Centre (UPHC) or 24/7 Maternity Dispensary in ${a.name}.`,
          target_timeline: '2026 - 2027',
          confidence: 'High (Mapped Facility Density)'
        });
      }

      // Pharmacy gap: 0 medical stores in area
      if (a.medical_stores_count === 0) {
        gapAnalysis.push({
          id: `gap_pharma_${a.id}`,
          area_id: a.id,
          area_name: a.name,
          category: 'Medical Stores',
          title: `Essential Pharmacy Gap in ${a.name}`,
          severity: 'Medium',
          supporting_data: `Zero retail pharmacies or Jan Aushadhi Kendras mapped directly within ${a.name}.`,
          recommendation: `Incentivize Jan Aushadhi generic dispensary setup or 24/7 retail chemist license in ${a.name}.`,
          target_timeline: '2026',
          confidence: 'Medium (Survey Data)'
        });
      }

      // Provision stores gap: 0 or low provision stores
      if (a.provision_stores_count === 0) {
        gapAnalysis.push({
          id: `gap_provision_${a.id}`,
          area_id: a.id,
          area_name: a.name,
          category: 'Provision Stores',
          title: `Daily Provisions & Grocery Access Deficit in ${a.name}`,
          severity: 'Medium',
          supporting_data: `No organized grocery or provision store mapped in ${a.name}. Residents must travel to adjacent commercial corridors for daily essentials.`,
          recommendation: `Plan neighborhood daily essentials convenience market or APMC outlet in ${a.name}.`,
          target_timeline: '2027',
          confidence: 'Medium'
        });
      }

      // Schools gap: 0 schools in area
      if (a.schools_count === 0) {
        gapAnalysis.push({
          id: `gap_school_${a.id}`,
          area_id: a.id,
          area_name: a.name,
          category: 'Schools & Education',
          title: `Primary Education Access Gap in ${a.name}`,
          severity: 'High',
          supporting_data: `Absence of mapped primary or secondary public schools within ${a.name}.`,
          recommendation: `Allocate civic amenity plot for a Government Primary / Model English School.`,
          target_timeline: '2027 - 2028',
          confidence: 'High'
        });
      }
    }

    // Projects summary by status & category
    const projectsSummary = db.prepare(`
      SELECT 
        status, 
        COUNT(*) as count,
        COALESCE(SUM(estimated_budget_lakhs), 0) as total_budget_lakhs,
        COALESCE(SUM(expected_beneficiaries), 0) as total_beneficiaries
      FROM proposed_projects
      GROUP BY status
    `).all();

    // Summary KPIs
    const totalFacilities = db.prepare('SELECT COUNT(*) as count FROM facilities').get().count;
    const totalAreas = db.prepare('SELECT COUNT(*) as count FROM areas').get().count;
    const verifiedCount = db.prepare(`SELECT COUNT(*) as count FROM facilities WHERE verification_status IN ('Officially Verified', 'Admin Verified')`).get().count;

    return res.json({
      area_statistics: areaStats,
      infrastructure_gaps: gapAnalysis,
      projects_summary: projectsSummary,
      summary: {
        total_areas: totalAreas,
        total_facilities: totalFacilities,
        verified_ratio: totalFacilities > 0 ? Math.round((verifiedCount / totalFacilities) * 100) : 0,
        gaps_detected: gapAnalysis.length
      },
      data_confidence_notice: 'Preliminary analysis based on available mapped data. This does not confirm the absence of facilities.'
    });
  } catch (err) {
    console.error('Planning analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate planning analytics.' });
  }
});

/**
 * 2. Proposed Capital Works Projects CRUD
 */
router.get('/proposed-projects', (req, res) => {
  try {
    const { area_id, status, priority, category } = req.query;

    let query = `
      SELECT 
        p.*,
        a.name AS area_name
      FROM proposed_projects p
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (area_id && area_id !== 'all') {
      query += ' AND p.area_id = ?';
      params.push(area_id.toLowerCase());
    }

    if (status && status !== 'All') {
      query += ' AND p.status = ?';
      params.push(status);
    }

    if (priority && priority !== 'All') {
      query += ' AND p.priority = ?';
      params.push(priority);
    }

    if (category && category !== 'All') {
      query += ' AND p.category = ?';
      params.push(category);
    }

    query += ' ORDER BY p.priority DESC, p.created_at DESC';

    const projects = db.prepare(query).all(...params);
    return res.json({ projects, total: projects.length });
  } catch (err) {
    console.error('Proposed projects list error:', err);
    return res.status(500).json({ error: 'Failed to retrieve proposed projects.' });
  }
});

router.post('/proposed-projects', authMiddleware, (req, res) => {
  try {
    const {
      area_id,
      title,
      category,
      sub_type,
      latitude,
      longitude,
      priority = 'High',
      estimated_budget_lakhs,
      target_completion_year,
      rationale,
      expected_beneficiaries
    } = req.body;

    if (!title || !category || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Title, category, latitude, and longitude are required.' });
    }

    const id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    db.prepare(`
      INSERT INTO proposed_projects (
        id, area_id, title, category, sub_type, latitude, longitude,
        priority, status, estimated_budget_lakhs, target_completion_year,
        rationale, expected_beneficiaries, proposed_by_user_id, proposed_by_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Proposed', ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      area_id || null,
      title.trim(),
      category,
      sub_type || 'Civic Infrastructure',
      parseFloat(latitude),
      parseFloat(longitude),
      priority,
      estimated_budget_lakhs ? parseFloat(estimated_budget_lakhs) : null,
      target_completion_year ? parseInt(target_completion_year) : 2027,
      rationale || 'Infrastructure improvement proposed for community betterment.',
      expected_beneficiaries ? parseInt(expected_beneficiaries) : null,
      req.user.id,
      req.user.name
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'PROPOSE_PROJECT', ?)
    `).run(req.user.id, `Submitted project proposal: '${title}' in area '${area_id}'`);

    const created = db.prepare(`
      SELECT p.*, a.name AS area_name
      FROM proposed_projects p
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.id = ?
    `).get(id);

    return res.status(201).json({ message: 'Project proposal submitted successfully.', project: created });
  } catch (err) {
    console.error('Create proposed project error:', err);
    return res.status(500).json({ error: 'Failed to create project proposal.' });
  }
});

router.put('/proposed-projects/:id', authMiddleware, plannerOrAdminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM proposed_projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Project '${id}' not found.` });
    }

    const {
      title,
      category,
      sub_type,
      latitude,
      longitude,
      priority,
      status,
      estimated_budget_lakhs,
      target_completion_year,
      rationale,
      expected_beneficiaries
    } = req.body;

    db.prepare(`
      UPDATE proposed_projects
      SET
        title = COALESCE(?, title),
        category = COALESCE(?, category),
        sub_type = COALESCE(?, sub_type),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        priority = COALESCE(?, priority),
        status = COALESCE(?, status),
        estimated_budget_lakhs = COALESCE(?, estimated_budget_lakhs),
        target_completion_year = COALESCE(?, target_completion_year),
        rationale = COALESCE(?, rationale),
        expected_beneficiaries = COALESCE(?, expected_beneficiaries),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title ? title.trim() : null,
      category,
      sub_type,
      latitude != null ? parseFloat(latitude) : null,
      longitude != null ? parseFloat(longitude) : null,
      priority,
      status,
      estimated_budget_lakhs != null ? parseFloat(estimated_budget_lakhs) : null,
      target_completion_year != null ? parseInt(target_completion_year) : null,
      rationale,
      expected_beneficiaries != null ? parseInt(expected_beneficiaries) : null,
      id
    );

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'UPDATE_PROJECT', ?)
    `).run(req.user.id, `Updated proposed project '${id}' status to '${status}'`);

    const updated = db.prepare(`
      SELECT p.*, a.name AS area_name
      FROM proposed_projects p
      LEFT JOIN areas a ON p.area_id = a.id
      WHERE p.id = ?
    `).get(id);

    return res.json({ message: 'Project proposal updated successfully.', project: updated });
  } catch (err) {
    console.error('Update proposed project error:', err);
    return res.status(500).json({ error: 'Failed to update project proposal.' });
  }
});

router.delete('/proposed-projects/:id', authMiddleware, plannerOrAdminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT title FROM proposed_projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Project '${id}' not found.` });
    }

    db.prepare('DELETE FROM proposed_projects WHERE id = ?').run(id);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (user_id, action, details)
      VALUES (?, 'DELETE_PROJECT', ?)
    `).run(req.user.id, `Deleted proposed project '${existing.title}' (${id})`);

    return res.json({ message: `Proposed project '${existing.title}' deleted successfully.` });
  } catch (err) {
    console.error('Delete proposed project error:', err);
    return res.status(500).json({ error: 'Failed to delete proposed project.' });
  }
});

export default router;
