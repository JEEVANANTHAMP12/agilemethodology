from datetime import datetime, timezone
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.inspection import Inspection
from app.models.wall import Wall
from app.models.building import Building
from app.models.image import Image
from app.models.defect import Defect
from app.models.health_result import HealthResult
from app.models.rul_prediction import RulPrediction
from app.models.alert import Alert

class ReportGenerator:
    """
    Generates structured structural engineering inspection reports:
    - Inspection overview
    - Crack detection metrics and severity classification
    - Structural Health Index (SHI) decomposition
    - Remaining Useful Life (RUL) predictive degradation curves
    - Historical trend comparison
    - Printable executive HTML report
    """

    @staticmethod
    def generate_inspection_report(db: Session, inspection_id: int) -> Dict[str, Any]:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError(f"Inspection {inspection_id} not found")

        wall = db.query(Wall).filter(Wall.id == inspection.wall_id).first()
        building = db.query(Building).filter(Building.id == wall.building_id).first() if wall else None
        images = db.query(Image).filter(Image.inspection_id == inspection_id).all()
        image_ids = [img.id for img in images]
        defects = db.query(Defect).filter(Defect.image_id.in_(image_ids)).all() if image_ids else []
        health_result = db.query(HealthResult).filter(HealthResult.inspection_id == inspection_id).first()
        rul_prediction = db.query(RulPrediction).filter(RulPrediction.health_result_id == health_result.id).first() if health_result else None
        alerts = db.query(Alert).filter(Alert.inspection_id == inspection_id).all()

        # Historical comparison (past inspections on the same wall)
        history_records = []
        if wall:
            past_inspections = db.query(Inspection).filter(
                Inspection.wall_id == wall.id,
                Inspection.id <= inspection_id
            ).order_by(Inspection.start_time.asc()).all()

            for past in past_inspections:
                p_health = db.query(HealthResult).filter(HealthResult.inspection_id == past.id).first()
                p_rul = db.query(RulPrediction).filter(RulPrediction.health_result_id == p_health.id).first() if p_health else None
                history_records.append({
                    "inspection_code": past.inspection_code,
                    "date": past.start_time.strftime("%Y-%m-%d %H:%M") if past.start_time else "N/A",
                    "shi_score": p_health.shi_score if p_health else None,
                    "status": p_health.health_status if p_health else "N/A",
                    "rul_years": p_rul.estimated_rul_years if p_rul else None
                })

        # Defect summary metrics
        total_cracks = len(defects)
        max_width = max((d.max_width_mm for d in defects), default=0.0)
        total_length = sum((d.length_mm for d in defects), 0.0)
        avg_confidence = round(sum((d.confidence for d in defects), 0.0) / total_cracks * 100, 1) if total_cracks > 0 else 100.0

        severity_breakdown = {
            "CRITICAL": sum(1 for d in defects if d.severity == "CRITICAL"),
            "HIGH": sum(1 for d in defects if d.severity == "HIGH"),
            "MODERATE": sum(1 for d in defects if d.severity == "MODERATE"),
            "LOW": sum(1 for d in defects if d.severity == "LOW")
        }

        report_data = {
            "metadata": {
                "report_id": f"REP-{inspection.inspection_code}",
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "system": "Autonomous Structural Inspection Rover System",
                "version": "v2.4"
            },
            "inspection": {
                "id": inspection.id,
                "code": inspection.inspection_code,
                "status": inspection.status,
                "start_time": inspection.start_time.isoformat() if inspection.start_time else None,
                "end_time": inspection.end_time.isoformat() if inspection.end_time else None,
                "ambient_temp_c": inspection.ambient_temp_c,
                "humidity_pct": inspection.humidity_pct,
                "rover_tilt_deg": inspection.rover_tilt_deg,
                "vibration_level": inspection.vibration_level,
                "notes": inspection.notes
            },
            "asset": {
                "building_name": building.name if building else "Unknown",
                "building_address": building.address if building else "N/A",
                "construction_year": building.construction_year if building else 2010,
                "structural_type": building.structural_type if building else "Reinforced Concrete",
                "wall_code": wall.wall_code if wall else "N/A",
                "wall_name": wall.name if wall else "N/A",
                "orientation": wall.orientation if wall else "N/A",
                "surface_area_sqm": wall.surface_area_sqm if wall else 24.0
            },
            "crack_detection": {
                "total_images": len(images),
                "total_cracks_detected": total_cracks,
                "max_crack_width_mm": max_width,
                "total_crack_length_mm": round(total_length, 2),
                "average_confidence_pct": avg_confidence,
                "severity_breakdown": severity_breakdown,
                "defects": [
                    {
                        "id": d.id,
                        "severity": d.severity,
                        "length_mm": d.length_mm,
                        "max_width_mm": d.max_width_mm,
                        "avg_width_mm": d.avg_width_mm,
                        "confidence": d.confidence
                    } for d in defects
                ]
            },
            "health_assessment": {
                "shi_score": health_result.shi_score if health_result else 100.0,
                "status": health_result.health_status if health_result else "HEALTHY",
                "crack_penalty": health_result.crack_penalty if health_result else 0.0,
                "age_penalty": health_result.age_penalty if health_result else 0.0,
                "env_penalty": health_result.env_penalty if health_result else 0.0,
                "history_penalty": health_result.history_penalty if health_result else 0.0
            },
            "rul_prediction": {
                "current_shi": rul_prediction.current_shi if rul_prediction else (health_result.shi_score if health_result else 100.0),
                "estimated_rul_years": rul_prediction.estimated_rul_years if rul_prediction else 25.0,
                "deterioration_rate": rul_prediction.deterioration_rate if rul_prediction else 1.2,
                "deterioration_trend": rul_prediction.deterioration_trend if rul_prediction else "Stable",
                "risk_level": rul_prediction.risk_level if rul_prediction else "Low",
                "prediction_model": rul_prediction.prediction_model if rul_prediction else "Baseline"
            },
            "alerts": [
                {
                    "id": a.id,
                    "type": a.alert_type,
                    "severity": a.severity,
                    "title": a.title,
                    "message": a.message,
                    "acknowledged": a.is_acknowledged
                } for a in alerts
            ],
            "historical_comparison": history_records
        }

        return report_data

    @staticmethod
    def render_html_report(data: Dict[str, Any]) -> str:
        """
        Renders a self-contained, publication-ready engineering inspection report.
        """
        m = data["metadata"]
        insp = data["inspection"]
        asset = data["asset"]
        cracks = data["crack_detection"]
        health = data["health_assessment"]
        rul = data["rul_prediction"]
        alerts = data["alerts"]
        history = data["historical_comparison"]

        status_color = "#10B981" if health["status"] == "HEALTHY" else ("#F59E0B" if health["status"] == "MODERATE" else "#EF4444")

        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>DOSSIER // {insp['code']}</title>
