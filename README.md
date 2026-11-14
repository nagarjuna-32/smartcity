# TUMAKURU SMART CITY – Intelligent District Planning & Facility Mapping System
### Digital Geographical Information System (GIS) & Municipal Planning Platform for Tumakuru District, Karnataka, India

---

## 1. Project Overview

**Tumakuru Smart City** is a modern, enterprise-grade Geographic Information System (GIS) and municipal infrastructure management platform designed specifically for **Tumakuru District, Karnataka, India**.

The platform provides an end-to-end digital hierarchy:
1. **Karnataka State Overview**: Regional spatial context highlighting Tumakuru District and its 8 surrounding districts (Chitradurga, Davanagere, Hassan, Mandya, Ramanagara, Bengaluru Rural, Chikkaballapura, and Sri Sathya Sai / Anantapur).
2. **Tumakuru District**: Administrative telemetry across 10,597 km², 2.7M population, and major national/state highway transport corridors (NH-48, NH-75, NH-73, SH-33).
3. **10 Administrative Taluks**: Tumakuru, Tiptur, Gubbi, Kunigal, Sira, Pavagada, Madhugiri, Koratagere, Turuvekere, and Chikkanayakanahalli.
4. **40+ Localities & Settlements**: Towns, educational hubs, industrial zones (Vasanthanarasapura KIADB), and rural villages.
5. **5 Core Facility Categories**:
   - Schools & Colleges (Higher education, engineering, polytechnics, PU colleges)
   - Hospitals & Healthcare (District Hospital, Taluk Hospitals, Community Health Centers, PHCs)
   - Post Offices (Head Post Office, sub-post offices, delivery hubs)
   - Residential Layouts (TUDA approved layouts, private townships)
   - Sites & Land Information (Industrial plots, commercial sites, investment land banks)
6. **Smart City Planning Engine**: Automated spatial gap detection (healthcare deficits, higher education reach, unapproved layouts), and proposed capital works pipeline.
7. **Governance & Verification Console**: Admin-level moderation queue, user role management, and live OpenStreetMap Overpass API ingestion.

---

## 2. Technology Stack

- **Frontend**:
  - React 18 + Vite + TypeScript
  - Tailwind CSS (Deep Navy `#0A192F`, Brand Teal `#087E8B`, Emerald `#10B981`)
  - Leaflet.js with OpenStreetMap Carto tiles
  - Lucide React icon suite
- **Backend**:
  - Node.js (v24 native)
  - Express.js REST API Architecture
  - SQLite database via Node's native synchronous `node:sqlite` engine with WAL mode and foreign key constraints
  - Haversine spherical distance calculation engine
  - JWT Authentication + bcryptjs password hashing
  - Axios for live OpenStreetMap Overpass API queries

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js (v18 or higher; v20+ recommended)
- npm

### 1. Installation
Install dependencies for root, server, and client:
```bash
# Root
npm install

# Server
cd server
npm install
cd ..

# Client
cd client
npm install
npm run build
cd ..
```

### 2. Seed Database
Initializes schema and seeds all 10 taluks, 40+ areas, 39 verified real facilities, and 5 capital projects:
```bash
npm run seed
```

### 3. Launch Application
To launch the full unified application (Backend + Frontend on single port):
```bash
node server/src/index.js
```
The application will be live at: **`http://localhost:5000`**

Or for frontend development with Hot Module Replacement (HMR):
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```
Frontend dev server will be live at: **`http://localhost:5173`** (proxies `/api` calls to `:5000`).

---

## 4. Default Test Credentials

