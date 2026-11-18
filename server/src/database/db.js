import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.resolve(__dirname, '../../../data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'tumkur_city_smartcity.db');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

/**
 * Spatial Haversine Distance Calculator (in Kilometers)
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Initialize Schema for Tumkur City Area-Wise Infrastructure & Planning
 */
export function initSchema() {
  db.exec(`
    -- Users & Role-Based Access
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'User' CHECK(role IN ('Admin', 'User', 'Planner')),
      department TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Areas / Neighborhoods in Tumkur City (Primary spatial unit)
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      population INTEGER,
      pin_code TEXT,
      infrastructure_summary TEXT,
      boundary_geojson TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- 8 Core Facility Categories
    CREATE TABLE IF NOT EXISTS facility_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT
    );

    -- Facilities Table (Schools, Hospitals, Provision Stores, Medical Stores, Post Offices, Layouts, Sites, Other)
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      area_id TEXT REFERENCES areas(id) ON DELETE SET NULL,
      category_id TEXT NOT NULL REFERENCES facility_categories(id),
      name TEXT NOT NULL,
      sub_type TEXT NOT NULL,
      address TEXT NOT NULL,
      pin_code TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      website TEXT,
      opening_hours TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      operational_status TEXT NOT NULL DEFAULT 'Operational' CHECK(operational_status IN ('Operational', 'Under Construction', 'Proposed', 'Temporarily Closed', 'Unknown / Unverified')),
      verification_status TEXT NOT NULL DEFAULT 'Unverified' CHECK(verification_status IN ('Officially Verified', 'Admin Verified', 'Community Reported', 'OpenStreetMap Listed', 'Unverified')),
      data_origin TEXT NOT NULL DEFAULT 'Real Source Data' CHECK(data_origin IN ('Real Source Data', 'Admin Verified Data', 'Community Reported Data', 'OpenStreetMap Ingested', 'Demo Data')),
      source_name TEXT NOT NULL DEFAULT 'Tumkur Municipal & Ground Survey',
      source_url TEXT,
      last_verified_at TEXT,
      verification_notes TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Proposed Capital Projects / Future Infrastructure (Smart City Planning)
    CREATE TABLE IF NOT EXISTS proposed_projects (
      id TEXT PRIMARY KEY,
      area_id TEXT REFERENCES areas(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Hospitals & Healthcare', 'Schools & Education', 'Parks & Greenery', 'Roads & Infrastructure', 'Public Service', 'Essential Markets & Stores', 'Residential Layout')),
      sub_type TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      priority TEXT NOT NULL DEFAULT 'High' CHECK(priority IN ('High', 'Medium', 'Low')),
      status TEXT NOT NULL DEFAULT 'Proposed' CHECK(status IN ('Proposed', 'Under Review', 'Approved', 'Funded')),
      estimated_budget_lakhs REAL,
      target_completion_year INTEGER,
      rationale TEXT NOT NULL,
      expected_beneficiaries INTEGER,
      proposed_by_user_id INTEGER REFERENCES users(id),
      proposed_by_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Saved / Bookmarked Locations & Areas for Citizens
    CREATE TABLE IF NOT EXISTS saved_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type TEXT NOT NULL CHECK(item_type IN ('area', 'facility')),
      item_id TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, item_type, item_id)
    );

    -- User-submitted corrections or facility additions
    CREATE TABLE IF NOT EXISTS user_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      facility_id TEXT REFERENCES facilities(id),
      submission_type TEXT NOT NULL CHECK(submission_type IN ('new_facility', 'correction', 'report_issue')),
      payload_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Data Import Log (OpenStreetMap Overpass syncs)
    CREATE TABLE IF NOT EXISTS data_imports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_name TEXT NOT NULL,
      query_type TEXT NOT NULL,
      records_count INTEGER NOT NULL,
      details TEXT,
      imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Activity Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      ip_address TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for lightning fast spatial, area, and category lookups
    CREATE INDEX IF NOT EXISTS idx_areas_name ON areas(name);
    CREATE INDEX IF NOT EXISTS idx_facilities_area ON facilities(area_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_cat ON facilities(category_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_proposed_area ON proposed_projects(area_id);
    CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_locations(user_id);
  `);
}

export default db;
