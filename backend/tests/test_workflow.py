import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)
from app.database import Base, SessionLocal, engine
from app.models import (
    Building,
    Defect,
    HealthResult,
    Image,
    Inspection,
    RulPrediction,
    User,
    Wall,
)
from app.services.alert_manager import AlertManager
from app.services.crack_detector import CrackDetector
from app.services.report_generator import ReportGenerator
from app.services.rover_service import RoverService
from app.services.rul_predictor import RULPredictor
from app.services.shi_engine import SHIEngine


def test_full_workflow():
    print("=== STEP 1: INITIALIZING DATABASE & TABLES ===")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    print("Database tables created successfully!")

    print("\n=== STEP 2: USER AUTHENTICATION CHECK ===")
    hashed = hash_password("testpass123")
    assert verify_password("testpass123", hashed)
    assert not verify_password("wrongpass", hashed)
    token = create_access_token({"sub": "testuser", "role": "engineer"})
    decoded = decode_access_token(token)
    assert decoded["sub"] == "testuser"
    print("Authentication and JWT verification passed!")

    print("\n=== STEP 3: CREATING ROVER, BUILDING, AND WALL ===")
    rover = RoverService.connect_rover(db, "ROVER-TEST-01")
    assert rover.rover_code == "ROVER-TEST-01"

    user = db.query(User).first()
    if not user:
        user = User(username="inspector_test", email="test@rover.org", hashed_password=hashed)
        db.add(user)
        db.commit()
        db.refresh(user)

    building = Building(
        user_id=user.id,
        name="Test Structural Facility",
        address="Zone 3, Test Lab",
        construction_year=2014,
        structural_type="Reinforced Concrete"
    )
    db.add(building)
    db.commit()
    db.refresh(building)

    wall = Wall(
        building_id=building.id,
        wall_code="WALL-TEST-1",
        name="Shear Wall Test Panel",
        orientation="South",
        material="Concrete C30",
        surface_area_sqm=30.0
    )
    db.add(wall)
    db.commit()
    db.refresh(wall)
    print(f"Created Wall: {wall.wall_code} under Building: {building.name}")

    print("\n=== STEP 4: HARDWARE IMAGE SYNTHESIS & CRACK DETECTION ===")
    test_img_path = settings.UPLOAD_DIR / "test_wall_sample.jpg"
    proc_img_path = settings.PROCESSED_DIR / "test_wall_sample_processed.jpg"
    RoverService.generate_synthetic_wall_image(str(test_img_path), add_crack=True, crack_severity="HIGH")
    assert test_img_path.exists()
    print(f"Synthesized realistic wall image at: {test_img_path}")

    detector = CrackDetector(pixels_per_mm=settings.DEFAULT_PIXELS_PER_MM)
    det_result = detector.analyze_image(str(test_img_path), str(proc_img_path))
    assert proc_img_path.exists()
    print("Crack Detection Output:")
    print(f"  - Crack Detected: {det_result['crack_detected']}")
    print(f"  - Total Cracks: {det_result['total_cracks']}")
    print(f"  - Primary Length: {det_result['primary_length_mm']} mm")
    print(f"  - Primary Max Width: {det_result['primary_width_mm']} mm")
    print(f"  - Severity: {det_result['severity']}")
    print(f"  - Confidence: {det_result['confidence_percentage']} %")

    print("\n=== STEP 5: RECORDING INSPECTION & DEFECTS ===")
    import time
    test_code = f"INSP-TEST-{int(time.time())}"
    inspection = Inspection(
        wall_id=wall.id,
        rover_id=rover.id,
        inspection_code=test_code,
        status="COMPLETED",
        ambient_temp_c=28.0,
        humidity_pct=62.0,
        rover_tilt_deg=1.5,
        vibration_level=0.12,
        notes="Automated crawler verification test"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    image_rec = Image(
        inspection_id=inspection.id,
        file_name="test_wall_sample.jpg",
        original_path="test_wall_sample.jpg",
        processed_path="test_wall_sample_processed.jpg"
    )
    db.add(image_rec)
    db.commit()
    db.refresh(image_rec)

    defect_records = []
    for d in det_result["defects"]:
        df = Defect(
            image_id=image_rec.id,
            defect_type="CRACK",
            length_mm=d["length_mm"],
            max_width_mm=d["max_width_mm"],
            avg_width_mm=d["avg_width_mm"],
            area_sqmm=d["area_sqmm"],
            severity=d["severity"],
            confidence=d["confidence"]
        )
        db.add(df)
        defect_records.append(df)
    db.commit()
    print(f"Recorded {len(defect_records)} defects to Database.")

    print("\n=== STEP 6: COMPUTING SHI (STRUCTURAL HEALTH INDEX) ===")
    shi_eng = SHIEngine()
    shi_out = shi_eng.calculate_shi(
        defects=[{"length_mm": d.length_mm, "max_width_mm": d.max_width_mm, "severity": d.severity} for d in defect_records],
        building_construction_year=building.construction_year,
        inspection_telemetry={"ambient_temp_c": 28.0, "humidity_pct": 62.0, "rover_tilt_deg": 1.5, "vibration_level": 0.12}
    )
    health_rec = HealthResult(
        inspection_id=inspection.id,
        wall_id=wall.id,
        shi_score=shi_out["shi_score"],
        health_status=shi_out["health_status"],
        crack_penalty=shi_out["crack_penalty"],
        age_penalty=shi_out["age_penalty"],
        env_penalty=shi_out["env_penalty"]
    )
    db.add(health_rec)
    db.commit()
    db.refresh(health_rec)
    print(f"SHI Score: {health_rec.shi_score} / 100 | Status: {health_rec.health_status}")

    print("\n=== STEP 7: RUL (REMAINING USEFUL LIFE) PREDICTION ===")
    rul_pred = RULPredictor()
    rul_out = rul_pred.predict_rul(current_shi=health_rec.shi_score, building_age_years=12)
    rul_rec = RulPrediction(
        health_result_id=health_rec.id,
        wall_id=wall.id,
        current_shi=rul_out["current_shi"],
        estimated_rul_years=rul_out["estimated_rul_years"],
        deterioration_rate=rul_out["deterioration_rate"],
        deterioration_trend=rul_out["deterioration_trend"],
        risk_level=rul_out["risk_level"]
    )
    db.add(rul_rec)
    db.commit()
    db.refresh(rul_rec)
    print(f"Estimated RUL: {rul_rec.estimated_rul_years} Years")
    print(f"Deterioration Trend: {rul_rec.deterioration_trend} (Rate: {rul_rec.deterioration_rate} pts/yr)")
    print(f"Risk Level: {rul_rec.risk_level}")

    print("\n=== STEP 8: EVALUATING ALERTS & GENERATING REPORT ===")
    alerts = AlertManager.evaluate_inspection_alerts(
        db,
        inspection_id=inspection.id,
        defects=defect_records,
        health_result=health_rec,
        rul_prediction=rul_rec
    )
    print(f"Generated {len(alerts)} alerts based on safety thresholds:")
    for a in alerts:
        print(f"  - [{a.severity}] {a.title}")

    report = ReportGenerator.generate_inspection_report(db, inspection.id)
    html_report = ReportGenerator.render_html_report(report)
    assert len(html_report) > 500
    print(f"Generated HTML report successfully ({len(html_report)} bytes).")

    print("\n>>> ALL TEST WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY! <<<")
    db.close()

if __name__ == "__main__":
    test_full_workflow()
