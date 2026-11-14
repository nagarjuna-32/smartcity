import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProposedProject, Taluk, Area } from '../types';
import {
  Lightbulb,
  Plus,
  Filter,
  CheckCircle2,
  Clock,
  Coins,
  Users,
  MapPin,
  ExternalLink,
  Trash2,
  X,
  AlertCircle,
  Building2,
  Layers,
  ChevronRight
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user, isPlanner, isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProposedProject[]>([]);
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [talukFilter, setTalukFilter] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New Project Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Healthcare' as ProposedProject['category'],
    taluk_id: '',
    area_id: '',
    latitude: 13.3379,
    longitude: 77.1010,
    priority: 'High' as ProposedProject['priority'],
    estimated_budget_lakhs: 50,
    target_completion_year: 2027,
    expected_beneficiaries: 15000,
    rationale: ''
  });

  useEffect(() => {
    loadProjectsAndMeta();
  }, []);

  const loadProjectsAndMeta = async () => {
    try {
      setLoading(true);
      const [projRes, taluksRes, areasRes] = await Promise.all([
        api.getProposedProjects(),
        api.getTaluks(),
        api.getAreas()
      ]);
      setProjects(projRes.projects);
      setTaluks(taluksRes.taluks);
      setAreas(areasRes.areas);
      if (taluksRes.taluks.length > 0 && !formData.taluk_id) {
        setFormData(prev => ({
          ...prev,
          taluk_id: taluksRes.taluks[0].id,
          latitude: taluksRes.taluks[0].latitude,
          longitude: taluksRes.taluks[0].longitude
        }));
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProposedProject['status']) => {
    try {
      await api.updateProposedProject(projectId, { status: newStatus });
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      alert(err.message || 'Failed to update project status');
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this proposed project?')) return;
    try {
      await api.deleteProposedProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const handleTalukSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tId = e.target.value;
    const selectedTaluk = taluks.find(t => t.id === tId);
    setFormData(prev => ({
      ...prev,
      taluk_id: tId,
      area_id: '',
      latitude: selectedTaluk ? selectedTaluk.latitude : prev.latitude,
      longitude: selectedTaluk ? selectedTaluk.longitude : prev.longitude
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!formData.title.trim() || !formData.rationale.trim()) {
      setModalError('Title and rationale are required');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createProposedProject(formData);
      setProjects(prev => [res.project, ...prev]);
      setIsModalOpen(false);
      // Reset form
      setFormData(prev => ({
        ...prev,
        title: '',
        rationale: '',
        estimated_budget_lakhs: 50,
        expected_beneficiaries: 15000
      }));
    } catch (err: any) {
      setModalError(err.message || 'Failed to create proposed project');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && p.priority !== priorityFilter) return false;
    if (talukFilter !== 'All' && p.taluk_id !== talukFilter) return false;
    return true;
  });

  // Aggregations
  const totalBudgetLakhs = projects.reduce((sum, p) => sum + (p.estimated_budget_lakhs || 0), 0);
  const totalBeneficiaries = projects.reduce((sum, p) => sum + (p.expected_beneficiaries || 0), 0);
  const approvedCount = projects.filter(p => p.status === 'Approved' || p.status === 'Funded').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-sm font-semibold mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>CAPITAL WORKS & URBAN DEVELOPMENT PIPELINE</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            Proposed Development Projects
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track planned civic initiatives, hospital upgrades, school expansions, and industrial corridors.
          </p>
        </div>

        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white text-sm font-semibold shadow hover:opacity-95 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Propose Capital Project</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>TOTAL PROPOSALS</span>
            <Lightbulb className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-2xl font-black text-white">{projects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 10 taluks</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>ESTIMATED OUTLAY</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            ₹{(totalBudgetLakhs / 100).toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {totalBudgetLakhs.toLocaleString()} Lakhs proposed
          </p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>PROJECTED BENEFICIARIES</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {(totalBeneficiaries / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Direct citizen impact</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>APPROVED / FUNDED</span>
            <CheckCircle2 className="w-4 h-4 text-brand-teal" />
          </div>
          <div className="text-2xl font-black text-white">{approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {projects.length > 0 ? Math.round((approvedCount / projects.length) * 100) : 0}% pipeline conversion
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <Filter className="w-4 h-4 text-brand-cyan" />
          <span>Filter By:</span>
        </div>

        {/* Taluk */}
        <select
          value={talukFilter}
          onChange={(e) => setTalukFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          <option value="All">All Taluks</option>
          {taluks.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          <option value="All">All Priorities</option>
          <option value="High">High Priority</option>
          <option value="Medium">Medium Priority</option>
          <option value="Low">Low Priority</option>
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          <option value="All">All Statuses</option>
          <option value="Proposed">Proposed</option>
          <option value="Under Review">Under Review</option>
          <option value="Approved">Approved</option>
          <option value="Funded">Funded</option>
        </select>

        <span className="text-slate-500 ml-auto font-mono">
          Showing {filteredProjects.length} of {projects.length} proposals
        </span>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-navy-900 border border-navy-800 hover:border-navy-700 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              {/* Category, Priority & Status badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-navy-800 border border-navy-700 text-slate-300">
                  {project.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.priority === 'High'
                        ? 'bg-rose-500/20 text-rose-400'
                        : project.priority === 'Medium'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {project.priority}
                  </span>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      project.status === 'Funded'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : project.status === 'Approved'
                        ? 'bg-teal-500/20 text-brand-cyan'
                        : project.status === 'Under Review'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>

              {/* Title & Location */}
              <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                {project.title}
              </h3>

              <div className="flex items-center gap-1.5 text-xs text-brand-cyan mb-3">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {project.taluk_name ? `${project.taluk_name} Taluk` : 'Tumakuru'}
                  {project.area_name ? ` • ${project.area_name}` : ''}
                </span>
              </div>

              {/* Rationale */}
              <p className="text-xs text-slate-300 leading-relaxed mb-4 line-clamp-3">
                {project.rationale}
              </p>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 bg-navy-800/60 rounded-xl p-3 mb-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">BUDGET ESTIMATE</span>
                  <span className="font-bold text-amber-300 font-mono">
                    ₹{project.estimated_budget_lakhs?.toLocaleString() || 'N/A'} Lakhs
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">BENEFICIARIES</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {project.expected_beneficiaries?.toLocaleString() || 'N/A'} Citizens
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">TARGET YEAR</span>
                  <span className="font-semibold text-slate-200 font-mono">
                    {project.target_completion_year || 'Ongoing'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">PROPOSED BY</span>
                  <span className="font-semibold text-slate-300 truncate block">
                    {project.proposed_by_name || 'Urban Planning Dept'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-navy-800 flex items-center justify-between text-xs">
              <a
                href={`https://www.openstreetmap.org/directions?to=${project.latitude},${project.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <span>View on Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {(isPlanner || isAdmin) ? (
                <div className="flex items-center gap-2">
                  <select
                    value={project.status}
                    onChange={(e) => handleStatusChange(project.id, e.target.value as ProposedProject['status'])}
                    className="bg-navy-800 border border-navy-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Funded">Funded</option>
                  </select>

                  <button
                    onClick={() => handleDelete(project.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete proposal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">
                  Lat: {project.latitude.toFixed(3)}, Lng: {project.longitude.toFixed(3)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-12 text-center text-slate-400">
          <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No Projects Found</h3>
          <p className="text-sm">Try relaxing your filter criteria or submit a new capital project proposal.</p>
        </div>
      )}

      {/* Propose Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 border border-navy-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-teal/20 text-brand-cyan flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Propose Capital Development Project</h3>
                  <p className="text-xs text-slate-400">Submit a new municipal infrastructure project for planning review</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pavagada Solar Grid Expansion & Drinking Water Pipeline"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  >
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Residential Layout">Residential Layout</option>
                    <option value="Public Service">Public Service</option>
                    <option value="Water & Greenery">Water & Greenery</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Taluk *
                  </label>
                  <select
                    value={formData.taluk_id}
                    onChange={handleTalukSelectChange}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  >
                    {taluks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} Taluk
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Area / Locality (Optional)
                  </label>
                  <select
                    value={formData.area_id}
                    onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                  >
                    <option value="">-- General Taluk Wide --</option>
                    {areas
                      .filter(a => !formData.taluk_id || a.taluk_id === formData.taluk_id)
                      .map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.category})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Estimated Budget (₹ Lakhs)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.estimated_budget_lakhs}
                    onChange={(e) => setFormData({ ...formData, estimated_budget_lakhs: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Target Year
                  </label>
                  <input
                    type="number"
                    min="2026"
                    max="2035"
                    value={formData.target_completion_year}
                    onChange={(e) => setFormData({ ...formData, target_completion_year: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Beneficiaries (Citizens)
                  </label>
                  <input
                    type="number"
                    min="100"
                    value={formData.expected_beneficiaries}
                    onChange={(e) => setFormData({ ...formData, expected_beneficiaries: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rationale & Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the community need, deficit addressed, and expected socio-economic returns..."
                  value={formData.rationale}
                  onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-semibold shadow hover:opacity-95 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Proposal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
