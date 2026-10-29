# Graph Report - agile  (2026-10-28)

## Corpus Check
- Corpus is ~46,048 words - fits in a single context window. You may not need a graph.

## Summary
- 568 nodes · 1880 edges · 22 communities (15 shown, 7 thin omitted)
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 142 edges (avg confidence: 0.94)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend API & Domain Services
- Dashboard Feature Panels
- Agile UI Library
- React Shell & Providers
- Pydantic API Schemas
- Frontend Package Manifest
- API Tests & Error Handling
- Authentication & Security
- ML Crack Classifier
- Inspection Lifecycle API
- Building & Wall APIs
- Rover Telemetry API
- Render Deployment Config
- OpenCV Crack Detector
- Report Generation
- FastAPI App Shell
- Lint Configuration
- Alert Acknowledgement API
- Image File Serving
- Runtime Settings
- Database Bootstrap
- Production Build Script

## God Nodes (most connected - your core abstractions)
1. `cx()` - 58 edges
2. `UiKit()` - 54 edges
3. `react` - 46 edges
4. `Badge()` - 30 edges
5. `Dashboard()` - 28 edges
6. `simulate_rover_scan()` - 27 edges
7. `test_full_workflow()` - 27 edges
8. `Defect` - 25 edges
9. `HealthResult` - 23 edges
10. `Inspection` - 23 edges

## Surprising Connections (you probably didn't know these)
- `get_alerts()` --uses--> `Alert`  [INFERRED]
  backend/app/api/alert_routes.py → backend/app/models/alert.py
- `acknowledge_alert()` --uses--> `Alert`  [INFERRED]
  backend/app/api/alert_routes.py → backend/app/models/alert.py
- `register()` --uses--> `User`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/user.py
- `login()` --uses--> `User`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/user.py
- `get_current_user_profile()` --uses--> `User`  [INFERRED]
  backend/app/api/auth_routes.py → backend/app/models/user.py

## Import Cycles
- None detected.

## Communities (22 total, 7 thin omitted)

### Community 0 - "Backend API & Domain Services"
Cohesion: 0.06
Nodes (35): get_dashboard_overview(), get_live_telemetry_pulse(), simulate_rover_scan(), get_defect(), get_defects_by_inspection(), get_inspection_images(), predict_wall_crack_by_photo(), upload_inspection_image() (+27 more)

### Community 1 - "Dashboard Feature Panels"
Cohesion: 0.09
Nodes (78): AlertsView(), CrackAnalysis(), DefectsExplorerTable(), DigitalMicroscopeLoupe(), HealthAnalysis(), LiveInspection(), Navbar(), PredictionView() (+70 more)

### Community 2 - "Agile UI Library"
Cohesion: 0.09
Nodes (42): BarChart(), LevelMeter(), DEFAULT_PALETTE, LineChart(), normalizeSeries(), buildAreaPath(), buildBandPath(), buildSplinePath() (+34 more)

### Community 3 - "React Shell & Providers"
Cohesion: 0.13
Nodes (17): App(), readRoute(), AuthContext, AuthProvider(), defaultInspector, nextToastId(), notify(), TOAST_EVENT (+9 more)

### Community 4 - "Pydantic API Schemas"
Cohesion: 0.10
Nodes (15): AlertAckRequest, AlertResponse, Config, CrackDetectionResult, DefectResponse, Config, ImageDetailResponse, Config (+7 more)

### Community 5 - "Frontend Package Manifest"
Cohesion: 0.10
Nodes (24): dependencies, react@^19.2.8, react-dom@^19.2.8, devDependencies, oxlint@^1.81.0, @types/react@^19.2.18, @types/react-dom@^19.2.7, vite@^8.3.0 (+16 more)

### Community 6 - "API Tests & Error Handling"
Cohesion: 0.09
Nodes (5): add_process_time_and_log(), custom_global_exception_handler(), custom_http_exception_handler(), run_e2e_test(), start_tunnel()

### Community 7 - "Authentication & Security"
Cohesion: 0.19
Nodes (12): get_current_user_profile(), login(), logout(), register(), create_access_token(), hash_password(), verify_password(), TokenResponse (+4 more)

### Community 9 - "Inspection Lifecycle API"
Cohesion: 0.24
Nodes (8): get_inspection(), list_inspections(), start_inspection(), stop_inspection(), InspectionResponse, Config, InspectionStartRequest, InspectionStopRequest

### Community 10 - "Building & Wall APIs"
Cohesion: 0.24
Nodes (10): create_building(), create_wall(), get_buildings(), get_walls(), BuildingCreate, BuildingResponse, Config, WallCreate (+2 more)

### Community 11 - "Rover Telemetry API"
Cohesion: 0.21
Nodes (7): connect_rover(), get_rover_status(), update_telemetry(), RoverConnectRequest, RoverStatusResponse, Config, RoverTelemetryUpdate

### Community 12 - "Render Deployment Config"
Cohesion: 0.17
Nodes (11): key, value, services, buildCommand, env, envVars, name, plan (+3 more)

### Community 15 - "FastAPI App Shell"
Cohesion: 0.29
Nodes (4): favicon(), health_check(), root(), serve_spa()

### Community 16 - "Lint Configuration"
Cohesion: 0.33
Nodes (5): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema

### Community 18 - "Image File Serving"
Cohesion: 0.40
Nodes (3): get_ml_model_metadata(), get_original_file(), get_processed_file()

## Knowledge Gaps
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Agile UI Library` to `Dashboard Feature Panels`, `React Shell & Providers`, `Frontend Package Manifest`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **Should `Backend API & Domain Services` be split into smaller, more focused modules?**
  _Cohesion score 0.055938467685545896 - nodes in this community are weakly interconnected._
- **Why does `MLCrackModel` connect `ML Crack Classifier` to `Backend API & Domain Services`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `Dashboard Feature Panels` be split into smaller, more focused modules?**
  _Cohesion score 0.08607169529499627 - nodes in this community are weakly interconnected._
- **Why does `simulate_rover_scan()` connect `Backend API & Domain Services` to `Inspection Lifecycle API`, `OpenCV Crack Detector`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Should `Agile UI Library` be split into smaller, more focused modules?**
  _Cohesion score 0.09362279511533243 - nodes in this community are weakly interconnected._
- **Should `React Shell & Providers` be split into smaller, more focused modules?**
  _Cohesion score 0.12535612535612536 - nodes in this community are weakly interconnected._