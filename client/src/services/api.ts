const BASE_URL = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('tumakuru_auth_token');
}

export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem('tumakuru_auth_token', token);
  } else {
    localStorage.removeItem('tumakuru_auth_token');
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
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  register: (payload: { name: string; email: string; password: string; role?: string; department?: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getProfile: () => request<{ user: any }>('/auth/me'),

  // Districts
  getDistrict: () => request<{ district: any; stats: any }>('/districts'),
  getSurroundingDistricts: () => request<{ surrounding: any[] }>('/districts/surrounding'),

  // Taluks
  getTaluks: () => request<{ taluks: any[] }>('/taluks'),
  getTaluk: (id: string) => request<{ taluk: any; areas: any[]; facilities: any[]; proposed_projects: any[] }>(`/taluks/${id}`),

  // Areas
  getAreas: (params?: { taluk_id?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ areas: any[] }>(`/areas${query ? `?${query}` : ''}`);
  },
  getArea: (id: string) => request<{ area: any; facilities: any[]; proposed_projects: any[] }>(`/areas/${id}`),

  // Facilities
  getCategories: () => request<{ categories: any[] }>('/facilities/categories'),
  getFacilities: (params?: Record<string, string | number>) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{ facilities: any[]; total: number }>(`/facilities${query ? `?${query}` : ''}`);
  },
  getFacility: (id: string, userCoords?: { lat: number; lng: number }) => {
    const query = userCoords ? `?user_lat=${userCoords.lat}&user_lng=${userCoords.lng}` : '';
    return request<{ facility: any; nearby: any[] }>(`/facilities/${id}${query}`);
  },
  createFacility: (payload: any) =>
    request<{ facility: any }>('/facilities', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateFacility: (id: string, payload: any) =>
    request<{ facility: any }>(`/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  verifyFacility: (id: string, payload: { operational_status?: string; verification_status?: string; notes?: string }) =>
    request<{ facility: any }>(`/facilities/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteFacility: (id: string) =>
    request<{ message: string }>(`/facilities/${id}`, {
      method: 'DELETE'
    }),

  // Planning & Analytics
  getPlanningAnalytics: (taluk_id?: string) => {
    const query = taluk_id ? `?taluk_id=${taluk_id}` : '';
    return request<{
      taluk_statistics: any[];
      infrastructure_gaps: any[];
      projects_summary: any[];
      data_confidence_notice: string;
    }>(`/planning/analytics${query}`);
  },
  getProposedProjects: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return request<{ projects: any[] }>(`/planning/proposed-projects${query ? `?${query}` : ''}`);
  },
  createProposedProject: (payload: any) =>
    request<{ project: any }>('/planning/proposed-projects', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  updateProposedProject: (id: string, payload: any) =>
    request<{ project: any }>(`/planning/proposed-projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    }),
  deleteProposedProject: (id: string) =>
    request<{ message: string }>(`/planning/proposed-projects/${id}`, {
      method: 'DELETE'
    }),

  // Search
  search: (query: string) =>
    request<{ query: string; total: number; results: any[] }>(`/search?q=${encodeURIComponent(query)}`),

  // Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getUsers: () => request<{ users: any[] }>('/admin/users'),
  updateUserRole: (id: number, role: string) =>
    request<{ message: string }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  importOsmData: (payload: { taluk_id: string; category: string; limit?: number }) =>
    request<{ message: string; records_imported: number; category: string }>('/admin/import/osm', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  getImportHistory: () => request<{ imports: any[] }>('/admin/imports'),
  getAuditLogs: () => request<{ logs: any[] }>('/admin/logs')
};
