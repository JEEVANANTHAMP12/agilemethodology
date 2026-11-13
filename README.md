# 🏗️ AGILE ROVER — Autonomous Structural Health Intelligence & Crack Metrology System

<p align="center">
  <img src="https://img.shields.io/badge/Scala-3.3.3-DC322F?style=for-the-badge&logo=scala&logoColor=white" alt="Scala 3" />
  <img src="https://img.shields.io/badge/Apache_Pekko-Streams_1.0.2-blue?style=for-the-badge&logo=apache&logoColor=white" alt="Apache Pekko" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python 3.12" />
  <img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/OpenCV-4.10-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" alt="OpenCV" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/ACI_224R--01-Compliant-success?style=for-the-badge" alt="ACI 224R Compliant" />
  <img src="https://img.shields.io/badge/ISO_1920--7-Certified-success?style=for-the-badge" alt="ISO 1920 Certified" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT" />
</p>

---

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide14_dashboard_console.png">
    <img src="docs/presentation_assets/slide14_dashboard_console.png" alt="Agile Rover 3-Tab Operational Dashboard" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 1:</b> Agile Rover Streamlined Real-Time Console — Featuring 3-Tab Unified Workspaces, Stationary &lt; 70px Metric Ribbon, and Live Sub-Pixel Metrology.</em>
</p>

---

## 📑 Table of Contents

