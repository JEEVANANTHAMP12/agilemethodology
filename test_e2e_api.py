import requests
import json
import os
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000/api"

def run_e2e_test():
    print("====================================================")
    print("      END-TO-END AUTONOMOUS ROVER PIPELINE TEST     ")
    print("====================================================")

    # 1. User Authentication
    print("\n[1] Testing User Authentication (POST /api/auth/login)...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "inspector",
        "password": "admin123"
    })
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f" -> Authenticated successfully as: {login_resp.json()['user']['full_name']}")

    # 2. Rover Wi-Fi Registration
    print("\n[2] Testing Rover Connection (POST /api/rover/connect)...")
    rover_resp = requests.post(f"{BASE_URL}/rover/connect", json={
        "rover_code": "ROVER-E2E-01",
        "name": "ESP32 Autonomous Crawler V2",
        "ip_address": "192.168.4.15",
        "port": 8080
    }, headers=headers)
    assert rover_resp.status_code == 200
    rover_data = rover_resp.json()
    print(f" -> Rover Connected: {rover_data['rover_code']} (Status: {rover_data['status']}, Battery: {rover_data['battery_percentage']}%)")

    # 3. Rover Status
    print("\n[3] Testing Rover Telemetry (GET /api/rover/status)...")
    status_resp = requests.get(f"{BASE_URL}/rover/status?rover_code=ROVER-E2E-01", headers=headers)
    assert status_resp.status_code == 200
    print(f" -> Telemetry confirmed: Wi-Fi RSSI = {status_resp.json()['wifi_signal_dbm']} dBm")

    # 4. Start Inspection Lifecycle
    print("\n[4] Starting Inspection (POST /api/inspection/start)...")
    start_resp = requests.post(f"{BASE_URL}/inspection/start", json={
        "wall_id": 1,
        "rover_code": "ROVER-E2E-01",
        "notes": "E2E automated validation pass",
        "ambient_temp_c": 27.5,
        "humidity_pct": 58.0
    }, headers=headers)
    assert start_resp.status_code == 200
    inspection = start_resp.json()
    insp_id = inspection["id"]
    print(f" -> Inspection started: {inspection['inspection_code']} (ID: {insp_id}, Status: {inspection['status']})")

    # 5. Rover Scan Simulation & Image Upload
    print("\n[5] Simulating Autonomous Scan (POST /api/dashboard/simulate-scan)...")
    sim_resp = requests.post(f"{BASE_URL}/dashboard/simulate-scan?crack_severity=HIGH&wall_id=1", headers=headers)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    sim_insp_id = sim_data["inspection_id"]
    print(f" -> Scan complete! Crack severity: {sim_data['crack_severity_simulated']}")
    print(f" -> Primary Length: {sim_data['primary_length_mm']} mm | Primary Max Width: {sim_data['primary_width_mm']} mm")
    print(f" -> SHI Score: {sim_data['shi_score']}/100 ({sim_data['health_status']})")
    print(f" -> Estimated RUL: {sim_data['estimated_rul_years']} Years (Risk: {sim_data['risk_level']})")

    # 6. Verify Crack Detection Results
    print(f"\n[6] Fetching Detected Defects for Inspection {sim_insp_id} (GET /api/defects/inspection/{sim_insp_id})...")
    defects_resp = requests.get(f"{BASE_URL}/defects/inspection/{sim_insp_id}", headers=headers)
    assert defects_resp.status_code == 200
    defects = defects_resp.json()
    print(f" -> Retrieved {len(defects)} measured fracture contours.")
    if defects:
        d0 = defects[0]
        print(f"    - Defect #1: Severity={d0['severity']}, Length={d0['length_mm']}mm, MaxWidth={d0['max_width_mm']}mm, Conf={int(d0['confidence']*100)}%")

    # 7. Structural Health Index (SHI)
    print(f"\n[7] Querying SHI Decomposition (GET /api/shi/inspection/{sim_insp_id})...")
    shi_resp = requests.get(f"{BASE_URL}/shi/inspection/{sim_insp_id}", headers=headers)
    assert shi_resp.status_code == 200
    shi_data = shi_resp.json()
    print(f" -> SHI: {shi_data['shi_score']} | Status: {shi_data['health_status']}")
    print(f"    Crack Penalty: -{shi_data['crack_penalty']} pts | Age Penalty: -{shi_data['age_penalty']} pts | Env Penalty: -{shi_data['env_penalty']} pts")

    # 8. Remaining Useful Life (RUL) Prediction
    print(f"\n[8] Querying RUL Prognosis (GET /api/rul/inspection/{sim_insp_id})...")
    rul_resp = requests.get(f"{BASE_URL}/rul/inspection/{sim_insp_id}", headers=headers)
    assert rul_resp.status_code == 200
    rul_data = rul_resp.json()
    print(f" -> Estimated RUL: {rul_data['estimated_rul_years']} Years")
    print(f"    Deterioration Rate: {rul_data['deterioration_rate']} pts/yr | Trend: {rul_data['deterioration_trend']} | Risk: {rul_data['risk_level']}")

    # 9. Alerts
    print("\n[9] Inspecting Active Alerts (GET /api/alerts)...")
    alerts_resp = requests.get(f"{BASE_URL}/alerts", headers=headers)
    assert alerts_resp.status_code == 200
    alerts = alerts_resp.json()
    print(f" -> Active Alerts: {len(alerts)}")
    for a in alerts[:3]:
        print(f"    [{a['severity']}] {a['title']}")

    if alerts and not alerts[0]["is_acknowledged"]:
        ack_resp = requests.post(f"{BASE_URL}/alerts/{alerts[0]['id']}/ack", headers=headers)
        assert ack_resp.status_code == 200
        print(f" -> Successfully acknowledged alert #{alerts[0]['id']}")

    # 10. Inspection Report & Dossier
    print(f"\n[10] Generating Certified Inspection Report (GET /api/reports/inspection/{sim_insp_id})...")
    rep_resp = requests.get(f"{BASE_URL}/reports/inspection/{sim_insp_id}", headers=headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    print(f" -> Generated Dossier: {rep_data['metadata']['report_id']}")
    print(f"    Building: {rep_data['asset']['building_name']} | Wall: {rep_data['asset']['wall_code']}")

    # 11. Full Dashboard Aggregator
    print("\n[11] Verifying Unified Dashboard API (GET /api/dashboard/overview)...")
    dash_resp = requests.get(f"{BASE_URL}/dashboard/overview", headers=headers)
    assert dash_resp.status_code == 200
    dash_data = dash_resp.json()
    print(" -> Dashboard Overview Top Cards:")
    print(f"    • Rover: {dash_data['top_cards']['rover_status']} ({dash_data['top_cards']['battery_percentage']}%)")
    print(f"    • Health Index: {dash_data['top_cards']['health_index']} / 100")
    print(f"    • Wall Status: {dash_data['top_cards']['wall_status']}")
    print(f"    • RUL: {dash_data['top_cards']['estimated_rul_years']} Years")

    print("\n====================================================")
    print(" >>> ALL 11 END-TO-END VERIFICATION STEPS PASSED! <<<")
    print("====================================================")

if __name__ == "__main__":
    run_e2e_test()
