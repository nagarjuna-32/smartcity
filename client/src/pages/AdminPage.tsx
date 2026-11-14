import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Facility, Taluk, FacilityCategory } from '../types';
import {
  ShieldAlert,
  Users,
  Layers,
  Database,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  DownloadCloud,
  RefreshCw,
  Search,
  Filter,
  Check,
  Trash2,
  ExternalLink,
  Shield,
  FileText,
  Activity,
  MapPin
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'verification' | 'osm' | 'users' | 'logs'>('verification');

  // Stats
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Verification Queue
  const [unverifiedFacilities, setUnverifiedFacilities] = useState<Facility[]>([]);
  const [loadingFacilities, setLoadingFacilities] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState<string>('Unverified');

  // OSM Ingestion
  const [taluks, setTaluks] = useState<Taluk[]>([]);
  const [categories, setCategories] = useState<FacilityCategory[]>([]);
  const [selectedTalukForImport, setSelectedTalukForImport] = useState<string>('tumakuru');
  const [selectedCatForImport, setSelectedCatForImport] = useState<string>('hospitals');
  const [importLimit, setImportLimit] = useState<number>(10);
  const [importing, setImporting] = useState<boolean>(false);
  const [importResult, setImportResult] = useState<{ message: string; success: boolean } | null>(null);
  const [importHistory, setImportHistory] = useState<any[]>([]);

  // Users
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    loadOverviewStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'verification') {
      loadFacilitiesForVerification();
    } else if (activeTab === 'osm') {
      loadOsmTabData();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'logs') {
      loadAuditLogs();
    }
  }, [activeTab, verificationFilter]);

  const loadOverviewStats = async () => {
    try {
      setLoadingStats(true);
      const res = await api.getAdminStats();
      setStats(res);
    } catch (err) {
      console.error('Failed to load admin stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadFacilitiesForVerification = async () => {
    try {
      setLoadingFacilities(true);
      const params: Record<string, string> = verificationFilter !== 'All' ? { verification_status: verificationFilter } : {};
      const res = await api.getFacilities(params);
      setUnverifiedFacilities(res.facilities);
    } catch (err) {
      console.error('Failed to load facilities for verification', err);
    } finally {
      setLoadingFacilities(false);
    }
  };

  const loadOsmTabData = async () => {
    try {
      const [tRes, cRes, hRes] = await Promise.all([
        api.getTaluks(),
        api.getCategories(),
        api.getImportHistory()
      ]);
      setTaluks(tRes.taluks);
      setCategories(cRes.categories);
      setImportHistory(hRes.imports);
    } catch (err) {
      console.error('Failed to load OSM tab data', err);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await api.getUsers();
      setUsersList(res.users);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.getAuditLogs();
      setAuditLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoadingLogs(false);
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

  // OSM Ingestion Action
  const handleRunOsmImport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setImporting(true);
      setImportResult(null);
      const res = await api.importOsmData({
        taluk_id: selectedTalukForImport,
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
        message: err.message || 'Failed to complete OSM ingestion. Please verify network access.',
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
      setUsersList(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-12 text-center text-slate-300">
        <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Restricted Administrator Area</h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          You do not have administrative privileges. Please log in with an administrator account (e.g. <code>admin@tumakuru.gov.in</code>).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>ADMINISTRATIVE GOVERNANCE & DATA AUDIT</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
            System Administration Console
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Verify community & OSM POIs, run automated geospatial ingestions, manage user credentials, and review immutable audit logs.
          </p>
        </div>

        <button
          onClick={() => {
            loadOverviewStats();
            if (activeTab === 'verification') loadFacilitiesForVerification();
            if (activeTab === 'osm') loadOsmTabData();
            if (activeTab === 'users') loadUsers();
            if (activeTab === 'logs') loadAuditLogs();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800 border border-navy-700 text-slate-300 hover:text-white text-xs font-semibold self-start md:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>REGISTERED USERS</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.users_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Admin, Planner & Citizen roles</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>PENDING VERIFICATION</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400">
            {stats?.unverified_facilities_count ?? '...'}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Awaiting official approval</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>OSM INGESTION RUNS</span>
            <DownloadCloud className="w-4 h-4 text-brand-cyan" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.imports_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Overpass boundary syncs</p>
        </div>

        <div className="bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
            <span>AUDIT TRAIL LOGS</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{stats?.logs_count ?? '...'}</div>
          <p className="text-[11px] text-slate-400 mt-1">Immutable security ledger</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-800 pb-3">
        <button
          onClick={() => setActiveTab('verification')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'verification'
              ? 'bg-brand-teal text-white shadow'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>Verification Queue</span>
          {stats?.unverified_facilities_count > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {stats.unverified_facilities_count}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('osm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'osm'
              ? 'bg-brand-teal text-white shadow'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <DownloadCloud className="w-4 h-4" />
          <span>OSM Overpass Ingestion</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'users'
              ? 'bg-brand-teal text-white shadow'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Role Access</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'logs'
              ? 'bg-brand-teal text-white shadow'
              : 'bg-navy-900 text-slate-400 hover:text-white border border-navy-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Stream</span>
        </button>
      </div>

      {/* Tab 1: Verification Queue */}
      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-navy-900 border border-navy-800 rounded-2xl p-4 shadow-sm text-xs">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold">Filter Status:</span>
              <select
                value={verificationFilter}
                onChange={(e) => setVerificationFilter(e.target.value)}
                className="bg-navy-800 border border-navy-700 text-slate-200 rounded-xl px-3 py-1.5 focus:outline-none"
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

          <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/50">
                    <th className="py-3 px-4">Facility Name & Category</th>
                    <th className="py-3 px-3">Taluk / Area</th>
                    <th className="py-3 px-3">Data Origin & Source</th>
                    <th className="py-3 px-3">Operational Status</th>
                    <th className="py-3 px-3">Verification</th>
                    <th className="py-3 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {unverifiedFacilities.map((f) => (
                    <tr key={f.id} className="hover:bg-navy-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{f.name}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded bg-navy-800 text-slate-300">
                            {f.category_name}
                          </span>
                          <span>{f.sub_type}</span>
                        </div>
                        <div className="text-slate-500 text-[10px] mt-0.5 truncate max-w-xs">
                          {f.address}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-slate-200">{f.taluk_name} Taluk</span>
                        <span className="text-[10px] text-slate-400 block">{f.area_name || 'Taluk wide'}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-medium text-slate-300 block">{f.source_name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Lat: {f.latitude.toFixed(4)}, Lng: {f.longitude.toFixed(4)}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            f.operational_status === 'Operational'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : f.operational_status === 'Under Construction'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-700 text-slate-300'
                          }`}
                        >
                          {f.operational_status}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            f.verification_status === 'Officially Verified'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : f.verification_status === 'Admin Verified'
                              ? 'bg-brand-teal/20 text-brand-cyan'
                              : f.verification_status === 'OpenStreetMap Listed'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {f.verification_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {f.verification_status !== 'Officially Verified' && (
                            <button
                              onClick={() => handleVerify(f.id, 'Officially Verified')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white font-semibold text-[11px] flex items-center gap-1 transition-colors"
                              title="Approve as Officially Verified"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteFacility(f.id)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete facility"
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

            {unverifiedFacilities.length === 0 && !loadingFacilities && (
              <div className="p-12 text-center text-slate-400">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">All Caught Up!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  No facilities in this category are pending verification.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: OSM Overpass Ingestion */}
      {activeTab === 'osm' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <DownloadCloud className="w-5 h-5 text-brand-cyan" />
              <h3 className="text-lg font-bold text-white">Trigger OSM Ingestion</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Query the OpenStreetMap Overpass API for real geographic nodes located inside Tumakuru District.
            </p>

            {importResult && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs flex items-center gap-2 ${
                  importResult.success
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                }`}
              >
                {importResult.success ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                <span>{importResult.message}</span>
              </div>
            )}

            <form onSubmit={handleRunOsmImport} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Target Taluk *</label>
                <select
                  value={selectedTalukForImport}
                  onChange={(e) => setSelectedTalukForImport(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {taluks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} Taluk ({t.headquarters})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility Category *</label>
                <select
                  value={selectedCatForImport}
                  onChange={(e) => setSelectedCatForImport(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
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
                  className="w-full bg-navy-800 border border-navy-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Capped at 50 to comply with Overpass API rate boundaries.
                </span>
              </div>

              <div className="bg-navy-800/60 rounded-xl p-3 border border-navy-700 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Ingestion Constraints:</span>
                <div>• Imported items default to <code>Unknown / Unverified</code>.</div>
                <div>• Source is tracked as <code>OpenStreetMap Overpass API</code>.</div>
                <div>• Lat/Lng bound to Tumakuru: <code>[13.1, 76.5, 13.8, 77.3]</code>.</div>
              </div>

              <button
                type="submit"
                disabled={importing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-brand-teal to-brand-cyan text-white font-semibold text-sm shadow hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {importing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Overpass Query...</span>
                  </>
                ) : (
                  <>
                    <DownloadCloud className="w-4 h-4" />
                    <span>Start Live OSM Import</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* History */}
          <div className="lg:col-span-2 bg-navy-900 border border-navy-800 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-brand-teal" />
                Geospatial Import History
              </h3>
              <span className="text-xs text-slate-400">Recorded Ingestions</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Data Source</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3 text-center">Imported</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-slate-200">
                  {importHistory.map((h, i) => (
                    <tr key={h.id || i} className="hover:bg-navy-800/40">
                      <td className="py-3 px-3 font-mono text-slate-400">
                        {new Date(h.created_at || Date.now()).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">
                        {h.source_name || 'OpenStreetMap Overpass API'}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-navy-800 border border-navy-700 text-brand-cyan">
                          {h.category || 'Mixed Categories'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-emerald-400">
                        +{h.records_imported || h.records_count || 0}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {importHistory.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-xs">
                  No external imports executed yet. Run an import above to populate this log.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Role Management */}
      {activeTab === 'users' && (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-navy-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                User Accounts & Access Control
              </h3>
              <p className="text-xs text-slate-400">
                Assign roles to grant urban planning or full administrator privileges.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Total {usersList.length} Accounts
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/40">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-3">Email Address</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Registered On</th>
                  <th className="py-3 px-4 text-right">Access Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white text-sm">{u.name}</div>
                      <span className="text-[10px] text-slate-500 font-mono">UID: #{u.id}</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {u.department || 'General Public / Citizen'}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-mono">
                      {new Date(u.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none ${
                          u.role === 'Admin'
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                            : u.role === 'Planner'
                            ? 'bg-teal-500/20 border-teal-500/40 text-brand-cyan'
                            : 'bg-navy-800 border-navy-700 text-slate-300'
                        }`}
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

      {/* Tab 4: Audit Stream */}
      {activeTab === 'logs' && (
        <div className="bg-navy-900 border border-navy-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-navy-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-400" />
                Immutable System Audit Logs
              </h3>
              <p className="text-xs text-slate-400">
                Detailed record of administrative actions, role modifications, and dataset ingestions.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-navy-800 text-slate-400 uppercase font-semibold bg-navy-950/40">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Actor / User</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800 text-slate-200">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {new Date(log.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-brand-cyan px-2 py-0.5 rounded bg-brand-teal/20">
                        {log.action || log.event || 'System Action'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {log.user_name || log.user_email || 'System'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {auditLogs.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                No audit events recorded yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
