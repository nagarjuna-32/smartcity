import {
  User,
  Area,
  FacilityCategory,
  Facility,
  ProposedProject,
  InfrastructureGap,
  SearchResult,
  SavedLocation
} from '../types';

const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('tumkur_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('tumkur_auth_token', token);
  } else {
    localStorage.removeItem('tumkur_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (payload: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getProfile: () => request<{ user: User }>('/auth/me'),

  // Areas (Tumkur City Localities)
  getAreas: (params?: { search?: string; sort?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ areas: Area[]; total: number }>(`/areas${query ? `?${query}` : ''}`);
  },

  getArea: (id: string, params?: { radius_km?: string; category_id?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      area: Area;
      facilities: Facility[];
      total_nearby: number;
      proposed_projects: ProposedProject[];
      infrastructure_metrics: {
        nearest_hospital_km: number | null;
        nearest_hospital_name: string;
        nearest_school_km: number | null;
        nearest_school_name: string;
        nearest_medical_km: number | null;
        nearest_medical_name: string;
        nearest_provision_km: number | null;
        nearest_provision_name: string;
        gap_alerts: Array<{ id: string; type: string; severity: string; message: string; recommendation: string }>;
        notice: string;
      };
    }>(`/areas/${id}${query ? `?${query}` : ''}`);
  },

  createArea: (payload: Partial<Area>) =>
    request<{ message: string; area: Area }>('/areas', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateArea: (id: string, payload: Partial<Area>) =>
    request<{ message: string; area: Area }>(`/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteArea: (id: string) =>
    request<{ message: string }>(`/areas/${id}`, {
      method: 'DELETE'
    }),

  // Facilities
  getCategories: () => request<{ categories: FacilityCategory[] }>('/facilities/categories'),

  getFacilities: (params?: Record<string, string | number | boolean | undefined>) => {
    const cleanParams: Record<string, string> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
    }
    const query = new URLSearchParams(cleanParams).toString();
    return request<{ facilities: Facility[]; total: number; limit: number; offset: number }>(
      `/facilities${query ? `?${query}` : ''}`
    );
  },

  getFacility: (id: string, userCoords?: { lat: number; lng: number }) => {
    const query = userCoords ? `?user_lat=${userCoords.lat}&user_lng=${userCoords.lng}` : '';
    return request<{ facility: Facility; nearby: Facility[] }>(`/facilities/${id}${query}`);
  },

  createFacility: (payload: Partial<Facility>) =>
    request<{ message: string; facility: Facility }>('/facilities', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateFacility: (id: string, payload: Partial<Facility>) =>
    request<{ message: string; facility: Facility }>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  verifyFacility: (id: string, payload: { operational_status?: string; verification_status?: string; notes?: string }) =>
    request<{ message: string; facility: Facility }>(`/facilities/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteFacility: (id: string) =>
    request<{ message: string }>(`/facilities/${id}`, {
      method: 'DELETE'
    }),

  // Smart City Planning & Analytics
  getPlanningAnalytics: (area_id?: string) => {
    const query = area_id && area_id !== 'all' ? `?area_id=${area_id}` : '';
    return request<{
      area_statistics: any[];
      infrastructure_gaps: InfrastructureGap[];
      projects_summary: any[];
      summary: {
        total_areas: number;
        total_facilities: number;
        verified_ratio: number;
        gaps_detected: number;
      };
      data_confidence_notice: string;
    }>(`/planning/analytics${query}`);
  },

  getProposedProjects: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ projects: ProposedProject[]; total: number }>(`/planning/proposed-projects${query ? `?${query}` : ''}`);
  },

  createProposedProject: (payload: Partial<ProposedProject>) =>
    request<{ message: string; project: ProposedProject }>('/planning/proposed-projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateProposedProject: (id: string, payload: Partial<ProposedProject>) =>
    request<{ message: string; project: ProposedProject }>(`/planning/proposed-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),

  deleteProposedProject: (id: string) =>
    request<{ message: string }>(`/planning/proposed-projects/${id}`, {
      method: 'DELETE'
    }),

  // Search
  search: (query: string, coords?: { lat: number; lng: number }) => {
    let url = `/search?q=${encodeURIComponent(query)}`;
    if (coords) {
      url += `&lat=${coords.lat}&lng=${coords.lng}`;
    }
    return request<{ query: string; total: number; results: SearchResult[] }>(url);
  },

  // Saved / Bookmarks
  getSavedLocations: () => request<{ saved: SavedLocation[] }>('/saved'),

  saveLocation: (payload: { item_type: 'area' | 'facility'; item_id: string; notes?: string }) =>
    request<{ message: string; id: number }>('/saved', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  removeSavedLocation: (id: number) =>
    request<{ message: string }>(`/saved/${id}`, {
      method: 'DELETE'
    }),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getDuplicates: () => request<{ total: number; duplicates: any[] }>('/admin/duplicates'),
  getUsers: () => request<{ users: User[] }>('/admin/users'),
  updateUserRole: (id: number, role: string) =>
    request<{ message: string }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  importOsmData: (payload: { area_id?: string; category: string; limit?: number }) =>
    request<{ message: string; records_imported: number; category: string; success: boolean }>('/admin/import/osm', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getImportHistory: () => request<{ imports: any[] }>('/admin/imports'),
  getAuditLogs: () => request<{ logs: any[] }>('/admin/logs')
};
