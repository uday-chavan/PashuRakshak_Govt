# PashuRakshak - Livestock Health Surveillance and Epidemic Early Warning System

PashuRakshak is an enterprise-grade epidemiological surveillance, geospatial tracking, and early warning dashboard designed for state veterinary departments, district livestock officers, and animal husbandry authorities. The platform aggregates clinical case reports, laboratory diagnostics, vaccination records, and spatial outbreak clusters across Maharashtra to provide real-time decision support for containment and mitigation.

---

## Key Modules and Capabilities

### 1. Executive Surveillance Overview
- Real-time aggregation of active cases, mortality counts, affected herds, and vaccination coverage metrics.
- Synchronized epidemiological summary cards with automated change indicators.
- Interactive district risk map overview with quick-focus navigation.
- Live database case stream displaying recent clinical incidents and assigned field veterinarians.

### 2. Multi-Metric Disease Activity Analytics
- Longitudinal timeline analytics tracking monthly incidence, mortality, animals at risk, vaccination progress, and recovery rates.
- Toggleable multi-axis composed charts with automated peak outbreak detection.
- Epidemiological rate badges identifying reproduction trends and severity levels.

### 3. Geospatial Hotspot Mapping
- Dual-engine mapping architecture supporting Leaflet (OpenStreetMap/Satellite layers) and Google Maps JavaScript API.
- District polygon choropleth rendering categorized by epidemiological risk (Critical, Attention, Normal).
- Exact coordinate pin plotting for confirmed and suspected field cases with interactive popups.
- Dynamic district search, radius filtering, active outbreak cluster overlays, and viewport reset tools.

### 4. Outbreak Management and Containment
- Comprehensive statewide outbreak monitoring registry tracking affected species, active clusters, and quarantine boundaries.
- Urgency-based containment workflows with response status tracking (Active, Monitoring, Controlled).

### 5. Livestock Field Case Registry
- Tabular registry with multi-column filtering by district, species (Bovine, Ovine, Caprine, Swine, Equine, Avian), disease, and status.
- Case intake modal allowing direct entry of new field reports with automated geographic coordinate extraction and database synchronization.
- Detailed case inspector displaying assigned veterinarian notes, clinical symptoms, treatment history, and laboratory references.

### 6. Vaccination Program and Cold Chain Management
- Target-vs-achievement progress tracking by district and campaign.
- Vaccine inventory records tracking batch numbers, manufacturer details, expiration dates, stock availability, and cold-chain compliance.
- Drive scheduling modal to create and assign field vaccination missions.

### 7. Laboratory and Diagnostic Records
- Centralized log of sample collection records, diagnostic methods (RT-PCR, ELISA, Microscopy, Bacterial Culture), and validation workflows.
- Turnaround time tracking and laboratory test result verification flags.

### 8. Automated Epidemiological Alert Engine
- Rule-based and heuristic anomaly detection analyzing incoming case density and spatial proximity.
- Tiered urgency classifications: Critical (High Urgency), Emerging Cases (Medium Urgency), and Advisory (Informational).
- Quick action to pinpoint alert locations directly on the surveillance map.
- Real-time background polling service triggering non-intrusive floating toast notifications upon detection of newly submitted cases.

---

## Technology Stack

- Frontend Framework: React 19 (React DOM 19)
- Build System and Tooling: Vite 8, Oxlint
- Charting and Data Visualization: Recharts 3
- Mapping and GIS: Leaflet 1.9, Google Maps JavaScript API Loader
- Icons: Lucide React
- Database: Neon Serverless PostgreSQL (pg-18)
- Styling: Modern Vanilla CSS design system with CSS custom properties

---

## Project Structure

```
SIH/
|-- public/
|   |-- vite.svg
|-- src/
|   |-- assets/
|   |   |-- Emblem.png
|   |   |-- pashu-rakshak-logo.png
|   |-- components/
|   |   |-- AlertPanel.jsx
|   |   |-- AnimatedNumber.jsx
|   |   |-- DiseaseActivityChart.css
|   |   |-- DiseaseActivityChart.jsx
|   |   |-- GoogleMapsView.css
|   |   |-- GoogleMapsView.jsx
|   |   |-- LeafletMapView.css
|   |   |-- LeafletMapView.jsx
|   |   |-- MapErrorBoundary.jsx
|   |   |-- Modal.jsx
|   |   |-- NotificationToast.jsx
|   |   |-- Sidebar.css
|   |   |-- Sidebar.jsx
|   |   |-- SimpleChart.jsx
|   |   |-- StatCard.jsx
|   |   |-- Topbar.css
|   |   |-- Topbar.jsx
|   |   |-- TypewriterTitle.jsx
|   |-- data/
|   |   |-- mockData.js
|   |-- db/
|   |   |-- client.js
|   |   |-- schema.sql
|   |   |-- setupDb.js
|   |-- pages/
|   |   |-- Alerts.jsx
|   |   |-- Cases.jsx
|   |   |-- HotspotMap.css
|   |   |-- HotspotMap.jsx
|   |   |-- Laboratory.jsx
|   |   |-- Outbreaks.jsx
|   |   |-- Overview.jsx
|   |   |-- Vaccination.jsx
|   |-- services/
|   |   |-- geminiAlertService.js
|   |   |-- pollingService.js
|   |   |-- vaccinationStore.js
|   |-- App.jsx
|   |-- index.css
|   |-- main.jsx
|-- .env.example
|-- index.html
|-- package.json
|-- vite.config.js
```

---

## Database Architecture

The persistence layer is powered by Neon Serverless PostgreSQL. The schema supports end-to-end animal health management:

- `animal_cases`: Primary ledger for clinical case submissions including case reference ID, animal type, suspected/confirmed disease, clinical stage, geographic coordinates (latitude/longitude), village, district, assigned veterinarian, and timestamp.
- `hotspot_districts`: District-level risk status, affected animal totals, primary pathogen, and last reported date.
- `vaccination_drives` and `vaccine_inventory`: Campaign logistics, targeted species, batch numbers, doses administered, and expiration timelines.
- `lab_records`: Sample identifiers, diagnostic technique, sample collection site, and confirmation status.

The client layer in `src/db/client.js` provides automatic fallback to local structured data if network or database connectivity is unavailable, ensuring continuous operational availability.

---

## Getting Started

### Prerequisites
- Node.js version 18.0.0 or higher
- npm package manager (version 9.0.0 or higher)

### Environment Configuration
1. Copy the template environment configuration file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and set your configuration parameters:
   ```env
   # Google Maps JavaScript API Key (Optional; Leaflet OpenStreetMap fallback is enabled by default)
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

   # Database Connection (If connecting directly to your Neon PostgreSQL instance)
   VITE_DATABASE_URL=postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require
   ```

### Installation
Install project dependencies:
```bash
npm install
```

### Development Server
Start the local development server with hot module replacement:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### Production Build
Compile and optimize assets for deployment:
```bash
npm run build
```
The resulting static assets will be output to the `dist/` directory.

### Preview Production Build
Locally test the generated production build:
```bash
npm run preview
```

### Linting
Run static code analysis using Oxlint:
```bash
npm run lint
```

---

## Security and Operational Guidelines

- Sensitive credentials such as API keys and database strings must be stored exclusively in `.env` and must never be committed to version control.
- Coordinate data and village references conform to state administrative standards to ensure interoperability across district animal husbandry offices.
- The user interface is responsive across desktop workstation resolutions and mobile inspection tablets.