<style>
  body {{ font-family: 'Fira Code', 'Courier New', monospace; color: #0A0A0A; background: #EAE8E3; margin: 0; padding: 24px; }}
  .container {{ max-width: 960px; margin: 0 auto; background: #F4F4F0; padding: 36px; border: 2px solid #000000; box-shadow: 8px 8px 0px rgba(0,0,0,0.8); }}
  .header {{ display: flex; justify-content: space-between; border-bottom: 3px solid #000000; padding-bottom: 16px; margin-bottom: 24px; }}
  .title {{ font-size: 20px; font-weight: 900; color: #000000; text-transform: uppercase; letter-spacing: -0.02em; }}
  .subtitle {{ color: #555555; font-size: 11px; margin-top: 4px; letter-spacing: 0.05em; }}
  .stamp {{ display: inline-block; padding: 4px 10px; font-weight: 900; font-size: 12px; color: #fff; background: #000000; text-transform: uppercase; border: 1px solid #000; }}
  .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }}
  .card {{ background: #FFFFFF; border: 1px solid #000000; padding: 14px; }}
  .card-label {{ font-size: 10px; color: #666666; text-transform: uppercase; font-weight: 700; }}
  .card-val {{ font-size: 22px; font-weight: 900; margin-top: 4px; color: #000000; }}
  .section {{ margin-top: 28px; }}
  .section-title {{ font-size: 13px; font-weight: 900; border-bottom: 2px solid #000000; padding-bottom: 6px; margin-bottom: 12px; color: #000000; text-transform: uppercase; letter-spacing: 0.08em; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }}
  th, td {{ padding: 8px 10px; text-align: left; border: 1px solid #000000; }}
  th {{ background: #EAE8E3; color: #000000; font-weight: 900; text-transform: uppercase; }}
  .alert-box {{ padding: 10px 14px; margin-bottom: 8px; font-size: 12px; border: 1px solid #000; }}
  .alert-CRITICAL {{ background: #FF2A2A; color: #FFFFFF; font-weight: 700; }}
  .alert-WARNING {{ background: #FFB800; color: #000000; font-weight: 700; }}
  .alert-INFO {{ background: #EAE8E3; color: #000000; }}
  @media print {{ body {{ background: #fff; padding: 0; }} .container {{ border: 2px solid #000; box-shadow: none; padding: 20px; }} }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <div>
      <div class="title">[NON-DESTRUCTIVE TESTING DOSSIER // CRACK METROLOGY]</div>
      <div class="subtitle">AUTONOMOUS CRAWLER SCAN &amp; SUB-PIXEL APERTURE TELEMETRY</div>
      <div class="subtitle">ARTIFACT: {m['report_id']} | TIMESTAMP: {m['generated_at']}</div>
    </div>
    <div style="text-align: right;">
      <span class="stamp">[{health['status']}]</span>
      <div style="font-size: 11px; color: #666; margin-top: 6px; font-weight: 700;">UNIT #{insp['code']}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-label">HEALTH INDEX (SHI)</div>
      <div class="card-val">{health['shi_score']} / 100</div>
    </div>
    <div class="card">
      <div class="card-label">FRACTURE COUNT</div>
      <div class="card-val">{cracks['total_cracks_detected']}</div>
    </div>
    <div class="card">
      <div class="card-label">MAX APERTURE</div>
      <div class="card-val">{cracks['max_crack_width_mm']} MM</div>
    </div>
    <div class="card">
      <div class="card-label">ESTIMATED RUL</div>
      <div class="card-val">{rul['estimated_rul_years']} YRS</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">&gt; ASSET &amp; TELEMETRY LOG</div>
    <table>
      <tr><td><strong>ASSET TARGET:</strong> {asset['building_name']}</td><td><strong>LOCATION:</strong> {asset['building_address']}</td></tr>
      <tr><td><strong>CONSTRUCTION YEAR:</strong> {asset['construction_year']}</td><td><strong>TYPOLOGY:</strong> {asset['structural_type']}</td></tr>
      <tr><td><strong>WALL ID:</strong> {asset['wall_code']} ({asset['wall_name']})</td><td><strong>ORIENTATION:</strong> {asset['orientation']}</td></tr>
      <tr><td><strong>AMBIENT TEMP:</strong> {insp['ambient_temp_c']} °C</td><td><strong>HUMIDITY:</strong> {insp['humidity_pct']} %</td></tr>
      <tr><td><strong>ROVER TILT:</strong> {insp['rover_tilt_deg']}°</td><td><strong>VIBRATION RMS:</strong> {insp['vibration_level']} g</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">&gt; FRACTURE INVENTORY &amp; SKELETON METROLOGY</div>
    <p style="font-size: 11px; margin-bottom: 8px;">CUMULATIVE LENGTH: <strong>{cracks['total_crack_length_mm']} MM</strong> | MEAN CONFIDENCE: <strong>{cracks['average_confidence_pct']}%</strong></p>
    <table>
      <thead>
        <tr><th>ID</th><th>SEVERITY</th><th>LENGTH (MM)</th><th>MAX WIDTH (MM)</th><th>AVG WIDTH (MM)</th><th>CONFIDENCE</th></tr>
      </thead>
      <tbody>
        {"".join(f"<tr><td>#{d['id']}</td><td><strong>[{d['severity']}]</strong></td><td>{d['length_mm']}</td><td>{d['max_width_mm']}</td><td>{d['avg_width_mm']}</td><td>{int(d['confidence']*100)}%</td></tr>" for d in cracks['defects']) if cracks['defects'] else "<tr><td colspan='6'>NO DETECTED FRACTURES. SURFACE INTEGRITY NOMINAL.</td></tr>"}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">&gt; REMAINING USEFUL LIFE (RUL) PROGNOSIS</div>
    <table>
      <tr><td><strong>CURRENT SHI:</strong> {rul['current_shi']}</td><td><strong>DECAY TREND:</strong> {rul['deterioration_trend']}</td></tr>
      <tr><td><strong>ANNUAL LOSS VELOCITY:</strong> {rul['deterioration_rate']} PTS/YR</td><td><strong>RISK CATEGORY:</strong> {rul['risk_level']}</td></tr>
      <tr><td><strong>ESTIMATED RUL:</strong> {rul['estimated_rul_years']} YEARS</td><td><strong>ALGORITHM:</strong> {rul['prediction_model']}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">&gt; HAZARD LOG &amp; INTERVENTION PROTOCOLS</div>
    {"".join(f"<div class='alert-box alert-{a['severity']}'><strong>[{a['severity']}] {a['title']}</strong><br/>{a['message']}</div>" for a in alerts) if alerts else "<p style='color: #000; font-weight: 700;'>NO ACTIVE HAZARDS LOGGED. STANDARD INSPECTION INTERVAL PERMITTED.</p>"}
  </div>

  <div class="section">
    <div class="section-title">&gt; HISTORICAL DEGRADATION LOG</div>
    <table>
      <thead>
        <tr><th>INSPECTION_ID</th><th>TIMESTAMP</th><th>SHI</th><th>INTEGRITY</th><th>RUL</th></tr>
      </thead>
      <tbody>
        {"".join(f"<tr><td>{h['inspection_code']}</td><td>{h['date']}</td><td>{h['shi_score']}</td><td>{h['status']}</td><td>{h['rul_years']} YRS</td></tr>" for h in history) if history else "<tr><td colspan='5'>INITIAL BASELINE SCAN.</td></tr>"}
      </tbody>
    </table>
  </div>
</div>
</body>
</html>
"""
        return html
