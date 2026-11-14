import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Taluk, ProposedProject, InfrastructureGap } from '../types';
import { TumakuruMap } from '../components/Map/TumakuruMap';
import {
  Compass,
  AlertTriangle,
  Lightbulb,
  Plus,
  Building2,
  MapPin,
  CheckCircle2,
  ShieldAlert,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  X,
  Loader2
} from 'lucide-react';

export const PlanningPage: React.FC = () => {
  const { user, isPlanner } = useAuth();
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [talukStats, setTalukStats] = useState<any[]>([]);
  const [gaps, setGaps] = useState<InfrastructureGap[]>([]);
  const [projects, setProjects] = useState<ProposedProject[]>([]);
  const [projectsSummary, setProjectsSummary] = useState<any[]>([]);
  const [selectedTalukId, setSelectedTalukId] = useState('all');
  const [loading, setLoading] = useState(true);

  // New Project Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'Healthcare' | 'Education' | 'Roads & Infrastructure' | 'Residential Layout' | 'Public Service' | 'Water & Greenery'>('Healthcare');
  const [formTalukId, setFormTalukId] = useState('tumakuru');
  const [formLat, setFormLat] = useState('13.3400');
  const [formLng, setFormLng] = useState('77.1000');
  const [formPriority, setFormPriority] = useState<'High' | 'Medium' | 'Low'>('High');
  const [formBudget, setFormBudget] = useState('1500');
  const [formYear, setFormYear] = useState('2028');
  const [formRationale, setFormRationale] = useState('');
  const [formBeneficiaries, setFormBeneficiaries] = useState('50000');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [talukRes, analyticsRes, prjRes] = await Promise.all([
          api.getTaluks(),
          api.getPlanningAnalytics(selectedTalukId !== 'all' ? selectedTalukId : undefined),
          api.getProposedProjects(selectedTalukId !== 'all' ? { taluk_id: selectedTalukId } : undefined)
        ]);

        setTaluks(talukRes.taluks);
        setTalukStats(analyticsRes.taluk_statistics);
        setGaps(analyticsRes.infrastructure_gaps);
        setProjectsSummary(analyticsRes.projects_summary);
        setProjects(prjRes.projects);
      } catch (err) {
        console.error('Planning data load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedTalukId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalLoading(true);

    try {
      const res = await api.createProposedProject({
        title: formTitle,
        category: formCategory,
        taluk_id: formTalukId,
        latitude: parseFloat(formLat),
        longitude: parseFloat(formLng),
        priority: formPriority,
        status: 'Proposed',
        estimated_budget_lakhs: parseFloat(formBudget),
        target_completion_year: parseInt(formYear),
        rationale: formRationale,
        expected_beneficiaries: parseInt(formBeneficiaries)
      });

      setProjects(prev => [res.project, ...prev]);
      setShowModal(false);
      setFormTitle('');
      setFormRationale('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to submit proposal.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* 1. Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-brand-teal text-xs font-bold uppercase tracking-wider mb-2">
            <Compass className="w-3.5 h-3.5" />
            Strategic Spatial Planning Engine
          </div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">
            SMART CITY PLANNING & INFRASTRUCTURE GAPS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Data-driven spatial coverage analysis, missing facility detection, and municipal capital project proposals.
          </p>
        </div>

        {isPlanner && (
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-3 rounded-xl bg-brand-teal hover:bg-teal-600 text-white font-bold text-xs shadow-lg flex items-center gap-2 shrink-0 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Propose Development Project</span>
          </button>
        )}
      </div>

      {/* 2. Taluk Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span className="font-bold text-slate-900">Jurisdiction Filter:</span>
          <select
            value={selectedTalukId}
            onChange={e => setSelectedTalukId(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 focus:outline-none"
          >
            <option value="all">All 10 Taluks (District-wide)</option>
            {taluks.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>Identified Gaps: <strong className="text-red-600">{gaps.length}</strong></span>
          <span>•</span>
          <span>Proposed Projects: <strong className="text-brand-teal">{projects.length}</strong></span>
        </div>
      </div>

      {/* 3. Infrastructure Gap Analysis Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Automated Infrastructure Gap Analysis</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluated strictly against recorded municipal assets and population density benchmarks
            </p>
          </div>
        </div>

        {gaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {gaps.map(gap => (
              <div
                key={gap.id}
                className={`p-6 rounded-3xl bg-white border shadow-sm flex flex-col justify-between ${
                  gap.severity === 'High' ? 'border-red-200 border-l-4 border-l-red-500' : 'border-amber-200 border-l-4 border-l-amber-500'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded">
                      {gap.taluk_name}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      gap.severity === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {gap.severity} Priority
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1.5 leading-snug">
                    {gap.title}
                  </h4>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 mb-3 space-y-1">
                    <p><strong>Supporting Data:</strong> {gap.supporting_data}</p>
                    <p className="text-[11px] text-slate-400">Confidence: {gap.confidence}</p>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    💡 <strong>Proposed Smart Solution:</strong> {gap.recommendation}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Target: {gap.target_timeline}</span>
                  {isPlanner && (
                    <button
                      onClick={() => {
                        setFormTitle(gap.recommendation);
                        setFormTalukId(gap.taluk_id);
                        setFormPriority(gap.severity);
                        setFormRationale(gap.supporting_data);
                        setShowModal(true);
                      }}
                      className="text-brand-teal hover:underline font-bold"
                    >
                      Draft Project Proposal →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 text-slate-500 text-xs">
            🎉 No acute infrastructure gaps detected for this specific filter based on current registered data.
          </div>
        )}
      </section>

      {/* 4. Facility Coverage & Taluk Benchmark Table */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm overflow-hidden">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          Taluk-wise Facility Distribution & Density Comparisons
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Comparative coverage of public facilities across all 10 administrative taluks
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Taluk</th>
                <th className="py-3 px-3">Population</th>
                <th className="py-3 px-3">Area (km²)</th>
                <th className="py-3 px-3">Schools & Colleges</th>
                <th className="py-3 px-3">Hospitals (Active)</th>
                <th className="py-3 px-3">Post Offices</th>
                <th className="py-3 px-3">Approved Layouts</th>
                <th className="py-3 px-3">Sites / Parks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {talukStats.map(ts => (
                <tr key={ts.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900">{ts.name}</td>
                  <td className="py-3 px-3">{ts.population.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono">{ts.area_sq_km}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${ts.schools_count > 0 ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}>
                      {ts.schools_count}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded font-bold ${ts.operational_hospitals > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {ts.operational_hospitals} / {ts.total_hospitals}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold">{ts.post_offices_count}</td>
                  <td className="py-3 px-3">{ts.residential_layouts_count}</td>
                  <td className="py-3 px-3">{ts.land_sites_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Proposed Development Projects Board */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-brand-teal" />
              <span>Approved & Proposed Capital Projects</span>
            </h3>
            <p className="text-xs text-slate-500">
              Future development proposals addressing infrastructure gaps across Tumakuru
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-teal bg-teal-50 px-2.5 py-0.5 rounded">
                    {p.category}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      p.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.priority} Priority
                    </span>
                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {p.status}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-base mb-1">{p.title}</h4>
                <p className="text-xs text-slate-500 mb-2">Location: {p.area_name || p.taluk_name || 'Tumakuru'}</p>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.rationale}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Estimated Budget</span>
                  <span className="text-base font-black text-brand-teal">
                    ₹{p.estimated_budget_lakhs?.toLocaleString()} Lakhs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Target Completion</span>
                  <span className="font-bold text-slate-800">{p.target_completion_year || 'Under Study'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Propose New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-lg font-bold text-navy-900">Propose Municipal Development Project</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. 50-Bed Community Health Center in Sira Gate"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
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
                  <label className="block font-bold text-slate-700 uppercase mb-1">Taluk *</label>
                  <select
                    value={formTalukId}
                    onChange={e => setFormTalukId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    {taluks.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLat}
                    onChange={e => setFormLat(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formLng}
                    onChange={e => setFormLng(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Priority</label>
                  <select
                    value={formPriority}
                    onChange={e => setFormPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Budget (₹ Lakhs)</label>
                  <input
                    type="number"
                    value={formBudget}
                    onChange={e => setFormBudget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Year</label>
                  <input
                    type="number"
                    value={formYear}
                    onChange={e => setFormYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Urban Planning Rationale *</label>
                <textarea
                  required
                  rows={3}
                  value={formRationale}
                  onChange={e => setFormRationale(e.target.value)}
                  placeholder="Explain why this infrastructure is needed and how it addresses local coverage deficit..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-teal/40"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2.5 bg-brand-teal hover:bg-teal-600 text-white font-bold rounded-xl flex items-center gap-2"
                >
                  {modalLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Project Proposal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
