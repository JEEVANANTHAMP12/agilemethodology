# Project Analysis — Agile Rover Structural Health Platform

## 1. Executive summary

The repository implements an end-to-end structural inspection platform:

- An ESP32-CAM crawler captures concrete-wall imagery and telemetry.
- A FastAPI backend exposes rover, inspection, image, SHI, RUL, alert, report, and dashboard APIs.
- An OpenCV workflow measures crack geometry in millimetres and produces annotated/heatmap outputs.
- A SHI engine converts crack, age, environmental, and historical signals into a 0–100 index.
- A RUL predictor extrapolates degradation to a 40-point failure threshold.
- A React 19 + Vite dashboard presents live telemetry, crack metrology, health decomposition, prognosis, alerts, and printable dossiers.

The frontend has been upgraded with **Agile UI**, a dependency-free, token-driven component and chart library under `frontend/src/ui/`.

---

## 2. Repository map

```
agile/
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI route modules
│   │   ├── core/           # security and dependencies
│   │   ├── models/         # SQLAlchemy ORM entities
│   │   ├── schemas/        # Pydantic request/response contracts
│   │   ├── services/       # CV, SHI, RUL, alerts, reports, rover
│   │   ├── config.py       # environment and path settings
│   │   ├── database.py     # MySQL-first engine with SQLite fallback
│   │   └── main.py         # FastAPI app, CORS, static mounts
│   ├── tests/              # workflow and API tests
│   └── structural_rover.db # local SQLite fallback database
├── firmware/
│   └── esp32_cam_rover/    # ESP32-CAM capture and upload sketch
├── frontend/
│   └── src/
│       ├── components/     # dashboard feature panels
│       ├── pages/          # Dashboard and UI Kit showcase
│       ├── services/       # typed-ish fetch wrapper
│       ├── ui/             # Agile UI library
│       ├── App.jsx         # providers + hash routing
│       ├── index.css       # legacy global styles/tokens
│       └── tokens.js       # theme-aware JS token facade
├── docs/                   # this analysis and UI library docs
├── render.yaml             # Render blueprint
└── build.sh                # production build script
```

---

## 3. Backend architecture

### 3.1 Application entry point

`backend/app/main.py` creates the FastAPI app, configures CORS, mounts API routers, serves processed/uploaded image files, and initializes the database. The database layer in `backend/app/database.py` attempts MySQL first, then falls back to SQLite so local development works without infrastructure.

### 3.2 API surface

| Area | Routes |
| --- | --- |
| Dashboard | `GET /api/dashboard/overview`, `POST /api/dashboard/simulate-scan`, `GET /api/dashboard/live-pulse` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Rover | `POST /api/rover/connect`, `GET /api/rover/status`, `POST /api/rover/telemetry` |
| Inspection | `POST /api/inspection/start`, `POST /api/inspection/stop`, `GET /api/inspection/list`, `GET /api/inspection/{id}` |
| Images / CV | `POST /api/images/upload`, `POST /api/images/predict-crack`, `GET /api/images/ml-info`, file and inspection endpoints |
| Defects | `GET /api/defects/inspection/{id}`, `GET /api/defects/{id}` |
| SHI | `POST /api/shi/evaluate/{inspection_id}`, `GET /api/shi/inspection/{inspection_id}` |
| RUL | `POST /api/rul/predict/{inspection_id}`, `GET /api/rul/inspection/{inspection_id}` |
| Alerts | `GET /api/alerts`, `POST /api/alerts/{id}/ack` |
| Reports | `GET /api/reports/inspection/{id}`, `GET /api/reports/inspection/{id}/html` |
| Structures | building and wall list/create endpoints |

### 3.3 Core processing workflow

1. **Capture** — the rover uploads an image plus standoff distance and environmental telemetry.
2. **Preprocess** — grayscale, CLAHE, bilateral denoising.
3. **Crack extraction** — multi-scale black-hat morphology, ridge/tubularity analysis, contour extraction.
4. **Metric calibration** — pixel-to-millimetre conversion using standoff distance; Euclidean distance transform measures aperture.
5. **Classification** — `LOW`, `MODERATE`, `HIGH`, `CRITICAL` from width and length thresholds.
6. **SHI evaluation** — crack penalty (50%), age (20%), environmental (15%), history (15%); score clamped to 0–100.
7. **RUL prognosis** — regression/extrapolation to the 40-point critical threshold; outputs years, annual rate, trend, risk, confidence.
8. **Alerting** — severity, low-SHI, and short-RUL rules create actionable alerts.
9. **Reporting** — JSON and printable HTML dossiers.

### 3.4 Dashboard contract

`GET /api/dashboard/overview` is the frontend's primary data source. It returns:

- `top_cards` — rover status/code, battery, RSSI, SHI, wall status, RUL, trend, risk.
- `live_inspection` — active state, inspection ID/code/status, wall name, temperature, humidity, tilt, vibration.
- `crack_analysis` — image URLs, defect count, primary severity/length/width, confidence, ACI flag, model version, defect array.
- `health_analysis` — SHI, status, crack/age/environment penalties, historical trend.
- `prediction` — current SHI, trend, RUL, risk, model name.
- `alerts` — ID, type, severity, title, message, acknowledgement state, timestamp.

The frontend tolerates missing values with defaults, which is important because the dashboard can render before a first inspection exists.

---

## 4. Frontend architecture

### 4.1 Routing and providers

`frontend/src/App.jsx` uses lightweight hash routing:

- `#/` → Dashboard
- `#/ui-kit` → UI Kit showcase

