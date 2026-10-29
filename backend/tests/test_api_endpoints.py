import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.main import app

client = TestClient(app)

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ("ONLINE", "DEGRADED")
    assert "database" in data
    assert "rover" in data
    print("Health check endpoint passed!")

def test_auth_and_user_flow():
    # Login as default inspector
    login_resp = client.post("/api/auth/login", json={
        "username": "inspector",
        "password": "admin123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /me endpoint
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["username"] == "inspector"
    print("Auth flow passed!")
    return headers

def test_structures_and_walls(headers):
    # Get buildings
    b_resp = client.get("/api/structures/buildings", headers=headers)
    assert b_resp.status_code == 200
    buildings = b_resp.json()
    assert len(buildings) > 0

    # Get walls
    w_resp = client.get(f"/api/structures/walls?building_id={buildings[0]['id']}", headers=headers)
    assert w_resp.status_code == 200
    print("Structure endpoints passed!")

def test_rover_endpoints(headers):
    # Rover status
    status_resp = client.get("/api/rover/status?rover_code=ROVER-01", headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["rover_code"] == "ROVER-01"

    # Rover connect
    conn_resp = client.post("/api/rover/connect", json={
        "rover_code": "ROVER-01",
        "name": "Wall Crawler Alpha",
        "ip_address": "192.168.4.1",
        "port": 8080
    }, headers=headers)
    assert conn_resp.status_code == 200

    # Rover telemetry
    tel_resp = client.post("/api/rover/telemetry", json={
        "rover_code": "ROVER-01",
        "battery_percentage": 92.0,
        "status": "CONNECTED"
    }, headers=headers)
    assert tel_resp.status_code == 200
    print("Rover endpoints passed!")

def test_dashboard_and_scan(headers):
    # Overview
    over_resp = client.get("/api/dashboard/overview", headers=headers)
    assert over_resp.status_code == 200
    assert "top_cards" in over_resp.json()

    # Live pulse
    pulse_resp = client.get("/api/dashboard/live-pulse", headers=headers)
    assert pulse_resp.status_code == 200
    assert pulse_resp.json()["status"] == "ONLINE"

    # Simulate scan
    sim_resp = client.post("/api/dashboard/simulate-scan?crack_severity=LOW", headers=headers)
    assert sim_resp.status_code == 200
    sim_data = sim_resp.json()
    assert sim_data["status"] == "success"
    insp_id = sim_data["inspection_id"]
    print("Dashboard and scan simulation passed!")
    return insp_id

def test_inspection_analytics(headers, insp_id):
    # SHI endpoint
    shi_resp = client.get(f"/api/shi/inspection/{insp_id}", headers=headers)
    assert shi_resp.status_code == 200

    # RUL endpoint
    rul_resp = client.get(f"/api/rul/inspection/{insp_id}", headers=headers)
    assert rul_resp.status_code == 200

    # Report endpoints
    rep_resp = client.get(f"/api/reports/inspection/{insp_id}", headers=headers)
    assert rep_resp.status_code == 200

    rep_html = client.get(f"/api/reports/inspection/{insp_id}/html", headers=headers)
    assert rep_html.status_code == 200
    assert "text/html" in rep_html.headers.get("content-type", "")

    # Alerts
    alerts_resp = client.get("/api/alerts", headers=headers)
    assert alerts_resp.status_code == 200

    # ML info
    ml_resp = client.get("/api/images/ml-info", headers=headers)
    assert ml_resp.status_code == 200
    print("Inspection analytics, reports, and alerts passed!")

if __name__ == "__main__":
    print("Running Full Backend API Endpoint Test Suite...")
    test_health()
    hdrs = test_auth_and_user_flow()
    test_structures_and_walls(hdrs)
    test_rover_endpoints(hdrs)
    insp_id = test_dashboard_and_scan(hdrs)
    test_inspection_analytics(hdrs, insp_id)
    print("\n>>> ALL TEST SUITE CHECKS COMPLETED WITH 100% SUCCESS! <<<")
