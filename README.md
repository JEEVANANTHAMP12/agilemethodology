# Structural Health & Crack Detection Rover System

An end-to-end autonomous structural inspection platform integrating an **ESP32 Crawler Rover**, **OpenCV Computer Vision Crack Detection & Metric Profiling**, **Structural Health Index (SHI) Multi-Criteria Evaluation**, **Remaining Useful Life (RUL) Predictive Deterioration Extrapolation**, and a **Modern Real-Time Engineering Dashboard**.

---

## Software Architecture

```
              ROVER (ESP32-CAM)
                    ↓
            IMAGE / TELEMETRY CAPTURE
                    ↓
              REST API / Wi-Fi
                    ↓
        ┌───────────────────────┐
        │    FASTAPI BACKEND    │
        └───────────┬───────────┘
                    ↓
        ┌───────────────────────┐
        │   OPENCV CV ENGINE    │
        │   • Black-Hat Morph   │
        │   • CLAHE Enhancement │
        │   • Distance Trans.   │
        │   • mm Calibration    │
        └───────────┬───────────┘
                    ↓
            HEALTH ASSESSMENT
                    ↓
             SHI SCORE (0-100)
                    ↓
             RUL PREDICTION
                    ↓
           SQL DATABASE (ORM)
                    ↓
       ┌────────────────────────┐
       │   REACT UI DASHBOARD   │
       │   • Live Rover Telemetry│
       │   • Side-by-Side Images│
       │   • Degradation Charts │
       │   • Safety Alerts      │
       │   • Printable Dossiers │
       └────────────────────────┘
```

---

## Key Modules Built

### 1. Database & ORM (Phase 2 & MySQL Integration)
- **Primary Engine**: MySQL 8.0 with SQLAlchemy 2.0 ORM and PyMySQL driver
- **Connection Pooling**: `pool_size=10`, `pool_recycle=3600`, `pool_pre_ping=True`
- **Auto-Initialization**: Automatic schema and database creation (`ensure_mysql_database`)
- **Graceful Fallback**: Automatically falls back to SQLite if MySQL is offline or not configured
- **Data Migration**: Built-in automated migrator (`python backend/migrate_to_mysql.py`)
- **Relationship Pipeline**:
  `USER` → `BUILDING` → `WALL` → `INSPECTION` → `IMAGE` → `DEFECT` → `HEALTH_RESULT` → `RUL_PREDICTION` → `ALERT`

### 2. User Management & Authentication (Phase 3)
- Stateless JWT authentication (`HS256`)
- Direct bcrypt password hashing
- Session persistence in React frontend with protected dashboard routing
- Default Inspector user: `inspector` / `admin123`

### 3. ESP32 Wi-Fi Rover Integration (Phase 4)
- `POST /api/rover/connect`: Wi-Fi registration & handshake
- `GET  /api/rover/status`: Real-time RSSI, battery, and state feedback
- `POST /api/inspection/start`: Initializes autonomous scan lifecycle
- `POST /api/inspection/stop`: Finalizes scan run
- `POST /api/images/upload`: Receives camera frame + standoff distance + environmental telemetry

### 4. Computer Vision Crack Detection & Profiling (Phase 5)
- **Preprocessing**: Grayscale conversion, CLAHE contrast equalization, bilateral denoising.
- **Ridge Extraction**: Multi-scale Black-Hat morphology specifically engineered for elongated concrete fissures.
- **Sub-Pixel Metric Profiling**: Euclidean distance transform measuring maximum and average aperture in millimeters based on standoff distance calibration.
- **Classification**:
  - `LOW`: Width < 0.5 mm, Length < 50 mm (Hairline)
  - `MODERATE`: 0.5 mm ≤ Width < 2.0 mm
  - `HIGH`: 2.0 mm ≤ Width < 5.0 mm
  - `CRITICAL`: Width ≥ 5.0 mm or Length ≥ 300 mm
- **Visual Annotation HUD**: Glowing translucent heatmask, bounding box, dimension badges, and engineering HUD overlay.

### 5. Structural Health Index (SHI) Engine (Phase 6)
- Multi-parameter normalization:
  - Crack Severity & Dimensions: up to 50% penalty
  - Building Age & Structural Typology: up to 20% penalty
  - Rover Environmental Telemetry (Temp, Humidity, Tilt, Vibration): up to 15% penalty
  - Historical Progression: up to 15% penalty
- Initial Project Classification:
  - `80 – 100`: **Healthy**
  - `50 – 79`: **Moderate**
  - `0 – 49`: **Critical**

### 6. Remaining Useful Life (RUL) Prediction (Phase 7)
- Trend-based deterioration extrapolation using historical inspection gradient.
- Critical failure limit: 40 SHI points.
- Outputs estimated years, annual degradation rate, deterioration trend (`Stable`, `Increasing`, `Accelerating`), and risk level.

