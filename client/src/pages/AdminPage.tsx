import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Facility, Area, FacilityCategory } from '../types';
import {
  ShieldAlert,
  Users,
  Layers,
  CheckCircle,
  AlertCircle,
  DownloadCloud,
  RefreshCw,
  Trash2,
  Check,
  Building2,
  Plus,
  MapPin,
  History,
  Activity,
  Edit2,
  Copy
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'areas' | 'verification' | 'osm' | 'duplicates' | 'users' | 'logs'>('areas');

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Areas Management
  const [areas, setAreas] = useState<Area[]>([]);
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [areaFormData, setAreaFormData] = useState({
    name: '',
    description: '',
    latitude: 13.3400,
    longitude: 77.1000,
    population: 18000,
    pin_code: '572101',
    infrastructure_summary: ''
  });

  // Verification Queue
  const [unverifiedFacilities, setUnverifiedFacilities] = useState<Facility[]>([]);
  const [verificationFilter, setVerificationFilter] = useState<string>('Unverified');

  // OSM Overpass Ingestion
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [selectedAreaForImport, setSelectedAreaForImport] = useState<string>('all');
  const [selectedCatForImport, setSelectedCatForImport] = useState<string>('hospitals');
  const [importLimit, setImportLimit] = useState<number>(15);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ message: string; success: boolean } | null>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  // Duplicates Engine
  const [duplicates, setDuplicates] = useState<any[]>([]);

  // Users
  const [usersList, setUsersList] = useState<any[]>([]);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadOverviewStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'areas') {
      loadAreas();
    } else if (activeTab === 'verification') {
      loadFacilitiesForVerification();
    } else if (activeTab === 'osm') {
      loadOsmTabData();
    } else if (activeTab === 'duplicates') {
      loadDuplicates();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'logs') {
      loadAuditLogs();
    }
  }, [activeTab, verificationFilter]);

  const loadOverviewStats = async () => {
    try {
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    }
  };

  const loadAreas = async () => {
    try {
      const res = await api.getAreas();
      setAreas(res.areas);
    } catch (err) {
      console.error('Failed to load areas', err);
    }
  };

  const loadFacilitiesForVerification = async () => {
    try {
      const params: Record<string, string> = verificationFilter !== 'All' ? { verification_status: verificationFilter } : {};
      const res = await api.getFacilities(params);
      setUnverifiedFacilities(res.facilities);
    } catch (err) {
      console.error('Failed to load facilities for verification', err);
    }
  };

  const loadOsmTabData = async () => {
    try {
      const [aRes, cRes, hRes] = await Promise.all([
        api.getAreas(),
        api.getCategories(),
        api.getImportHistory()
      ]);
      setAreas(aRes.areas);
      setCategories(cRes.categories);
      setImportHistory(hRes.imports);
    } catch (err) {
      console.error('Failed to load OSM tab data', err);
    }
  };

  const loadDuplicates = async () => {
    try {
      const res = await api.getDuplicates();
      setDuplicates(res.duplicates || []);
    } catch (err) {
      console.error('Failed to load duplicates', err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsersList(res.users);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const res = await api.getAuditLogs();
      setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    }
  };

  // Area Actions
  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createArea(areaFormData);
      setIsAreaModalOpen(false);
      loadAreas();
      loadOverviewStats();
      alert(`Area '${areaFormData.name}' added to Tumkur City!`);
      setAreaFormData({
        name: '',
        description: '',
        latitude: 13.3400,
        longitude: 77.1000,
        population: 18000,
        pin_code: '572101',
        infrastructure_summary: ''
      });
    } catch (err: any) {
      alert(err.message || 'Failed to create area');
    }
  };

  const handleDeleteArea = async (areaId: string, areaName: string) => {
    if (!window.confirm(`Are you sure you want to delete '${areaName}' from Tumkur City?`)) return;
    try {
      await api.deleteArea(areaId);
      loadAreas();
      loadOverviewStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete area');
    }
  };

  // Facility Verification Actions
  const handleVerify = async (facilityId: string, status: 'Officially Verified' | 'Admin Verified') => {
    try {
      await api.verifyFacility(facilityId, {
        verification_status: status,
        operational_status: 'Operational',
        notes: `Verified by Administrator ${user?.name} on ${new Date().toLocaleDateString()}`
      });
      setUnverifiedFacilities(prev => prev.filter(f => f.id !== facilityId));
      loadOverviewStats();
    } catch (err: any) {
      alert(err.message || 'Failed to verify facility');
    }
  };

  const handleDeleteFacility = async (facilityId: string) => {
    if (!window.confirm('Are you sure you want to delete this facility record?')) return;
    try {
      await api.deleteFacility(facilityId);
      setUnverifiedFacilities(prev => prev.filter(f => f.id !== facilityId));
      loadOverviewStats();
    } catch (err: any) {
      alert(err.message || 'Failed to delete facility');
    }
  };

  // OSM Overpass Action
  const handleRunOsmImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      setImportResult(null);
      const res = await api.importOsmData({
        area_id: selectedAreaForImport !== 'all' ? selectedAreaForImport : undefined,
        category: selectedCatForImport,
        limit: importLimit
      });
      setImportResult({
        message: res.message || `Successfully ingested ${res.records_imported} facilities from OpenStreetMap`,
        success: true
      });
      loadOverviewStats();
      const hRes = await api.getImportHistory();
      setImportHistory(hRes.imports);
    } catch (err: any) {
      setImportResult({
        message: err.message || 'Failed to complete OSM ingestion. Please verify network connectivity.',
        success: false
      });
    } finally {
      setImporting(false);
    }
  };

  // User Role Action
  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-12 text-center text-slate-300">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Restricted Administrator Area</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          You do not have administrative privileges. Please log in with an administrator account (<code>admin@tumkur.gov.in</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>MUNICIPAL ADMINISTRATION & GOVERNANCE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Admin Panel
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Manage Tumkur City localities, verify community & OSM facilities, ingest live Overpass geospatial nodes, and review audit logs.
          </p>
        </div>

        <button
          onClick={() => {
            loadOverviewStats();
            if (activeTab === 'areas') loadAreas();
            if (activeTab === 'verification') loadFacilitiesForVerification();
            if (activeTab === 'osm') loadOsmTabData();
            if (activeTab === 'duplicates') loadDuplicates();
            if (activeTab === 'users') loadUsers();
            if (activeTab === 'logs') loadAuditLogs();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800 border border-navy-700 text-slate-300 hover:text-white text-xs font-bold transition-colors self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">CITY AREAS / LOCALITIES</span>
          <div className="text-2xl font-black text-white">{stats?.areas_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Preloaded Tumkur neighborhoods</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">PENDING VERIFICATION</span>
          <div className="text-2xl font-black text-amber-400">
            {stats?.unverified_facilities_count ?? '...'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">OSM & Community POIs</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">TOTAL MAPPED FACILITIES</span>
          <div className="text-2xl font-black text-brand-cyan">{stats?.facilities_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 8 categories</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <span className="text-slate-400 text-xs font-semibold block mb-1">AUDIT STREAM RECORDS</span>
          <div className="text-2xl font-black text-emerald-400">{stats?.logs_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Immutable security ledger</p>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-800 pb-3 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'areas'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Areas ({areas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'verification'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Verification Queue</span>
          {stats?.unverified_facilities_count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {stats.unverified_facilities_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('osm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'osm'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>OSM Overpass Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('duplicates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'duplicates'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Copy className="w-4 h-4" />
          <span>Duplicate Detector</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'users'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Role Access</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all shrink-0 ${
            activeTab === 'logs'
              ? 'bg-brand-teal text-white shadow-md'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Stream</span>
        </button>
      </div>

      {/* TAB 1: MANAGE AREAS (Section 5 & 13 of Prompt) */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm text-xs">
            <span className="text-slate-300 font-bold">Tumkur City Localities Database</span>
            <button
              onClick={() => setIsAreaModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-bold flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Add New City Area</span>
            </button>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                    <th className="py-3 px-4">Area Name</th>
                    <th className="py-3 px-3">PIN Code</th>
                    <th className="py-3 px-3">Coordinates (Lat, Lng)</th>
                    <th className="py-3 px-3 text-right">Population</th>
                    <th className="py-3 px-3 text-center">Facilities</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {areas.map(a => (
                    <tr key={a.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white text-sm">
                        {a.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{a.pin_code || '572101'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {a.latitude.toFixed(4)}, {a.longitude.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {(a.population || 18000).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-navy-800 text-brand-cyan font-bold font-mono">
                          {a.facilities_count ?? 0}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteArea(a.id, a.name)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete Area"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-semibold">Filter:</span>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-1.5 focus:outline-none"
              >
                <option value="Unverified">Unverified Only</option>
                <option value="OpenStreetMap Listed">OpenStreetMap Listed</option>
                <option value="Community Reported">Community Reported</option>
                <option value="Officially Verified">Officially Verified</option>
                <option value="All">All Verification Statuses</option>
              </select>
            </div>
            <span className="text-slate-400 font-mono">
              {unverifiedFacilities.length} facilities in queue
            </span>
          </div>

          <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                    <th className="py-3 px-4">Facility Name & Sub-Type</th>
                    <th className="py-3 px-3">Area / Locality</th>
                    <th className="py-3 px-3">Source & Coordinates</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Verification</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {unverifiedFacilities.map((f) => (
                    <tr key={f.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{f.name}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{f.sub_type} • {f.category_name}</div>
                        <div className="text-slate-500 text-[10px] truncate max-w-xs">{f.address}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-brand-cyan">{f.area_name || 'Tumkur City'}</td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-300 block">{f.source_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{f.latitude.toFixed(4)}, {f.longitude.toFixed(4)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy-800 text-slate-300">
                          {f.operational_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          {f.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerify(f.id, 'Officially Verified')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFacility(f.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {unverifiedFacilities.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">Verification Queue Clean!</h4>
                <p className="text-xs text-slate-400 mt-1">No facilities pending administrative moderation.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: OSM OVERPASS INGESTION */}
      {activeTab === 'osm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-brand-cyan" />
              <span>Query Overpass API</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Query real OpenStreetMap nodes within the Tumkur City Bounding Box: <code>[13.28, 77.06, 13.38, 77.16]</code>.
            </p>

            {importResult && (
              <div className={`p-3 rounded-2xl mb-4 text-xs flex items-center gap-2 ${
                importResult.success ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
                {importResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{importResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRunOsmImport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Locality</label>
                <select
                  value={selectedAreaForImport}
                  onChange={(e) => setSelectedAreaForImport(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  <option value="all">Entire Tumkur City</option>
                  {areas.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility Category</label>
                <select
                  value={selectedCatForImport}
                  onChange={(e) => setSelectedCatForImport(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Max POIs to Fetch</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={importLimit}
                  onChange={(e) => setImportLimit(Number(e.target.value))}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={importing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-bold text-sm shadow hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Querying OSM Overpass...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Run Overpass Ingestion</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-white mb-4">Ingestion History Log</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2 px-3">Timestamp</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Query</th>
                    <th className="py-2 px-3 text-center">Imported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {importHistory.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-navy-800/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400">{new Date(h.imported_at).toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-bold text-white">{h.source_name}</td>
                      <td className="py-2.5 px-3 text-brand-cyan">{h.query_type}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-400 font-mono">+{h.records_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {importHistory.length === 0 && (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No ingestions recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DUPLICATE DETECTOR */}
      {activeTab === 'duplicates' && (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
            <Copy className="w-5 h-5 text-brand-cyan" />
            <span>Spatial & Name Duplicate Detector</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Identifies facilities sharing similar names or situated within 50 meters of each other.
          </p>

          {duplicates.length > 0 ? (
            <div className="space-y-3">
              {duplicates.map((pair, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-navy-800/60 border border-navy-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase">{pair.reason} ({pair.distance_meters}m)</span>
                    <div className="font-bold text-white mt-0.5">1. {pair.facility_1.name}</div>
                    <div className="font-bold text-slate-300">2. {pair.facility_2.name}</div>
                    <span className="text-[10px] text-slate-400">Area: {pair.facility_1.area_name || 'Tumkur'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDeleteFacility(pair.facility_2.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/30 text-rose-300 hover:bg-rose-600 hover:text-white font-bold text-[11px]"
                    >
                      Delete Duplicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">No duplicate facilities detected!</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: USER ROLE ACCESS */}
      {activeTab === 'users' && (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-navy-800 flex items-center justify-between text-xs">
            <h3 className="text-sm font-bold text-white">User Accounts & Roles</h3>
            <span className="font-mono text-slate-400">{usersList.length} Accounts</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-4 text-right">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-3 text-slate-400">{u.department || 'Citizen'}</td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-navy-800 border border-navy-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none font-bold"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Planner">Planner</option>
                        <option value="User">Citizen User</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-navy-900 border border-navy-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-navy-800 flex items-center justify-between text-xs">
            <h3 className="text-sm font-bold text-white">Immutable System Audit Logs</h3>
            <span className="font-mono text-slate-400">{auditLogs.length} Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/60">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {auditLogs.map((log, i) => (
                  <tr key={log.id || i} className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-navy-800 text-brand-cyan font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{log.user_name || 'System'}</td>
                    <td className="py-3 px-4 text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Area Modal */}
      {isAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-navy-900 border border-navy-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-navy-800 mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-cyan" />
                <span>Add Tumkur City Locality</span>
              </h3>
              <button onClick={() => setIsAreaModalOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateArea} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Area Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Belagumba"
                  value={areaFormData.name}
                  onChange={(e) => setAreaFormData({ ...areaFormData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-teal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Latitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={areaFormData.latitude}
                    onChange={(e) => setAreaFormData({ ...areaFormData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Longitude *</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={areaFormData.longitude}
                    onChange={(e) => setAreaFormData({ ...areaFormData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={areaFormData.pin_code}
                    onChange={(e) => setAreaFormData({ ...areaFormData, pin_code: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Approx Population</label>
                  <input
                    type="number"
                    value={areaFormData.population}
                    onChange={(e) => setAreaFormData({ ...areaFormData, population: Number(e.target.value) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Locality character, history, prominent landmarks..."
                  value={areaFormData.description}
                  onChange={(e) => setAreaFormData({ ...areaFormData, description: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <button
                  type="button"
                  onClick={() => setIsAreaModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-bold shadow hover:opacity-95"
                >
                  Save Locality
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
