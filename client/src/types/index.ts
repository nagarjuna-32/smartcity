export interface User {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Planner' | 'User';
  department?: string;
  created_at?: string;
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  population?: number;
  pin_code?: string;
  infrastructure_summary?: string;
  boundary_geojson?: string;
  facilities_count?: number;
  schools_count?: number;
  hospitals_count?: number;
  provision_stores_count?: number;
  medical_stores_count?: number;
  post_offices_count?: number;
  layouts_count?: number;
  sites_count?: number;
  other_count?: number;
  created_at?: string;
  updated_at?: string;
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
  area_id?: string;
  area_name?: string;
  category_id: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  name: string;
  sub_type: string;
  address: string;
  pin_code?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  opening_hours?: string;
  latitude: number;
  longitude: number;
  operational_status: 'Operational' | 'Under Construction' | 'Proposed' | 'Temporarily Closed' | 'Unknown / Unverified';
  verification_status: 'Officially Verified' | 'Admin Verified' | 'Community Reported' | 'OpenStreetMap Listed' | 'Unverified';
  data_origin: 'Real Source Data' | 'Admin Verified Data' | 'Community Reported Data' | 'OpenStreetMap Ingested' | 'Demo Data';
  source_name: string;
  source_url?: string;
  last_verified_at?: string;
  verification_notes?: string;
  details?: Record<string, any>;
  details_json?: string;
  distance_km?: number;
  distance_meters?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProposedProject {
  id: string;
  area_id?: string;
  area_name?: string;
  title: string;
  category: 'Hospitals & Healthcare' | 'Schools & Education' | 'Parks & Greenery' | 'Roads & Infrastructure' | 'Public Service' | 'Essential Markets & Stores' | 'Residential Layout';
  sub_type?: string;
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
  area_id: string;
  area_name: string;
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
  type: 'area' | 'facility';
  category: string;
  category_id?: string;
  category_color?: string;
  category_icon?: string;
  latitude: number;
  longitude: number;
  distance_km?: number;
  url: string;
}

export interface SavedLocation {
  id: number;
  user_id: number;
  item_type: 'area' | 'facility';
  item_id: string;
  notes?: string;
  created_at: string;
  data?: Area | Facility;
}