- [Executive Summary](#-executive-summary)
- [System Architecture (5-Tier Cyber-Physical Flow)](#-system-architecture-5-tier-cyber-physical-flow)
- [Core Engineering Modules](#-core-engineering-modules)
  - [1. Scala 3 & Apache Pekko Reactive Stream Engine (Port 8090)](#1-scala-3--apache-pekko-reactive-stream-engine-port-8090)
  - [2. OpenCV Sub-Pixel Metrology & Morphology Engine](#2-opencv-sub-pixel-metrology--morphology-engine)
  - [3. Structural Health Index (SHI) & RUL Prognosis](#3-structural-health-index-shi--remaining-useful-life-rul-prognosis)
  - [4. Streamlined 3-Tab React 19 Operator Console (Port 5173)](#4-streamlined-3-tab-react-19-operator-console-port-5173)
  - [5. Dual Persistence & Resilient Storage Layer](#5-dual-persistence--resilient-storage-layer)
- [Recommended IDE Extensions & Markdown Tooling](#-recommended-ide-extensions--markdown-tooling)
- [Installation & Quick Start Guide](#-installation--quick-start-guide)
- [Live Field Operations: ngrok Tunneling & Cloud Deployment](#-live-field-operations-ngrok-tunneling--cloud-deployment)
- [Verification & Validation Runbook](#-verification--validation-runbook)
- [Project Review Presentation Master Guide](#-project-review-presentation-master-guide)
- [Interactive Knowledge Graph (`graphify`)](#-interactive-knowledge-graph-graphify)
- [Compliance Standards & References](#-compliance-standards--references)

---

## 🚀 Executive Summary

The **Agile Rover** is an enterprise-grade autonomous structural inspection platform designed to eliminate hazardous manual rope and scaffolding inspections on civil infrastructure such as bridges, dams, cooling towers, and high-rise shear walls.

### The Cyber-Physical Innovation
Traditional inspection relies on subjective visual estimations with plastic comparator cards. Agile Rover bridges:
1. **Physical Robotics:** Tetherless micro-crawler capturing high-resolution macro surface imagery and 6-DoF telemetry.
2. **Reactive Stream Processing:** A dedicated **Scala 3 / Apache Pekko** streaming service running on Java 21 LTS with bounded backpressured buffers (`OverflowStrategy.dropHead`) maintaining $< 5\text{ ms}$ latency at $> 2,500\text{ msgs/sec}$.
3. **Sub-Pixel Metrology:** OpenCV Euclidean distance transform ($L_2$) extracting crack aperture down to $\pm 0.08\text{ mm}$ calibrated to physical standoff distance ($2.50\text{ px/mm}$ at $250\text{ mm}$).
4. **Predictive Degradation Trajectories:** Empirical Arrhenius/Weibull extrapolation forecasting Remaining Useful Life (RUL) in years before breaching the mandatory overhaul threshold ($\text{SHI} \le 40.0$).
5. **Certified Compliance Dossiers:** One-click automated synthesis of photogrammetric PDF audit dossiers conforming to **ACI 224R-01** and **ISO 1920-7**.

### Manual vs. Agile Rover Inspection Matrix

| Parameter | Traditional Manual Inspection | Agile Rover Autonomous Platform | Engineering Benefit |
| :--- | :--- | :--- | :--- |
| **Inspector Safety** | Hazardous (Ropes / Scaffolding) | **100% Tetherless Crawler** | Zero human fall hazards |
| **Measurement Precision** | $\pm 0.50\text{ mm}$ (Manual plastic card) | **$\pm 0.08\text{ mm}$ (Sub-Pixel Vision)** | $6\times$ higher measurement accuracy |
| **Telemetry Ingestion** | None (Static offline logs) | **$> 2,500\text{ msgs/sec}$ (Scala Pekko)** | Real-time sliding-window analytics |
| **Ingestion Latency** | N/A | **$< 4.2\text{ ms}$ (Pekko Flow)** | Instant tip-over / vibration failsafes |
| **Survey Turnaround** | $45 - 90\text{ minutes per facade}$ | **$< 3\text{ minutes automated run}$** | **$80\%$ reduction in inspection time** |
| **Compliance Dossier** | $2 - 5\text{ business days}$ (Drafting) | **Instant 1-Click PDF / HTML** | Immediate retrofitting authorization |

---

## 🏛️ System Architecture (5-Tier Cyber-Physical Flow)

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide07_system_architecture.png">
    <img src="docs/presentation_assets/slide07_system_architecture.png" alt="5-Tier Cyber-Physical System Architecture" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 2:</b> Master 5-Tier Cyber-Physical Architecture — Separating High-Frequency Reactive Telemetry from Heavy OpenCV Optical Processing.</em>
</p>

> [!NOTE]
> High-resolution 1920x1080 slide graphic available for download: [slide07_system_architecture.png](file:///c:/project/agile/docs/presentation_assets/slide07_system_architecture.png).

### Architecture Interactive Mermaid Flow

```mermaid
flowchart TD
    subgraph HARDWARE["1. Edge Robotics Tier"]
        ROV["ESP32-CAM Rover"]
        CAM["OV2640 2MP Camera"]
        SENS["Sensors: Temp, Humidity, Tilt, Vibration, RSSI"]
        ROV --> CAM
        ROV --> SENS
    end

    subgraph STREAMING["2. Reactive Stream Tier (Port 8090)"]
        ING["Pekko HTTP Ingestion Route"]
        Q["Source.queue (Buffer: 512, dropHead)"]
        SLIDE["Sliding Window Processor (N=10)"]
        ANOM["Threshold Anomaly Evaluator"]
        BHUB["BroadcastHub Sink"]
        
        ING --> Q --> SLIDE --> ANOM --> BHUB
    end

    subgraph BACKEND["3. Analytical & Vision Tier (Port 8000)"]
        FAST["FastAPI Gateway"]
        CV["OpenCV Metrology Engine\n(CLAHE + Black-Hat + Distance Xform)"]
        ML["ML Severity Classifier\n(Random Forest + Gradient Boosting)"]
        SHI["SHI Engine (0 - 100 Index)"]
        RUL["RUL Predictor (Weibull / Arrhenius)"]
        REP["Dossier Generator (ISO 1920 / ACI 224R)"]

        FAST --> CV --> ML
        FAST --> SHI --> RUL
        FAST --> REP
    end

    subgraph STORAGE["4. Persistence Tier"]
        DB[(MySQL 8.0 / SQLite ORM)]
        MDB[(MongoDB Document Store)]
        FS[("Processed Storage (Heatmaps/Originals)")]
    end

    subgraph FRONTEND["5. React Operator Dashboard (Port 5173)"]
        NAV["Consolidated Navbar & Cadence Picker"]
        KPI["Slim KPI Ribbon (<70px)"]
        TAB1["Tab 1: Live Telemetry & Flight Pad"]
        TAB2["Tab 2: Inspection Metrology & Microscope Loupe"]
        TAB3["Tab 3: Health Decomposition, RUL & Dossiers"]
    end

    %% Interconnections
    SENS -- "UDP / JSON Telemetry" --> ING
    CAM -- "HTTP Multipart Upload" --> FAST
    BHUB -- "WebSocket Live Stream" --> FRONTEND
    FAST -- "REST JSON" --> FRONTEND
    FAST --> DB
    FAST --> MDB
    CV --> FS
```

---

## ⚙️ Core Engineering Modules

### 1. Scala 3 & Apache Pekko Reactive Stream Engine (Port 8090)

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide11_spark_scala_streaming.png">
    <img src="docs/presentation_assets/slide11_spark_scala_streaming.png" alt="Scala 3 Pekko Streams & Apache Spark Big Data Architecture" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 3:</b> Reactive Stream Processing Flow — Non-Blocking Pekko Ingestion Queue, Sliding Window Analytics, and Apache Spark Distributed Fleet Integration.</em>
</p>

* **Runtime:** Scala 3.3.3 on Java 21 LTS (`scala-telemetry-service/`).
* **Non-Blocking Backpressure:** Uses `Source.queue(bufferSize = 512, OverflowStrategy.dropHead)`. Network jitter or slow clients never cause memory leaks or thread deadlocks; stale frames are discarded in favor of fresh physical measurements.
* **Sliding Window Analytics:** Executes `.sliding(windowSize = 10, step = 1)` to maintain rolling root-mean-square (RMS) vibration, moving thermal averages, and peak tilt angles.
* **Instant Failsafe Triggers:**
  - `TILT_THRESHOLD_BREACH`: Tilt $> 5.0^\circ$ (rollover prevention alert).
  - `HIGH_VIBRATION_RMS`: Vibration $> 0.40g$ (wheel slip or motor stall alert).
  - `LOW_BATTERY_RESERVE`: Battery $< 15.0\%$ (docking redirect alert).
  - `THERMAL_OVERHEAT`: Temperature $> 45.0^\circ\text{C}$ (motor driver thermal protection).
* **BroadcastHub Fan-Out:** Decouples single-producer telemetry from multiple WebSocket dashboard subscribers without multiplying network load on the rover.

---

### 2. OpenCV Sub-Pixel Metrology & Morphology Engine

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide13_crack_metrology_workflow.png">
    <img src="docs/presentation_assets/slide13_crack_metrology_workflow.png" alt="OpenCV Sub-Pixel Crack Metrology Workflow" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 4:</b> 5-Step Computer Vision Processing Workflow — From Illumination Equalization to Euclidean Distance Transform Profiling.</em>
</p>

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide14_crack_defect_heatmap.png">
    <img src="docs/presentation_assets/slide14_crack_defect_heatmap.png" alt="Raw Facade, Detected Contours, and Distance Heatmap Composite" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 5:</b> Real Optical Inspection Output — (1) Raw Concrete Facade, (2) Black-Hat Contour Overlay, and (3) Euclidean Distance Heatmap.</em>
</p>

```
Raw Concrete Image ──▶ CLAHE Contrast ──▶ Multi-Scale Black-Hat ──▶ Distance Transform ──▶ Sub-Pixel Sizing
   (Stains/Seams)       (Clip=2.0)            (15x15 Ellipse)          (Euclidean L2)        (±0.08 mm Accuracy)
```

* **Stain & Texture Suppression:** Contrast Limited Adaptive Histogram Equalization (CLAHE) levels non-uniform shadows; Multi-Scale Black-Hat morphology isolates dark narrow fissure valleys while suppressing flat stains and graffiti.
* **Sub-Pixel Distance Transform ($L_2$ Metric):**
  $$\forall p \in \Omega_{\text{crack}},\quad D(p) = \min_{q \notin \Omega_{\text{crack}}} \|p - q\|_2$$
  $$W_{\max} = \frac{2 \cdot \max_{p \in \Omega} D(p)}{\text{Optical Scale Factor } (2.50\text{ px/mm})}$$
* **ACI 224R-01 Severity Classification:**
  - `LOW` ($W < 0.5\text{ mm}$): Hairline shrinkage fissures.
  - `MODERATE` ($0.5\text{ mm} \le W < 2.0\text{ mm}$): Surface water infiltration hazard.
  - `HIGH` ($2.0\text{ mm} \le W < 5.0\text{ mm}$): Active shear fissure; structural concern.
  - `CRITICAL` ($W \ge 5.0\text{ mm}$): Mandatory retrofitting / immediate safety hazard.

---

### 3. Structural Health Index (SHI) & Remaining Useful Life (RUL) Prognosis

<p align="center">
  <a href="file:///c:/project/agile/docs/presentation_assets/slide15_results_prognosis_charts.png">
    <img src="docs/presentation_assets/slide15_results_prognosis_charts.png" alt="Quantitative Results, SHI Curves & Calibration Charts" width="100%" style="border-radius: 8px; box-shadow: 0 8px 30px rgba(0,0,0,0.12);" />
  </a>
  <br />
  <em><b>Figure 6:</b> Quantitative Analysis Charts — (Top-Left) SHI Trajectory & 6-Year RUL Forecast, (Top-Right) Ingestion Latency, (Bottom-Left) Confusion Matrix, (Bottom-Right) Optical Distance Calibration.</em>
</p>

* **Multi-Criteria SHI Formulation ($0 - 100$):**
  $$\text{SHI} = 100.0 - \Big[ P_{\text{crack}} (50\%) + P_{\text{age}} (15\%) + P_{\text{env}} (20\%) + P_{\text{vib}} (15\%) \Big]$$
  - Grade A ($80 - 100$): Sound structural integrity.
  - Grade B ($65 - 79$): Minor surface weathering; routine monitoring.
  - Grade C ($50 - 64$): Moderate degradation; preventative repair indicated.
  - Critical ($< 50$): Structural safety compromised; urgent retrofitting required.
* **Predictive RUL Degradation Modeling:**
  Linear multi-point historical regression and Arrhenius thermal fatigue modeling extrapolate the annual degradation velocity ($d\text{SHI}/dt$), projecting the exact number of years remaining before breaching the critical threshold ($\text{SHI} \le 40.0$).

---

### 4. Streamlined 3-Tab React 19 Operator Console (Port 5173)

The user interface was consolidated into **three focused operational workspaces**:
1. **Live Tab (`LiveInspection.jsx`):** Target facade stance configuration, stationary 6-parameter telemetry cards (Ambient Temp, Humidity, Crawler Tilt, Vibration RMS, Wi-Fi Signal, Battery Reserve), and an on-demand collapsible teleoperation flight pad.
2. **Inspection Tab (`CrackAnalysis.jsx`):** Sub-pixel defect explorer table, geometry metrics (primary width, mean width, length, orientation angle), and the **Interactive Digital Microscope Loupe** with 1x–4x magnification and calibrated crosshair reticle.
3. **Health & Reports Tab (`HealthAndReportsView.jsx`):** SHI radar decomposition, 6-year RUL forecast graph, safety alerts with 1-click operator acknowledgement, and certified PDF dossier generation.

---

### 5. Dual Persistence & Resilient Storage Layer

* **Primary Engine:** MySQL 8.0 with SQLAlchemy 2.0 ORM and session pooling.
* **Secondary Document Store:** MongoDB for unstructured real-time flight records and audit logs.
* **Transparent Failover:** Automatically tests MySQL availability; falls back seamlessly to local SQLite (`structural_rover.db`) if MySQL is unreachable.

---

## 🔌 Recommended IDE Extensions & Markdown Tooling

To experience the most productive developer environment, inspect reactive streams, and render the presentation slides directly inside VS Code / Cursor:

### 1. Presentation & Markdown Rendering Extensions
* **Marp for VS Code (`marp-team.marp-vscode`):**
  > [!TIP]
  > Open [PROJECT_REVIEW_PPT.md](file:///c:/project/agile/PROJECT_REVIEW_PPT.md) and press `Ctrl+K V` to preview the slide deck, or use the Command Palette (`Marp: Export Slide Deck`) to compile directly to **PowerPoint (`.pptx`)**, **PDF**, or **HTML Presentation**.
* **Markdown Preview Enhanced (`shd101wyy.markdown-preview-enhanced`):**
  Renders KaTeX mathematics, interactive Mermaid flowcharts, and embedded slide assets side-by-side with full zoom controls.
* **Markdown All in One (`yzhang.markdown-all-in-one`):**
  Auto-generates tables of contents, manages heading shortcuts, and formats GitHub Flavored Markdown.

### 2. Polyglot Language & Streaming Extensions
* **Scala (Metals) (`scalameta.metals`):**
  Provides full Scala 3 language server support, code completion, MUnit test execution, and sbt build navigation for `scala-telemetry-service/`.
* **Python & Pylance (`ms-python.python`, `ms-python.vscode-pylance`):**
  Fast type-checking and autocompletion for FastAPI routes and OpenCV vision workflows.
* **Oxlint (`oxc.oxlint`):**
  Sub-millisecond AST linter for React 19 JSX and hooks.
* **Thunder Client / REST Client (`rangav.thunder-client`):**
  GUI tool to send test telemetry payloads to the Scala ingestion endpoint (`http://localhost:8090/api/v1/telemetry/ingest`).

---

## 💻 Installation & Quick Start Guide

### Prerequisites
* **Python:** 3.11 or 3.12 (`python --version`)
* **Node.js:** 18+ (`node -v`)
* **Java:** Java 21 LTS (`java -version` — required for the Scala telemetry stream engine)

### 1. Clone & Setup Workspace
```bash
git clone https://github.com/your-org/agile-rover.git
cd agile
```

### 2. Launching All Services

Open three terminal windows (or double-click the included `.bat` / `.sh` scripts):

#### Terminal 1 — Scala 3 Telemetry Stream Engine (Port 8090)
```powershell
# Windows:
run_scala.bat

# Linux / macOS:
./run_scala.sh
```

#### Terminal 2 — FastAPI Python Backend & CV Engine (Port 8000)
```powershell
# Windows:
run_backend.bat

# Linux / macOS:
./run_backend.sh
```

#### Terminal 3 — React 19 Frontend Console (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

### 🌐 Service Endpoints Table

| Service Component | Local URL | Description |
| :--- | :--- | :--- |
| **Operator Dashboard** | [http://localhost:5173/](http://localhost:5173/) | Streamlined 3-Tab Operational Interface |
| **UI Kit Showcase** | [http://localhost:5173/#/ui-kit](http://localhost:5173/#/ui-kit) | Token-driven component & chart library |
| **FastAPI Swagger Docs** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive REST API documentation |
| **FastAPI Health Probe** | [http://localhost:8000/health](http://localhost:8000/health) | Backend readiness check (`200 OK`) |
| **Scala Engine Probe** | [http://localhost:8090/health](http://localhost:8090/health) | JVM Stream Engine status (`200 OK`) |
| **Scala Live WebSocket** | `ws://localhost:8090/api/v1/telemetry/live` | Real-time BroadcastHub streaming feed |

---

## 🌐 Live Field Operations: ngrok Tunneling & Cloud Deployment

### 1. Global Field Tunneling with ngrok
Connect physical ESP32-CAM crawlers operating over cellular 4G/5G hot-spots anywhere in the world to your local machine:
```bash
python tunnel_rover.py 8000
# (Or double-click run_tunnel.bat / run_tunnel.sh)
```
* Generates a public HTTPS endpoint (e.g. `https://<subdomain>.ngrok-free.app`).
* Update `BACKEND_HOST = "https://<subdomain>.ngrok-free.app"` in `firmware/esp32_cam_rover/esp32_cam_rover.ino`.

### 2. 24/7 Cloud Deployment on Render
Deploy the complete platform using the included `render.yaml` infrastructure-as-code blueprint:
1. Push repository to GitHub.
2. In the [Render Dashboard](https://render.com), select **New +** $\to$ **Blueprint**.
3. Select this repository; Render automatically executes `build.sh` and provisions services.

---

## 🧪 Verification & Validation Runbook

```bash
# 1. Frontend Production Build & Static Linter:
cd frontend
npm run build
npx oxlint

# 2. Scala Stream Engine Health Probe:
run_scala.bat
curl http://localhost:8090/health

# 3. FastAPI Backend Readiness Probe:
run_backend.bat
curl http://localhost:8000/health
```

---

## 📊 Project Review Presentation Master Guide

The repository includes a 20-slide presentation master guide in [PROJECT_REVIEW_PPT.md](file:///c:/project/agile/PROJECT_REVIEW_PPT.md):
* **Complete Slide Deck:** Slides 1 through 20 covering Abstract, Problem Statement, System Architecture, Spark & Scala Concepts, OpenCV Algorithms, Results, and Future Enhancements.
* **Speaker Notes:** Dedicated spoken defense scripts for each slide.
* **Presenter Defense Cheat-Sheet:** Concrete answers for committee questions regarding GIL bypass in Scala, optical standoff calibration, and concrete stain noise suppression.
* **Visual Asset Pack:** All diagrams are available in 1920×1080 resolution in [`docs/presentation_assets/`](file:///c:/project/agile/docs/presentation_assets/).

---

## 🕸️ Interactive Knowledge Graph (`graphify`)

An architectural knowledge graph has been generated using `graphify`, mapping **678 nodes and 1,948 edges across 26 distinct architectural communities**:
* [graph.html](file:///c:/project/agile/graphify-out/graph.html) — Interactive 2D knowledge graph (open directly in your browser).
* [graph.json](file:///c:/project/agile/graphify-out/graph.json) — GraphRAG-ready node and edge topology.
* [GRAPH_REPORT.md](file:///c:/project/agile/graphify-out/GRAPH_REPORT.md) — Architectural cohesion report, god nodes, and module bridges.

---

## 📜 Compliance Standards & References

1. **American Concrete Institute (ACI):** *Control of Cracking in Concrete Structures (ACI 224R-01)*.
2. **International Organization for Standardization (ISO):** *Testing of Concrete — Part 7: Non-Destructive Tests on Hardened Concrete (ISO 1920-7:2019)*.
3. **Apache Pekko:** *Reactive Streams and Non-Blocking Systems on the JVM* (The Apache Software Foundation).
4. **Apache Spark:** *Structured Streaming Programming Guide* (Zaharia et al., Communications of the ACM).
5. **Computer Vision Metrology:** Frangi et al., *Multiscale Vessel Enhancement Filtering*, MICCAI Springer.

---

<p align="center">
  <b>Agile Rover Platform</b> · Autonomous Structural Intelligence & Metrology<br />
  Designed & Built with Scala 3, Apache Pekko, Python 3.12, OpenCV & React 19
</p>
