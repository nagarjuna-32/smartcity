import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Area, Facility, ProposedProject, InfrastructureGap } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  Compass,
  AlertTriangle,
  Lightbulb,
  Plus,
  Building2,
  MapPin,
  CheckCircle2,
  TrendingUp,
  X,
  AlertCircle,
  School,
  HeartPulse,
  ShoppingBasket,
  Pill,
  Home,
  Map
} from 'lucide-react';

export const PlanningPage: React.FC = () => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [areaStats, setAreaStats] = useState<any[]>([]);
  const [infrastructureGaps, setInfrastructureGaps] = useState<InfrastructureGap[]>([]);
  const [proposedProjects, setProposedProjects] = useState<ProposedProject[]>([]);
  const [selectedAreaId, setSelectedAreaId] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Modal to propose new capital development project
  const [modalOpen, setModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ProposedProject['category']>('Hospitals & Healthcare');
  const [formAreaId, setFormAreaId] = useState('');
  const [formLat, setFormLat] = useState<number>(13.3400);
  const [formLng, setFormLng] = useState<number>(77.1000);
  const [formBudget, setFormBudget] = useState<number>(150);
  const [formPriority, setFormPriority] = useState<ProposedProject['priority']>('High');
  const [formRationale, setFormRationale] = useState('');
  const [formBeneficiaries, setFormBeneficiaries] = useState<number>(12000);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPlanningData();
  }, [selectedAreaId]);

  const loadPlanningData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, projectsRes, areasRes, facilitiesRes] = await Promise.all([
        api.getPlanningAnalytics(selectedAreaId),
        api.getProposedProjects(selectedAreaId !== 'all' ? { area_id: selectedAreaId } : {}),
        api.getAreas(),
        api.getFacilities({ limit: 80 })
      ]);

      setAreaStats(analyticsRes.area_statistics);
      setInfrastructureGaps(analyticsRes.infrastructure_gaps);
      setProposedProjects(projectsRes.projects);
      setAreas(areasRes.areas);
      setFacilities(facilitiesRes.facilities);

      if (areasRes.areas.length > 0 && !formAreaId) {
        setFormAreaId(areasRes.areas[0].id);
        setFormLat(areasRes.areas[0].latitude);
        setFormLng(areasRes.areas[0].longitude);
      }
    } catch (err) {
      console.error('Failed to load planning data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAreaSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aId = e.target.value;
    setFormAreaId(aId);
    const selected = areas.find(a => a.id === aId);
    if (selected) {
      setFormLat(selected.latitude);
      setFormLng(selected.longitude);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formRationale.trim()) {
      alert('Please provide project title and justification rationale.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createProposedProject({
        title: formTitle.trim(),
        category: formCategory,
        area_id: formAreaId,
        latitude: formLat,
        longitude: formLng,
        priority: formPriority,
        estimated_budget_lakhs: formBudget,
        target_completion_year: 2027,
        rationale: formRationale.trim(),
        expected_beneficiaries: formBeneficiaries
      });

      setProposedProjects(prev => [res.project, ...prev]);
      setModalOpen(false);
      setFormTitle('');
      setFormRationale('');
      alert('Capital development project proposed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredGaps = infrastructureGaps.filter(g => {
    if (selectedSeverity !== 'all' && g.severity !== selectedSeverity) return false;
    if (selectedAreaId !== 'all' && g.area_id !== selectedAreaId) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-cyan text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>MUNICIPAL INFRASTRUCTURE & GAP DETECTION ENGINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Smart City Planning & Coverage Analysis
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Evaluate facility density per area, detect underserved neighborhoods, and propose future capital infrastructure.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-teal to-brand-cyan hover:opacity-95 text-white font-bold text-xs shadow-md shadow-brand-teal/25 flex items-center gap-2 self-start md:self-center transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Propose Capital Project</span>
        </button>
      </div>

      {/* Mandatory Urban Planning Notice (as required by Section 11 of Prompt) */}
      <div className="p-4 rounded-2xl bg-teal-950/60 border border-teal-500/30 text-teal-200 text-xs flex items-start gap-3 shadow-inner">
        <Compass className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div>
          <strong className="text-white block font-semibold mb-0.5">Automated Coverage Analysis Notice:</strong>
          Preliminary analysis based on available mapped data. This does not confirm the absence of facilities. Planners and municipal officers use this engine to direct field verifications and allocate infrastructure budgets.
        </div>
      </div>

      {/* Existing vs Proposed Infrastructure Map */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Map className="w-4 h-4 text-brand-cyan" />
            <span>Spatial Comparison: Existing Facilities vs Proposed Projects</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {proposedProjects.length} Proposed Projects Mapped
          </span>
        </div>

        <TumakuruMap
          facilities={facilities}
          areas={areas}
          proposedProjects={proposedProjects}
          height="450px"
        />
      </div>

      {/* Section 11: Infrastructure Coverage Table Across Tumkur City Areas */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-teal" />
              <span>Area-Wise Infrastructure Coverage Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Breakdown of essential facilities across all 15 preloaded localities in Tumkur city.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold">Filter Area:</span>
            <select
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-teal"
            >
              <option value="all">All 15 City Localities</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                <th className="py-3 px-3">Area / Locality</th>
                <th className="py-3 px-2 text-center text-blue-400">Schools</th>
                <th className="py-3 px-2 text-center text-red-400">Hospitals</th>
                <th className="py-3 px-2 text-center text-amber-400">Provisions</th>
                <th className="py-3 px-2 text-center text-emerald-400">Medicals</th>
                <th className="py-3 px-2 text-center text-orange-400">Post</th>
                <th className="py-3 px-2 text-center text-purple-400">Layouts</th>
                <th className="py-3 px-2 text-center text-teal-400">Sites</th>
                <th className="py-3 px-3 text-center text-brand-cyan">Total Mapped</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800 text-slate-200">
              {areaStats.map((a) => (
                <tr key={a.id} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-white">
                    <Link to={`/areas/${a.id}`} className="hover:text-brand-cyan">
                      {a.name}
                    </Link>
                  </td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-blue-300">{a.schools_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-red-300">{a.hospitals_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-amber-300">{a.provision_stores_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-emerald-300">{a.medical_stores_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-orange-300">{a.post_offices_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-purple-300">{a.layouts_count}</td>
                  <td className="py-3 px-2 text-center font-mono font-bold text-teal-300">{a.sites_count}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-teal/20 text-brand-cyan font-bold font-mono">
                      {a.total_facilities}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 11: Automated Infrastructure Gap Analysis */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>DEFICIT DETECTION ENGINE</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Identified Infrastructure Gaps in Tumkur City
            </h3>
            <p className="text-xs text-slate-400">
              Areas requiring public investment, healthcare outposts, or essential commercial retail setups.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-semibold">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
            >
              <option value="all">All Severities</option>
              <option value="High">High Severity</option>
              <option value="Medium">Medium Severity</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGaps.map((gap) => (
            <div
              key={gap.id}
              className="p-5 rounded-2xl bg-navy-800/60 border border-navy-700 hover:border-navy-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-extrabold text-brand-cyan">{gap.area_name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    gap.severity === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {gap.severity} Deficit
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5 leading-snug">{gap.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed mb-3">{gap.supporting_data}</p>
              </div>

              <div className="pt-3 border-t border-navy-700/60 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">RECOMMENDED SOLUTION</span>
                  <span className="text-xs font-bold text-brand-cyan">{gap.recommendation}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-navy-900 px-2 py-1 rounded-lg">
                  Target: {gap.target_timeline}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Propose Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 border border-navy-700 rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-cyan" />
                <span>Propose Capital Development Project</span>
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Yellapur Urban Health Dispensary & Diagnostic Lab"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
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
                    value={formAreaId}
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
                    value={formBudget}
                    onChange={(e) => setFormBudget(Number(e.target.value))}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
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
                    value={formBeneficiaries}
                    onChange={(e) => setFormBeneficiaries(Number(e.target.value))}
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
                  value={formRationale}
                  onChange={(e) => setFormRationale(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
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
