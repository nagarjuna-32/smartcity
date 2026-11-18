# TUMKUR SMART CITY – Area-Wise Infrastructure & Urban Planning Platform
### Digital Geographical Information System (GIS) & Urban Infrastructure Management for Tumkur City, Karnataka, India

---

## 1. Project Overview

**Tumkur Smart City** is a modern, enterprise-grade Geographic Information System (GIS) and municipal infrastructure management platform focused entirely on **Tumkur City, Karnataka, India**, and its neighborhood localities.

The platform provides a direct, locality-by-locality exploration hierarchy:
```
TUMKUR CITY → AREAS / LOCALITIES → FACILITIES DIRECTORY → INTERACTIVE MAP → INFRASTRUCTURE ANALYSIS → SMART DEVELOPMENT PLANNING
```

*(Note: In strict alignment with urban municipal requirements, this application starts directly with Tumkur City and its neighborhoods. There is no district-selection or taluk-selection hierarchy anywhere in the system.)*

---

## 2. Core Capabilities

1. **Locality-by-Locality Exploration**:
   - Preloaded with 15 verified Tumkur City neighborhoods:
     - **SS Puram** (Central residential & premier healthcare corridor)
     - **Batawadi** (Ring road junction & commercial zone)
     - **SIT Extension** (Premier educational hub & engineering campus)
     - **Yellapur** (North Tumkur developing residential corridor)
     - **Heggere** (South Tumkur gateway & medical college zone)
     - **Mandipet** (Historical APMC trading heart & Town Hall)
     - **Upparhalli** (Vibrant neighborhood & primary healthcare outpost)
     - **Sadashivanagar** (Green residential layout with Kendriya Vidyalaya)
     - **Gokula Extension** (Eastern extension near Kyathsandra)
     - **Shivakumarswamy Layout** (Planned residential sector)
     - **TUDA Layout** (Officially sanctioned urban authority layout)
     - **Maruthi Nagar** (Academic & housing sector near SSIT)
     - **Hanumanthapura** (North-western suburban locality)
     - **Jayanagar West** (Established residential neighborhood)
     - **Bheemasandra** (Logistics & highway commercial corridor on NH-48)

2. **8 Core Facility Categories**:
   - 🎓 **Schools and Education**: Government schools, private institutions, PU colleges, degree & engineering colleges (SIT, SSIT, Tumkur University, Kendriya Vidyalaya).
   - 🏥 **Hospitals and Healthcare**: District apex hospital, multi-specialty centers, nursing homes, and Urban Primary Health Centres (UPHCs).
   - 🧺 **Provision Stores**: Supermarkets (More, Reliance Smart Point, D-Mart), wholesale grain yards (APMC), and daily essentials grocers.
   - 💊 **Medical Stores**: 24/7 retail pharmacies (Apollo, MedPlus), generic drug dispensaries (Jan Aushadhi Kendra), and neighborhood chemists.
   - ✉️ **Post Offices**: Head Post Office (PIN 572101), campus postal sub-offices (SIT 572103), and branch delivery counters.
   - 🏡 **Residential Layouts**: TUDA approved layouts, housing board enclaves, and developing residential projects.
   - 🗺️ **Sites and Land**: Publicly auctioned commercial parcels, industrial land banks, and civic amenity (CA) plots.
   - 🏛️ **Other Facilities and Shops**: Banks & ATMs, bus terminals (KSRTC City Bus Stand), parks (Amanikere Eco Park), and municipal corporation offices.

3. **Dynamic Distance Radar & Radius Search**:
   - Calculates real Haversine spherical distances from the selected area centroid or user-selected point.
   - Configurable radius filters:
     - Within **500 meters** (walking distance)
     - Within **1 kilometer**
     - Within **2 kilometers**
     - Within **5 kilometers**
     - **All nearby**
   - Direct turn-by-turn routing links to OpenStreetMap directions (`https://www.openstreetmap.org/directions?to={lat},{lng}`).

4. **Smart City Planning & Gap Analysis**:
   - Evaluates service coverage per locality (hospitals, schools, pharmacies, grocery stores).
   - Automated detection of service deficits (e.g. areas > 1.5 km from healthcare, absence of 24/7 pharmacies, or residential sprawl lacking essential stores).
   - Standard urban planning disclaimer: *"Preliminary analysis based on available mapped data. This does not confirm the absence of facilities."*
   - Development Planning: Propose future hospitals, schools, parks, and roads with budget outlays, beneficiary projections, and rationale.