Pre-configured role-based credentials for immediate system access:

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@tumakuru.gov.in` | `Tumakuru@2026` | Full platform access, OSM Ingestion, Facility Verification Queue, User Roles |
| **Urban Planner** | `planner@tumakuru.gov.in` | `Planner@2026` | Planning analytics, Gap detection, Capital project creation & status modification |
| **Citizen User** | `citizen@tumakuru.gov.in` | `Citizen@2026` | District exploration, interactive map, radius search, proposal submissions |

---

## 5. Architectural Modules

### Module 1: Authentication & RBAC
- Full-screen GIS background on `/login` with quick pre-filled credential demo buttons.
- JWT token expiration (24h) and local storage token management.
- Role-based route guard protecting `/admin` and edit permissions.

### Module 2: Welcome Dashboard (`/`)
- Dynamic metric summary: 10 Taluks, 40+ Settlements, 39 Verified Facilities, 8 Surrounding Districts.
- Interactive Leaflet map preview with custom SVGs and status halos.
- Surrounding district navigation pills with directional bearings (NW, W, SW, S, SE, E, NE).

### Module 3: District Exploration (`/district`)
- Macro-demographic telemetry (10,597 km², 2.7M pop).
- Key highway connectivity (NH-48 Golden Quadrilateral, NH-75, NH-73, SH-33).
- 8 surrounding districts card explorer with distances and mutual economic links.

### Module 4: Taluk Exploration (`/taluks`, `/taluks/:id`)
- Complete profiles for all 10 taluks: Tumakuru, Tiptur, Gubbi, Kunigal, Sira, Pavagada, Madhugiri, Koratagere, Turuvekere, Chikkanayakanahalli.
- Micro-settlements list, facility counts, and local capital projects.

### Module 5: Areas & Villages (`/areas`, `/areas/:id`)
- 40+ settlements classified into *City / Urban*, *Town*, *Village*, *Industrial Zone*, *Educational Hub*, and *Suburban*.
- Infrastructure summary and registered local facilities.

### Module 6: Facility Mapping & Spatial Explorer (`/facilities`)
- 5 core facility category filter pills.
- Interactive Leaflet map with colored SVG category markers and operational status indicators:
  - Green Halo: `Operational`
  - Amber Halo: `Under Construction`
  - Gray Halo: `Proposed / Unknown`
- Proximity radius filter slider (1 km to 50 km).
- Operational and verification provenance badges (`Officially Verified`, `OpenStreetMap Listed`, `Admin Verified`).
- One-click turn-by-turn navigation via OpenStreetMap Directions (`https://www.openstreetmap.org/directions?to={lat},{lng}`).

### Module 7: Smart City Planning & Deficit Engine (`/planning`)
- Automated detection of service coverage deficits:
  - *Healthcare Outreach Deficit* in peripheral taluks (Pavagada, Koratagere).
  - *Higher Education Deficit* in rural taluks.
  - *Postal Delivery Hub Gaps*.
- Comparative infrastructure density table.
- Capital works proposal submission modal.

### Module 8: Analytics & Telemetry (`/analytics`)
- High-level indicators: citizens per hospital bed, schools per 1,000 km², postal density.
- Category share distribution progress bars.
- Export to CSV report generation.

### Module 9: Capital Projects Pipeline (`/projects`)
- Filterable pipeline of proposed civic works by priority (High, Medium, Low) and status (Proposed, Under Review, Approved, Funded).
- Financial outlay summary (₹ Crores / Lakhs) and projected beneficiaries count.

### Module 10: Administration & Data Governance (`/admin`)
- **Facility Verification Queue**: Approve, verify, or remove community & OSM POIs.
- **Live OpenStreetMap Overpass Ingestion**: Execute real queries against OSM bounding box `[13.1, 76.5, 13.8, 77.3]`.
- **User Role Management**: Modify user roles dynamically between Admin, Planner, and Citizen.
- **System Audit Stream**: Complete audit trail of system operations and imports.

### Module 11: Global Spatial Search (`Ctrl+K`)
- Omnibar search modal querying districts, taluks, settlements, and facilities in real time.

---

## 6. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate with email/password; returns JWT |
| `/api/auth/register` | `POST` | Create a new user account |
| `/api/auth/me` | `GET` | Get current logged-in user profile |
| `/api/districts` | `GET` | Get Tumakuru District information and statistics |
| `/api/districts/surrounding` | `GET` | Get 8 surrounding districts data |
| `/api/taluks` | `GET` | List all 10 taluks with facility counts |
| `/api/taluks/:id` | `GET` | Get specific taluk with settlements and facilities |
| `/api/areas` | `GET` | List areas filterable by `taluk_id` and `category` |
| `/api/areas/:id` | `GET` | Get area profile and facilities |
| `/api/facilities` | `GET` | List facilities filterable by `category`, `taluk`, `radius`, etc. |
| `/api/facilities/:id` | `GET` | Get facility details and nearby facilities |
| `/api/facilities` | `POST` | Create a new facility |
| `/api/facilities/:id/verify`| `PUT` | Update facility operational and verification status |
| `/api/planning/analytics` | `GET` | Get gap alerts and taluk infrastructure metrics |
| `/api/planning/proposed-projects` | `GET` / `POST` | List or create proposed capital projects |
| `/api/search?q=:query` | `GET` | Global search across all spatial entities |
| `/api/admin/stats` | `GET` | Admin KPI statistics |
| `/api/admin/users` | `GET` | List all user accounts |
| `/api/admin/import/osm` | `POST` | Trigger live Overpass API ingestion |

---

## 7. Data Provenance & Reliability Policy
In adherence to urban planning standards:
- All pre-seeded facilities reflect actual geographic coordinates, verifiable PIN codes, and official addresses in Tumakuru District.
- Ingested OpenStreetMap data is explicitly tagged as `OpenStreetMap Listed` and marked `Unknown / Unverified` until ground-verified by an administrator.
- No synthetic or arbitrary operational claims are presented as verified facts.