### 7. Modern Dashboard (Phase 8)
- Built on **Agile UI**, an in-repo, dependency-free design system with dark/light semantic tokens, reusable primitives, and SVG chart components.
- **Top Cards**: Rover Status, Health Index, Wall Status, Predicted RUL.
- **Live Inspection Panel**: Start/stop controls, telemetry gauges, manual image uploader, and hardware-in-the-loop scan simulator.
- **Crack Analysis Panel**: Side-by-side raw vs. processed image viewer, metrics summary, and contour breakdown table.
- **Health Analysis Panel**: Circular SVG health gauge, penalty deduction breakdown, and historical progression bar chart.
- **Prediction Panel**: Multi-year prognostic trajectory forecasting structural degradation curve.
- **Alerts Feed**: Safety alerts with one-click acknowledgement.

### 8. Reports & Alerts Engine (Phase 9)
- Automated safety rules:
  - Crack severity `HIGH` or `CRITICAL` → Critical Crack Alert
  - Significant SHI drop (< 50) → Health Warning
  - Low predicted RUL (< 10 yrs) → Maintenance Mandated Alert
- Generates downloadable and printable HTML / PDF engineering dossiers (`/api/reports/inspection/{id}/html`).

### 9. Agile UI Library & UI Kit (Phase 10)
- **Token-driven design system** at `frontend/src/ui/` with primitive, semantic, and component layers.
- **Dark cockpit / light editorial themes** persisted under `rover_ui_theme` and exposed through `useTheme()`.
- **Reusable primitives**: Button, Card, Badge, Input/Select/Textarea, Checkbox/Switch, Modal, Tabs/SegmentedControl, DataTable, Progress, Tooltip, Toast, Skeleton, EmptyState, Stat, PageHeader, Alert, Spinner, Kbd, Avatar, Divider, Chip, Metric.
- **Data visualisation**: Sparkline, LineChart, BarChart, RadialGauge, LevelMeter.
- **Backward compatibility**: `components/UI/Components.jsx` re-exports the new library, so existing feature panels migrate incrementally.
- **Interactive showcase**: open [`http://localhost:5173/#/ui-kit`](http://localhost:5173/#/ui-kit) while the frontend is running.
- **Documentation**: [Project analysis](docs/PROJECT_ANALYSIS.md) · [UI library reference](docs/UI_LIBRARY.md).

### 10. Knowledge Graph
- A code-only graphify graph covers the FastAPI backend, React frontend, UI library, tests, firmware, and deployment config.
- **Outputs**:
  - `graphify-out/graph.html` — self-contained interactive graph (open directly in a browser).
  - `graphify-out/graph.json` — GraphRAG-ready nodes, edges, and community labels.
  - `graphify-out/GRAPH_REPORT.md` — God Nodes, surprising connections, communities, and suggested questions.
- The corpus intentionally excludes `node_modules`, build output, stored inspection images, docs, and generated graph artifacts.

---

## Running the Application

### 1. Instant Direct Access (No Login Barrier)
- The application bypasses login and registration requirements. Opening the web client or server lands directly on the live **Autonomous Structural Health & Crack Metrology Dashboard** with full operator privileges.

### 2. Local Full-Stack Development
```bash
# Terminal 1 - Backend (FastAPI):
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend (React + Vite):
cd frontend
npm install
npm run dev
```
- Dashboard UI: [http://localhost:5173/](http://localhost:5173/)
- UI Kit showcase: [http://localhost:5173/#/ui-kit](http://localhost:5173/#/ui-kit)
- Swagger API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🌐 Live Real-Time Operations: ngrok & Render

### Method A: Live Real-Time Tunneling with ngrok
To connect a physical ESP32-CAM crawler over Wi-Fi or cellular from anywhere in the world to your local machine:
```bash
# 1. Start your local backend on port 8000:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 2. In another terminal, launch the live tunnel:
python tunnel_rover.py 8000
# (Or double-click run_tunnel.bat)
```
- **Output:** Provides a public secure URL such as `https://<subdomain>.ngrok-free.app`.
- **Rover Config:** Set `BACKEND_HOST = "https://<subdomain>.ngrok-free.app"` in `firmware/esp32_cam_rover/esp32_cam_rover.ino`.
- **Live Stream:** Frames captured by the ESP32 camera are uploaded in real-time, processed with OpenCV, and visualized live on the web console.

### Method B: 24/7 Cloud Deployment on Render
Deploy the complete unified system (FastAPI backend + React frontend) to [Render](https://render.com) for free:
1. Push your repository to **GitHub**.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New +** -> **Blueprint**.
3. Select this repository. Render automatically reads `render.yaml` and executes `bash build.sh`.
4. Render provisions a 24/7 HTTPS live URL:
   - `https://<your-service>.onrender.com/` (Live Web Dashboard)
   - `https://<your-service>.onrender.com/docs` (Swagger REST API)
5. Set `BACKEND_HOST = "https://<your-service>.onrender.com"` in `firmware/esp32_cam_rover/esp32_cam_rover.ino`.

---

## Running Verification Tests
```bash
# Internal workflow test:
python backend/tests/test_workflow.py

# End-to-end API pipeline test:
python test_e2e_api.py
```
