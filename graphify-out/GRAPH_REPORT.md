# Graph Report - agile  (2026-11-03)

## Corpus Check
- 152 files · ~50,560 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 24 file(s) not represented in the graph (top: .css 8, .bat 4, .example 2)

## Summary
- 678 nodes · 1948 edges · 26 communities (15 shown, 11 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 144 edges (avg confidence: 0.94)
- Token cost: 1,250 input · 850 output

## Community Hubs (Navigation)
- Alert & Notification Management
- Frontend UI Icons & Visual Assets
- React Dashboard Workspaces & Inspection Views
- Scala 3 & Pekko Telemetry Stream Engine
- User Authentication & Profile Security
- Structural Inspection Management & History
- Pydantic Data Contracts & Defect Schemas
- Frontend Dependencies & Node Modules
- Client Routing & Application State
- Machine Learning Crack Metrology Engine
- MongoDB Persistence & Secondary Database
- FastAPI Application Core & Health Endpoints
- Cloud Deployment & Render Blueprints
- Configuration & Environment Settings
- Application Lifespan & Database Seeding
- HTTP Middleware & Exception Handling
- Oxlint Code Quality & Linter Rules
- Live ngrok Tunneling & Field Teleoperation
- Database Connection & Settings URI
- Unix Generic Service Runner
- Production Build Automation
- Backend Service Runner
- Scala Stream Service Runner
- Tunnel Service Runner

## God Nodes (most connected - your core abstractions)
1. `cx()` - 60 edges
2. `UiKit()` - 55 edges
3. `react` - 47 edges
4. `simulate_rover_scan()` - 29 edges
5. `test_full_workflow()` - 27 edges
6. `Defect` - 25 edges
7. `Badge()` - 25 edges
8. `Button` - 24 edges
9. `HealthResult` - 23 edges
10. `Inspection` - 23 edges

## Surprising Connections (you probably didn't know these)
- `Scala 3 Pekko Telemetry Stream Engine` --implements--> `Main`  [EXTRACTED]
  README.md → scala-telemetry-service/src/main/scala/agile/rover/Main.scala
- `Scala 3 Pekko Telemetry Stream Engine` --calls--> `Sliding Window Telemetry Analytics`  [EXTRACTED]
  README.md → scala-telemetry-service/src/main/scala/agile/rover/analytics/StreamAnalytics.scala
- `Agile Rover Architecture Specification` --references--> `3-Tab Consolidated Dashboard`  [EXTRACTED]
  README.md → frontend/src/pages/Dashboard.jsx
- `get_dashboard_overview()` --uses--> `Rover`  [INFERRED]
  backend/app/api/dashboard_routes.py → backend/app/models/rover.py
- `get_dashboard_overview()` --uses--> `RoverService`  [INFERRED]
  backend/app/api/dashboard_routes.py → backend/app/services/rover_service.py

## Import Cycles
- None detected.

## Communities (26 total, 11 thin omitted)

### Community 0 - "Alert & Notification Management"
Cohesion: 0.06
Nodes (34): acknowledge_alert(), get_alerts(), get_dashboard_overview(), get_live_telemetry_pulse(), simulate_rover_scan(), get_defect(), get_defects_by_inspection(), get_inspection_images() (+26 more)

### Community 1 - "Frontend UI Icons & Visual Assets"
Cohesion: 0.05
Nodes (70): IconActivity(), IconAlert(), IconArrowLeft(), IconBattery(), IconCheck(), IconClock(), IconCompass(), IconCpu() (+62 more)

### Community 2 - "React Dashboard Workspaces & Inspection Views"
Cohesion: 0.12
Nodes (43): Slim Engineering Metric Ribbon, AlertsView(), CrackAnalysis(), DefectsExplorerTable(), DigitalMicroscopeLoupe(), HealthAndReportsView(), LiveInspection(), Navbar() (+35 more)

### Community 3 - "Scala 3 & Pekko Telemetry Stream Engine"
Cohesion: 0.05
Nodes (15): 3-Tab Consolidated Dashboard, Agile Rover Architecture Specification, Sliding Window Telemetry Analytics, TelemetryRoutes, Main, AggregatedTelemetry, AnomalyAlert, given Codec (+7 more)

### Community 4 - "User Authentication & Profile Security"
Cohesion: 0.09
Nodes (26): get_current_user_profile(), login(), logout(), register(), create_building(), create_wall(), get_buildings(), get_walls() (+18 more)

### Community 5 - "Structural Inspection Management & History"
Cohesion: 0.09
Nodes (20): get_inspection(), list_inspections(), start_inspection(), stop_inspection(), connect_rover(), get_rover_status(), update_telemetry(), Rover (+12 more)

### Community 6 - "Pydantic Data Contracts & Defect Schemas"
Cohesion: 0.07
Nodes (13): CrackDetectionResult, DefectResponse, Config, ImageDetailResponse, Config, ImageUploadResponse, RULPredictRequest, RULResponse (+5 more)

### Community 7 - "Frontend Dependencies & Node Modules"
Cohesion: 0.07
Nodes (34): dependencies, canvas-confetti@^1.9.4, lucide-react@^1.66.0, react@^19.2.8, react-dom@^19.2.8, recharts@^3.10.1, devDependencies, oxlint@^1.81.0 (+26 more)

### Community 8 - "Client Routing & Application State"
Cohesion: 0.13
Nodes (17): App(), readRoute(), AuthContext, AuthProvider(), defaultInspector, nextToastId(), notify(), TOAST_EVENT (+9 more)

### Community 10 - "MongoDB Persistence & Secondary Database"
Cohesion: 0.25
Nodes (6): ensure_mongo_indexes(), get_mongo_client(), get_mongo_db(), is_mongo_connected(), migrate_sqlite_to_mongodb(), parse_timestamp()

### Community 11 - "FastAPI Application Core & Health Endpoints"
Cohesion: 0.19
Nodes (5): database_status(), favicon(), health_check(), root(), serve_spa()

### Community 12 - "Cloud Deployment & Render Blueprints"
Cohesion: 0.17
Nodes (11): key, value, services, buildCommand, env, envVars, name, plan (+3 more)

### Community 14 - "Application Lifespan & Database Seeding"
Cohesion: 0.22
Nodes (4): lifespan(), seed_initial_data(), seed_mongo_data(), migrate_sqlite_to_mysql()

### Community 15 - "HTTP Middleware & Exception Handling"
Cohesion: 0.29
Nodes (3): add_process_time_and_log(), custom_global_exception_handler(), custom_http_exception_handler()

### Community 17 - "Oxlint Code Quality & Linter Rules"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

## Knowledge Gaps
- **2 isolated node(s):** `Sliding Window Telemetry Analytics`, `Slim Engineering Metric Ribbon`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 199 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Dashboard()` connect `React Dashboard Workspaces & Inspection Views` to `Client Routing & Application State`, `Frontend UI Icons & Visual Assets`, `Scala 3 & Pekko Telemetry Stream Engine`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 16 inferred relationships involving `simulate_rover_scan()` (e.g. with `Building` and `Defect`) actually correct?**
  _`simulate_rover_scan()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Sliding Window Telemetry Analytics`, `Slim Engineering Metric Ribbon` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Alert & Notification Management` be split into smaller, more focused modules?**
  _Cohesion score 0.06148459383753501 - nodes in this community are weakly interconnected._
- **Why does `3-Tab Consolidated Dashboard` connect `Scala 3 & Pekko Telemetry Stream Engine` to `React Dashboard Workspaces & Inspection Views`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Should `Frontend UI Icons & Visual Assets` be split into smaller, more focused modules?**
  _Cohesion score 0.05084745762711865 - nodes in this community are weakly interconnected._
- **Should `React Dashboard Workspaces & Inspection Views` be split into smaller, more focused modules?**
  _Cohesion score 0.12021857923497267 - nodes in this community are weakly interconnected._