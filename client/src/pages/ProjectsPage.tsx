import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProposedProject, Area } from '../types';
import {
  Lightbulb,
  Plus,
  Filter,
  CheckCircle2,
  Coins,
  Users,
  MapPin,
  ExternalLink,
  Trash2,
  X,
  AlertCircle,
  Building2,
  ChevronRight
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user, isPlanner, isAdmin } = useAuth();
  const [projects, setProjects] = useState<ProposedProject[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [areaFilter, setAreaFilter] = useState<string>('All');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // New Project Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Hospitals & Healthcare' as ProposedProject['category'],
    area_id: '',
    latitude: 13.3400,
    longitude: 77.1000,
    priority: 'High' as ProposedProject['priority'],
    estimated_budget_lakhs: 75,
    target_completion_year: 2027,
    expected_beneficiaries: 18000,
    rationale: ''
  });

  useEffect(() => {
    loadProjectsAndMeta();
  }, []);

  const loadProjectsAndMeta = async () => {
    try {
      setLoading(true);
      const [projRes, areasRes] = await Promise.all([
        api.getProposedProjects(),
        api.getAreas()
      ]);
      setProjects(projRes.projects);
      setAreas(areasRes.areas);
      if (areasRes.areas.length > 0 && !formData.area_id) {
        setFormData(prev => ({
          ...prev,
          area_id: areasRes.areas[0].id,
          latitude: areasRes.areas[0].latitude,
          longitude: areasRes.areas[0].longitude
        }));
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
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

  const handleAreaSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aId = e.target.value;
    const selectedArea = areas.find(a => a.id === aId);
    setFormData(prev => ({
      ...prev,
      area_id: aId,
      latitude: selectedArea ? selectedArea.latitude : prev.latitude,
      longitude: selectedArea ? selectedArea.longitude : prev.longitude
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
      setFormData(prev => ({
        ...prev,
        title: '',
        rationale: '',
        estimated_budget_lakhs: 75,
        expected_beneficiaries: 18000
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
    if (areaFilter !== 'All' && p.area_id !== areaFilter) return false;
    return true;
  });

  const totalBudgetLakhs = projects.reduce((sum, p) => sum + (p.estimated_budget_lakhs || 0), 0);
  const totalBeneficiaries = projects.reduce((sum, p) => sum + (p.expected_beneficiaries || 0), 0);
  const approvedCount = projects.filter(p => p.status === 'Approved' || p.status === 'Funded').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <Lightbulb className="w-4 h-4" />
            <span>MUNICIPAL INFRASTRUCTURE PIPELINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Proposed Development Projects
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Track planned civic works, hospital upgrades, school expansions, and public utility investments across Tumkur City.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white text-xs font-bold shadow-md shadow-brand-teal/25 flex items-center gap-2 self-start md:self-center hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Capital Project</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">PROPOSED INITIATIVES</span>
          <div className="text-2xl font-black text-white">{projects.length}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across Tumkur city areas</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">ESTIMATED OUTLAY</span>
          <div className="text-2xl font-black text-amber-400">
            ₹{(totalBudgetLakhs / 100).toFixed(2)} Cr
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{totalBudgetLakhs.toLocaleString()} Lakhs proposed</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">PROJECTED BENEFICIARIES</span>
          <div className="text-2xl font-black text-emerald-400">
            {(totalBeneficiaries / 1000).toFixed(1)}k
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Tumkur citizens impacted</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">APPROVED / FUNDED</span>
          <div className="text-2xl font-black text-brand-cyan">{approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            {projects.length > 0 ? Math.round((approvedCount / projects.length) * 100) : 0}% pipeline progress
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-bold">
          <Filter className="w-4 h-4 text-brand-cyan" />
          <span>Filter:</span>
        </div>

        {/* Area */}
        <select
          value={areaFilter}
          onChange={(e) => setAreaFilter(e.target.value)}
          className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
        >
          <option value="All">All Tumkur Areas</option>
          {areas.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((p) => (
          <div
            key={p.id}
            className="bg-navy-900 border border-navy-800 hover:border-brand-teal rounded-3xl p-5 shadow-sm transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-navy-800 text-brand-cyan">
                  {p.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.priority === 'High' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {p.priority}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.status === 'Funded'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : p.status === 'Approved'
                      ? 'bg-teal-500/20 text-brand-cyan'
                      : 'bg-navy-800 text-slate-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>

              <h3 className="text-base font-extrabold text-white leading-snug mb-1.5">{p.title}</h3>

              <div className="flex items-center gap-1.5 text-xs text-brand-cyan mb-3">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{p.area_name ? `${p.area_name}, Tumkur` : 'Tumkur City'}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 mb-4">
                {p.rationale}
              </p>

              <div className="grid grid-cols-2 gap-2 bg-navy-800/60 rounded-2xl p-3 text-xs mb-3">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">BUDGET ESTIMATE</span>
                  <span className="font-bold text-amber-300 font-mono">
                    ₹{p.estimated_budget_lakhs ? `${p.estimated_budget_lakhs} Lakhs` : 'TBD'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">BENEFICIARIES</span>
                  <span className="font-bold text-emerald-300 font-mono">
                    {p.expected_beneficiaries ? `${p.expected_beneficiaries.toLocaleString()}` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">TARGET YEAR</span>
                  <span className="font-semibold text-slate-200 font-mono">{p.target_completion_year || 'Ongoing'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">PROPOSED BY</span>
                  <span className="font-semibold text-slate-300 truncate block">{p.proposed_by_name || 'Planning Cell'}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-navy-800 flex items-center justify-between text-xs">
              <a
                href={`https://www.openstreetmap.org/directions?to=${p.latitude},${p.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
              >
                <span>View Map</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {(isPlanner || isAdmin) && (
                <div className="flex items-center gap-2">
                  <select
                    value={p.status}
                    onChange={(e) => handleStatusChange(p.id, e.target.value as ProposedProject['status'])}
                    className="bg-navy-800 border border-navy-700 text-slate-200 text-[11px] rounded-lg px-2 py-1 focus:outline-none"
                  >
                    <option value="Proposed">Proposed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Approved">Approved</option>
                    <option value="Funded">Funded</option>
                  </select>

                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete proposal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Propose Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 border border-navy-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-cyan" />
                <span>Submit Infrastructure Project Proposal</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mandipet Modern Multi-Level Vegetable Market & Cold Storage"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    <option value="Hospitals & Healthcare">Hospitals & Healthcare</option>
                    <option value="Schools & Education">Schools & Education</option>
                    <option value="Parks & Greenery">Parks & Greenery</option>
                    <option value="Roads & Infrastructure">Roads & Infrastructure</option>
                    <option value="Essential Markets & Stores">Essential Markets & Stores</option>
                    <option value="Public Service">Public Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Area *</label>
                  <select
                    value={formData.area_id}
                    onChange={handleAreaSelectChange}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                  >
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Budget (₹ Lakhs)</label>
                  <input
                    type="number"
                    value={formData.estimated_budget_lakhs}
                    onChange={(e) => setFormData({ ...formData, estimated_budget_lakhs: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Beneficiaries</label>
                  <input
                    type="number"
                    value={formData.expected_beneficiaries}
                    onChange={(e) => setFormData({ ...formData, expected_beneficiaries: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Rationale & Urban Justification *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the neighborhood service gap addressed by this proposed infrastructure..."
                  value={formData.rationale}
                  onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-bold shadow hover:opacity-95 disabled:opacity-50"
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