Provider order is `ThemeProvider` → `ToastProvider` → `AuthProvider` → route content.

### 4.2 Dashboard modules

`frontend/src/pages/Dashboard.jsx` polls `api.dashboard.getOverview()` at a configurable rate (1 s, 3 s, 5 s, or paused), supports manual sync and synthetic scans, and exposes six modules:

1. Live Inspection
2. Crack Metrology
3. Structural Health
4. RUL Prognosis
5. Hazards & Alerts
6. Dossier Reports

### 4.3 Theme system

The legacy CSS in `frontend/src/index.css` still defines the original palette. The new token layer in `frontend/src/ui/styles/tokens.css` is imported **after** it, so the UI library tokens win. `ThemeProvider` persists the theme in `localStorage` under `rover_ui_theme` and sets `data-theme` on `<html>`.

`frontend/src/tokens.js` now maps `DesignTokens` access to CSS custom properties, so existing components stay compatible while becoming theme-aware.

---

## 5. Quality audit — defects found

The audit found concrete issues rather than cosmetic preferences:

1. **Undefined CSS variables** — several components referenced `--border-subtle`, `--pastel-orange`, `--pastel-purple`, `--pastel-red`, and `--primary` without definitions.
2. **Light-only hardcoded colours** — `PredictionView.jsx`, `CrackAnalysis.jsx`, `HealthAnalysis.jsx`, and `ReportsView.jsx` used literals such as `#FBFBFA`, `#EAEAEA`, `#111111`, `#787774`, and white surfaces. These broke dark-mode contrast and made the theme toggle inconsistent.
3. **No reusable UI API** — primitives were embedded in a single `Components.jsx`; 651 inline `style` occurrences and duplicated SVG chart code made the interface hard to extend.
4. **Native `alert()` calls** — five components used blocking browser alerts for errors and validation.
5. **Dead Vite boilerplate** — `frontend/src/App.css` was unused.
6. **Encoding drift** — some visible strings contained replacement/mojibake characters.
7. **Duplicated chart implementations** — the health and prediction panels each hand-rolled SVG axes, grids, tooltips, and splines.

---

## 6. Remediation completed

### 6.1 Agile UI library

Created a dependency-free library under `frontend/src/ui/`:

- Token styles: `styles/tokens.css`, `styles/base.css`, `styles/components.css`, `styles/charts.css`.
- Primitives: Button, Card, Badge, Input/Select/Textarea, Checkbox/Switch, Modal, Tabs/SegmentedControl, DataTable, Progress, Tooltip, Toast, Skeleton, EmptyState, Stat, SectionHeader/PageHeader, Alert, Spinner, Kbd, Avatar, Divider, Chip, Metric.
- Charts: Sparkline, LineChart, BarChart, RadialGauge, LevelMeter.
- Providers: ThemeProvider, ToastProvider.
- Utilities: `cx`, `clamp`, `formatNumber`, `useAnimatedNumber`.
- Backward-compatible facade: `frontend/src/components/UI/Components.jsx` re-exports the new primitives, so existing imports keep working.

### 6.2 Application integration

- `Navbar.jsx` rebuilt on the library's navigation primitives and token classes.
- `Dashboard.jsx` rebuilt with `PageHeader`, `SegmentedControl`, `Alert`, `Spinner`, and library buttons; theme now comes from `useTheme()`.
- `TopCards.jsx` rebuilt with `Card`, `Badge`, `RadialGauge`, and `LevelMeter`.
- `AlertsView.jsx` rebuilt with `Card`, `Badge`, `Button`, `Checkbox`, `EmptyState`, and toast feedback.
- `PredictionView`, `CrackAnalysis`, `HealthAnalysis`, `ReportsView`, `LiveInspection`, `DefectsExplorerTable`, `WhatIfScenarioSimulator`, `RoverTeleopPad`, and `DigitalMicroscopeLoupe` now use theme-aware tokens for previously hardcoded colours.
- `alert()` calls were replaced with non-blocking toasts.
- The UI Kit is reachable at `#/ui-kit` and linked from the navbar and dashboard footer.

### 6.3 Verification

- `npm run build` succeeds with Vite 8.
- `npm run lint` reports warnings only (no errors).
- The UI Kit renders in the dev server with the expected components and token-driven theme.

---

## 7. Remaining recommendations

1. **Extract feature state** — `Dashboard.jsx` still owns polling, audio, and scan simulation. Move these into hooks (`useDashboardTelemetry`, `useAcousticFeedback`) as the feature set grows.
2. **Finish chart migration** — several panels still contain bespoke SVG markup. Replace them incrementally with `LineChart`, `BarChart`, and `RadialGauge` to reduce maintenance cost.
3. **Remove legacy CSS** — once all feature panels are migrated, retire the duplicated `:root` and `[data-theme="light"]` blocks in `frontend/src/index.css`.
4. **Add component tests** — the library has no tests yet. Vitest + Testing Library would cover focus management, modal trapping, toast timing, and table sorting.
5. **Split provider exports** — the React Fast Refresh lint warnings come from exporting hooks beside provider components. Move hooks into separate modules if hot reload becomes noisy.
6. **Normalize encoding** — run a project-wide encoding check and fix the remaining replacement characters in untouched strings.
7. **Harden API error states** — the dashboard currently degrades to defaults when the API is unavailable. Add an explicit offline banner and retry control.

---

## 8. How to run

```bash
# Backend
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Frontend
cd frontend
npm install
npm run dev
```

- Dashboard: `http://localhost:5173/`
- UI Kit: `http://localhost:5173/#/ui-kit`
- Swagger: `http://localhost:8000/docs`
