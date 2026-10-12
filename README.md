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

### 1. Database & ORM (Phase 2)
The database structure establishes the required engineering relationship flow:
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
- Authored with intentional design tokens from the **AI UI Library** (`#2563EB`, `#7C3AED`, `#06B6D4`, `#10B981`, `#EF4444`).
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

---

## Running the Application

### Backend (FastAPI)
```bash
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation available at: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Access the application dashboard at: [http://127.0.0.1:5173/](http://127.0.0.1:5173/)

### Running Verification Tests
```bash
# Internal workflow test:
python backend/tests/test_workflow.py

# End-to-end API pipeline test:
python test_e2e_api.py
```

### Default Credentials
- **Username:** `inspector`
- **Password:** `admin123`
*(Or click "Autofill Default Credentials" on the login screen)*
