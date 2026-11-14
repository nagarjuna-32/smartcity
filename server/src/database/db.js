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

const DB_PATH = path.join(DB_DIR, 'tumakuru_smartcity.db');
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
 * Initialize Schema with Relational & Spatial Tables
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

    -- Districts Table
    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Karnataka',
      country TEXT NOT NULL DEFAULT 'India',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      total_area_sq_km REAL,
      population INTEGER,
      boundary_geojson TEXT,
      description TEXT
    );

    -- Surrounding Districts
    CREATE TABLE IF NOT EXISTS surrounding_districts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      direction TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      distance_km REAL,
      boundary_geojson TEXT,
      description TEXT
    );

    -- Taluks Table (10 Administrative Taluks)
    CREATE TABLE IF NOT EXISTS taluks (
      id TEXT PRIMARY KEY,
      district_id TEXT REFERENCES districts(id),
      name TEXT NOT NULL,
      headquarters TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      area_sq_km REAL,
      population INTEGER,
      total_villages INTEGER,
      total_areas INTEGER,
      boundary_geojson TEXT,
      description TEXT
    );

    -- Areas / Towns / Localities Table
    CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY,
      taluk_id TEXT REFERENCES taluks(id),
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('City / Urban', 'Town', 'Village', 'Industrial Zone', 'Educational Hub', 'Suburban')),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      population INTEGER,
      pin_code TEXT,
      infrastructure_summary TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Facility Categories
    CREATE TABLE IF NOT EXISTS facility_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT
    );

    -- Facilities Table (Schools, Hospitals, Post Offices, Layouts, Sites)
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      category_id TEXT REFERENCES facility_categories(id),
      taluk_id TEXT REFERENCES taluks(id),
      area_id TEXT REFERENCES areas(id),
      name TEXT NOT NULL,
      sub_type TEXT NOT NULL,
      address TEXT NOT NULL,
      pin_code TEXT,
      contact_phone TEXT,
      contact_email TEXT,
      website TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      operational_status TEXT NOT NULL CHECK(operational_status IN ('Operational', 'Under Construction', 'Proposed', 'Temporarily Closed', 'Unknown / Unverified')),
      verification_status TEXT NOT NULL CHECK(verification_status IN ('Officially Verified', 'Admin Verified', 'Community Reported', 'OpenStreetMap Listed', 'Unverified')),
      data_origin TEXT NOT NULL CHECK(data_origin IN ('Real Source Data', 'Admin Verified Data', 'Community Reported Data', 'Demo Data')),
      source_name TEXT NOT NULL,
      source_url TEXT,
      last_verified_at TEXT,
      verification_notes TEXT,
      details_json TEXT
    );

    -- Proposed Projects (Smart City Planning Module)
    CREATE TABLE IF NOT EXISTS proposed_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('Healthcare', 'Education', 'Roads & Infrastructure', 'Residential Layout', 'Public Service', 'Water & Greenery')),
      taluk_id TEXT REFERENCES taluks(id),
      area_id TEXT REFERENCES areas(id),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('High', 'Medium', 'Low')),
      status TEXT NOT NULL CHECK(status IN ('Proposed', 'Under Review', 'Approved', 'Funded')),
      estimated_budget_lakhs REAL,
      target_completion_year INTEGER,
      rationale TEXT NOT NULL,
      expected_beneficiaries INTEGER,
      proposed_by_user_id INTEGER REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    -- Data Import Log
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

    -- Create indexes for ultra-fast spatial and hierarchical lookups
    CREATE INDEX IF NOT EXISTS idx_taluks_district ON taluks(district_id);
    CREATE INDEX IF NOT EXISTS idx_areas_taluk ON areas(taluk_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities(category_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_taluk ON facilities(taluk_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_area ON facilities(area_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities(latitude, longitude);
    CREATE INDEX IF NOT EXISTS idx_proposed_taluk ON proposed_projects(taluk_id);
  `);
}

export default db;