5. **Administrative Governance & Real Data Ingestion**:
   - Area CRUD: Add, edit, or delete Tumkur City localities.
   - Facility Verification Queue: Review and approve unverified or community-reported facilities.
   - Live OpenStreetMap Overpass Ingestion: Query live OSM nodes bounded strictly within the Tumkur City bounding box `[13.28, 77.06, 13.38, 77.16]`.
   - Duplicate Detection Engine: Flags facilities with similar names or situated within 50 meters of each other.
   - User Role Management: Assign `Admin`, `Planner`, or `Citizen` privileges.

---

## 3. Technology Stack

- **Frontend**:
  - React 18 with Vite & TypeScript
  - Tailwind CSS (Navy Blue primary theme `#0A192F`, Brand Teal `#087E8B`, Brand Cyan `#00ADB5`, Emerald `#10B981`)
  - Leaflet.js with custom SVG category markers and operational status halos
  - Lucide React icon suite
  - React Router (Area-based navigation hierarchy)
- **Backend**:
  - Node.js (v24 native)
  - Express.js REST API
  - Native SQLite (`node:sqlite` DatabaseSync engine with WAL mode and foreign key constraints)
  - Spherical Haversine distance calculator
  - JWT Authentication & bcryptjs password hashing
  - Axios for live OpenStreetMap Overpass API queries

---

## 4. Quick Start & Execution

### Prerequisites
- Node.js (v18 or higher; v20+ recommended)
- npm

### 1. Build and Seed
```bash
# Seed the database with 15 Tumkur localities and 44 verified facilities
npm run seed

# Build the frontend client
cd client
npm run build
cd ..
```

### 2. Launch Unified Platform
```bash
# Starts unified backend and frontend on port 5000
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

---

## 5. Pre-Configured Test Credentials

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@tumkur.gov.in` | `Tumkur@2026` | Full platform access, Area CRUD, Facility Verification Queue, OSM Ingestion, User Roles |
| **Urban Planner** | `planner@tumkur.gov.in` | `Planner@2026` | Planning analytics, Gap detection, Capital project creation & status updates |
| **Citizen User** | `citizen@tumkur.gov.in` | `Citizen@2026` | Area exploration, interactive map, radius search, proposal submissions, bookmarks |

---

## 6. REST API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Authenticate with email/password; returns JWT |
| `/api/auth/register` | `POST` | Create a new user account |
| `/api/auth/me` | `GET` | Get current logged-in user profile |
| `/api/areas` | `GET` | List all Tumkur City localities with dynamic facility counts |
| `/api/areas/:id` | `GET` | Get area details, nearby facilities, distance radar, and gap alerts |
| `/api/areas` | `POST` | Add a new Tumkur locality (Admin only) |
| `/api/areas/:id` | `PUT` | Update area coordinates/details (Admin only) |
| `/api/areas/:id` | `DELETE`| Remove area (Admin only) |
| `/api/facilities/categories` | `GET` | List all 8 facility categories with dynamic counts |
| `/api/facilities` | `GET` | Search facilities with multi-category, radius, area, and status filters |
| `/api/facilities/:id` | `GET` | Get single facility profile with nearby facilities |
| `/api/facilities` | `POST` | Create a new facility (Admin/Planner) |
| `/api/facilities/:id/verify` | `PUT` | Verify facility record (Admin only) |
| `/api/facilities/:id` | `DELETE`| Delete facility record (Admin only) |
| `/api/planning/analytics` | `GET` | Get area-wise coverage metrics and automated gap alerts |
| `/api/planning/proposed-projects` | `GET` / `POST` | List or propose future capital works projects |
| `/api/planning/proposed-projects/:id` | `PUT` / `DELETE` | Update or remove project proposals |
| `/api/search?q=:query` | `GET` | Global omnibar search across areas and facilities |
| `/api/saved` | `GET` / `POST` / `DELETE` | Manage citizen bookmarks and saved locations |
| `/api/admin/stats` | `GET` | Administrative telemetry and KPI counts |
| `/api/admin/duplicates` | `GET` | Spatial and name duplicate detection |
| `/api/admin/import/osm` | `POST` | Trigger live OpenStreetMap Overpass ingestion |
| `/api/admin/users` | `GET` / `PUT` | Manage user accounts and permissions |
| `/api/admin/logs` | `GET` | Immutable system audit log ledger |
