export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Planner' | 'User';
  department?: string;
  created_at?: string;
}

export interface District {
  id: string;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  total_area_sq_km: number;
  population: number;
  boundary_geojson?: string;
  description: string;
}

export interface SurroundingDistrict {
  id: string;
  name: string;
  state: string;
  direction: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  description: string;
}

export interface Taluk {
  id: string;
  district_id: string;
  name: string;
  headquarters: string;
  latitude: number;
  longitude: number;
  area_sq_km: number;
  population: number;
  total_villages: number;
  total_areas: number;
  description: string;
  areas_count?: number;
  facilities_count?: number;
  schools_count?: number;
  hospitals_count?: number;
  post_offices_count?: number;
  layouts_count?: number;
  sites_count?: number;
}

export interface Area {
  id: string;
  taluk_id: string;
  taluk_name?: string;
  name: string;
  category: 'City / Urban' | 'Town' | 'Village' | 'Industrial Zone' | 'Educational Hub' | 'Suburban';
  latitude: number;
  longitude: number;
  population?: number;
  pin_code?: string;
  infrastructure_summary?: string;
  facilities_count?: number;
}

export interface FacilityCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  count?: number;
}

export interface Facility {
  id: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  taluk_id: string;
  taluk_name?: string;
  area_id?: string;
  area_name?: string;
  name: string;
  sub_type: string;
  address: string;
  pin_code?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  latitude: number;
  longitude: number;
  operational_status: 'Operational' | 'Under Construction' | 'Proposed' | 'Temporarily Closed' | 'Unknown / Unverified';
  verification_status: 'Officially Verified' | 'Admin Verified' | 'Community Reported' | 'OpenStreetMap Listed' | 'Unverified';
  data_origin: 'Real Source Data' | 'Admin Verified Data' | 'Community Reported Data' | 'Demo Data';
  source_name: string;
  source_url?: string;
  last_verified_at?: string;
  verification_notes?: string;
  details?: Record<string, any>;
  distance_km?: number;
}

export interface ProposedProject {
  id: string;
  title: string;
  category: 'Healthcare' | 'Education' | 'Roads & Infrastructure' | 'Residential Layout' | 'Public Service' | 'Water & Greenery';
  taluk_id: string;
  taluk_name?: string;
  area_id?: string;
  area_name?: string;
  latitude: number;
  longitude: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Proposed' | 'Under Review' | 'Approved' | 'Funded';
  estimated_budget_lakhs?: number;
  target_completion_year?: number;
  rationale: string;
  expected_beneficiaries?: number;
  proposed_by_name?: string;
  created_at?: string;
}

export interface InfrastructureGap {
  id: string;
  taluk_id: string;
  taluk_name: string;
  category: string;
  title: string;
  severity: 'High' | 'Medium' | 'Low';
  supporting_data: string;
  recommendation: string;
  target_timeline: string;
  confidence: string;
}

export interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: string;
  category: string;
  latitude: number;
  longitude: number;
  url: string;
}
