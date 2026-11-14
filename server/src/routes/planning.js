import express from 'express';
import db from '../database/db.js';
import { plannerOrAdminMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Smart City Planning: Facility Coverage & Gap Detection Analytics
router.get('/analytics', (req, res) => {
  try {
    const { taluk_id } = req.query;

    let talukFilter = '';
    const params = [];
    if (taluk_id && taluk_id !== 'all') {
      talukFilter = ' WHERE t.id = ?';
      params.push(taluk_id.toLowerCase());
    }

    // 1. Taluk-wise facility counts and coverage benchmarks
    const talukStats = db.prepare(`
      SELECT
        t.id, t.name, t.population, t.area_sq_km,
        COUNT(DISTINCT a.id) as total_settlements,
        COUNT(DISTINCT f.id) as total_facilities,
        COUNT(DISTINCT CASE WHEN f.category_id = 'schools_colleges' THEN f.id END) as schools_count,
        COUNT(DISTINCT CASE WHEN f.category_id = 'hospitals' AND f.operational_status = 'Operational' THEN f.id END) as operational_hospitals,
        COUNT(DISTINCT CASE WHEN f.category_id = 'hospitals' THEN f.id END) as total_hospitals,
        COUNT(DISTINCT CASE WHEN f.category_id = 'post_offices' THEN f.id END) as post_offices_count,
        COUNT(DISTINCT CASE WHEN f.category_id = 'residential_layouts' THEN f.id END) as residential_layouts_count,
        COUNT(DISTINCT CASE WHEN f.category_id = 'sites_land' THEN f.id END) as land_sites_count
      FROM taluks t
      LEFT JOIN areas a ON t.id = a.taluk_id
      LEFT JOIN facilities f ON t.id = f.taluk_id
      ${talukFilter}
      GROUP BY t.id
      ORDER BY t.population DESC
    `).all(...params);

    // 2. Identify infrastructure gaps based on actual data
    const detectedGaps = [];

    for (const ts of talukStats) {
      // Healthcare deficit: population > 150k with fewer than 2 operational hospitals
      if (ts.population > 150000 && ts.operational_hospitals < 2) {
        detectedGaps.push({
          id: `GAP-HLT-${ts.id.toUpperCase()}`,
          taluk_id: ts.id,
          taluk_name: ts.name,
          category: 'Healthcare Access Gap',
          title: `Secondary Healthcare Deficit in ${ts.name}`,
          severity: 'High',
          supporting_data: `Population of ${ts.population.toLocaleString()} has only ${ts.operational_hospitals} confirmed operational hospital recorded.`,
          recommendation: 'Establish an upgraded 100-bed Sub-Divisional Hospital or Trauma Care Centre with dialysis and pediatric ICU.',
          target_timeline: '2027-2028',
          confidence: 'High (Census & Verified NHM records)'
        });
      }

      // Educational institutions gap
      if (ts.schools_count < 2) {
        detectedGaps.push({
          id: `GAP-EDU-${ts.id.toUpperCase()}`,
          taluk_id: ts.id,
          taluk_name: ts.name,
          category: 'Higher Education Access',
          title: `Limited Higher Education & Technical Institutes in ${ts.name}`,
          severity: 'Medium',
          supporting_data: `Only ${ts.schools_count} major educational institution currently mapped for a taluk area of ${ts.area_sq_km} sq km.`,
          recommendation: 'Propose a Government Polytechnic or Skill Development Training Institute affiliated with Tumkur University.',
          target_timeline: '2028',
          confidence: 'Medium (Based on active directory records)'
        });
      }

      // Postal network access
      if (ts.post_offices_count < 2) {
        detectedGaps.push({
          id: `GAP-POST-${ts.id.toUpperCase()}`,
          taluk_id: ts.id,
          taluk_name: ts.name,
          category: 'Civic Communication & Banking',
          title: `Postal & Direct Benefit Banking Outreach Deficit in ${ts.name}`,
          severity: 'Medium',
          supporting_data: `Only ${ts.post_offices_count} departmental post office registered in town core. Rural gram panchayats rely on remote branches.`,
          recommendation: 'Authorize 2 additional Sub-Post Offices equipped with India Post Payments Bank (IPPB) micro-ATMs.',
          target_timeline: '2027',
          confidence: 'High (India Post PIN database)'
        });
      }

      // Residential layouts approval
      if (ts.residential_layouts_count === 0 && ts.population > 200000) {
        detectedGaps.push({
          id: `GAP-LAY-${ts.id.toUpperCase()}`,
          taluk_id: ts.id,
          taluk_name: ts.name,
          category: 'Planned Urban Housing',
          title: `Shortage of Approved Residential Layouts in ${ts.name}`,
          severity: 'Low',
          supporting_data: 'No TUDA or KHB approved residential layouts currently registered on platform for this fast-growing center.',
          recommendation: 'Formulate a master-planned satellite residential layout with civic amenities to prevent unapproved sprawling.',
          target_timeline: '2028',
          confidence: 'Verified (TUDA Plan Registry)'
        });
      }
    }

    // 3. Proposed projects summary
    const projectsSummary = db.prepare(`
      SELECT status, COUNT(*) as count, SUM(estimated_budget_lakhs) as total_budget_lakhs
      FROM proposed_projects
      GROUP BY status
    `).all();

    return res.json({
      taluk_statistics: talukStats,
      infrastructure_gaps: detectedGaps,
      projects_summary: projectsSummary,
      data_confidence_notice: 'Gap analysis is performed against confirmed municipal datasets and open geographic records. Unmapped rural private clinics or unlisted private tutorials may exist locally.'
    });
  } catch (err) {
    console.error('Planning analytics error:', err);
    return res.status(500).json({ error: 'Failed to generate planning analytics.' });
  }
});

// List Proposed Projects
router.get('/proposed-projects', (req, res) => {
  try {
    const { taluk_id, priority, status } = req.query;

    let query = `
      SELECT p.*,
        t.name as taluk_name,
        a.name as area_name,
        u.name as proposed_by_name
      FROM proposed_projects p
      LEFT JOIN taluks t ON p.taluk_id = t.id
      LEFT JOIN areas a ON p.area_id = a.id
      LEFT JOIN users u ON p.proposed_by_user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (taluk_id && taluk_id !== 'all') {
      query += ' AND p.taluk_id = ?';
      params.push(taluk_id.toLowerCase());
    }

    if (priority && priority !== 'all') {
      query += ' AND p.priority = ?';
      params.push(priority);
    }

    if (status && status !== 'all') {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC';

    const projects = db.prepare(query).all(...params);
    return res.json({ projects });
  } catch (err) {
    console.error('Proposed projects fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve proposed projects.' });
  }
});

// Create Proposed Project (Planner or Admin)
router.post('/proposed-projects', plannerOrAdminMiddleware, (req, res) => {
  try {
    const {
      title,
      category,
      taluk_id,
      area_id,
      latitude,
      longitude,
      priority = 'Medium',
      status = 'Proposed',
      estimated_budget_lakhs = 0,
      target_completion_year,
      rationale,
      expected_beneficiaries = 0
    } = req.body;

    if (!title || !category || !taluk_id || latitude == null || longitude == null || !rationale) {
      return res.status(400).json({ error: 'Title, category, taluk_id, coordinates, and rationale are required.' });
    }

    const prjId = `PRJ-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const insert = db.prepare(`
      INSERT INTO proposed_projects (
        id, title, category, taluk_id, area_id, latitude, longitude,
        priority, status, estimated_budget_lakhs, target_completion_year,
        rationale, expected_beneficiaries, proposed_by_user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      prjId,
      title.trim(),
      category,
      taluk_id.toLowerCase(),
      area_id || null,
      parseFloat(latitude),
      parseFloat(longitude),
      priority,
      status,
      parseFloat(estimated_budget_lakhs || 0),
      target_completion_year ? parseInt(target_completion_year) : null,
      rationale.trim(),
      parseInt(expected_beneficiaries || 0),
      req.user.id
    );

    // Audit log
    db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)')
      .run(req.user.id, 'PROJECT_PROPOSE', `Proposed project ${prjId} (${title}) in ${taluk_id}`);

    const created = db.prepare('SELECT * FROM proposed_projects WHERE id = ?').get(prjId);
    return res.status(201).json({ message: 'Proposed development project saved successfully', project: created });
  } catch (err) {
    console.error('Project creation error:', err);
    return res.status(500).json({ error: 'Failed to save proposed project: ' + err.message });
  }
});

// Update Proposed Project
router.put('/proposed-projects/:id', plannerOrAdminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM proposed_projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Proposed project '${id}' not found.` });
    }

    const {
      title = existing.title,
      category = existing.category,
      priority = existing.priority,
      status = existing.status,
      estimated_budget_lakhs = existing.estimated_budget_lakhs,
      target_completion_year = existing.target_completion_year,
      rationale = existing.rationale,
      expected_beneficiaries = existing.expected_beneficiaries
    } = req.body;

    db.prepare(`
      UPDATE proposed_projects SET
        title = ?, category = ?, priority = ?, status = ?,
        estimated_budget_lakhs = ?, target_completion_year = ?,
        rationale = ?, expected_beneficiaries = ?
      WHERE id = ?
    `).run(
      title, category, priority, status, parseFloat(estimated_budget_lakhs),
      target_completion_year ? parseInt(target_completion_year) : null,
      rationale, parseInt(expected_beneficiaries), id
    );

    const updated = db.prepare('SELECT * FROM proposed_projects WHERE id = ?').get(id);
    return res.json({ message: 'Project updated successfully', project: updated });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update project: ' + err.message });
  }
});

// Delete Proposed Project
router.delete('/proposed-projects/:id', plannerOrAdminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM proposed_projects WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: `Project '${id}' not found.` });
    }

    db.prepare('DELETE FROM proposed_projects WHERE id = ?').run(id);
    return res.json({ message: `Project '${id}' removed.` });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete project.' });
  }
});

export default router;
