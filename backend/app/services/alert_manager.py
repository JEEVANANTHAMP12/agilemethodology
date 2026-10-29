
from app.models.alert import Alert
from app.models.defect import Defect
from app.models.health_result import HealthResult
from app.models.rul_prediction import RulPrediction
from sqlalchemy.orm import Session


class AlertManager:
    """
    Evaluates inspection telemetry, detected defects, SHI score, and RUL predictions
    against predefined safety rules to trigger engineering alerts.
    """

    @staticmethod
    def evaluate_inspection_alerts(
        db: Session,
        inspection_id: int,
        defects: list[Defect] = None,
        health_result: HealthResult | None = None,
        rul_prediction: RulPrediction | None = None
    ) -> list[Alert]:
        new_alerts: list[Alert] = []

        # 1. Defect Severity Alerts
        # Rule: IF crack severity = HIGH or CRITICAL -> Critical Alert
        if defects:
            critical_and_high = [d for d in defects if d.severity in ["HIGH", "CRITICAL"]]
            # Sort by severity priority and length
            sev_rank = {"CRITICAL": 2, "HIGH": 1}
            critical_and_high.sort(key=lambda d: (sev_rank.get(d.severity, 0), d.length_mm), reverse=True)
            for defect in critical_and_high[:3]:  # Top 3 most severe
                title = f"CRITICAL CRACK DETECTED: {defect.severity} [{defect.length_mm}mm x {defect.max_width_mm}mm]"
                msg = (
                    f"Autonomous scan identified a {defect.severity.lower()} severity crack "
                    f"with max aperture {defect.max_width_mm}mm and length {defect.length_mm}mm. "
                    f"Immediate structural epoxy injection or rebar integrity check recommended."
                )
                alert = Alert(
                    inspection_id=inspection_id,
                    defect_id=defect.id,
                    alert_type="CRITICAL_CRACK",
                    severity="CRITICAL" if defect.severity == "CRITICAL" else "WARNING",
                    title=title,
                    message=msg
                )
                db.add(alert)
                new_alerts.append(alert)

        # 2. Structural Health Index (SHI) Warnings
        # Rule: IF SHI decreases significantly or falls below 50 -> Health Warning
        if health_result:
            if health_result.health_status == "CRITICAL" or health_result.shi_score < 50.0:
                alert = Alert(
                    inspection_id=inspection_id,
                    health_result_id=health_result.id,
                    alert_type="HEALTH_WARNING",
                    severity="CRITICAL",
                    title=f"CRITICAL STRUCTURAL HEALTH DROP (SHI: {health_result.shi_score}/100)",
                    message=(
                        f"Wall Structural Health Index has entered CRITICAL zone at {health_result.shi_score}/100. "
                        f"Heavy structural degradation detected. Immediate physical engineering audit required."
                    )
                )
                db.add(alert)
                new_alerts.append(alert)
            elif health_result.health_status == "MODERATE" and health_result.crack_penalty > 20.0:
                alert = Alert(
                    inspection_id=inspection_id,
                    health_result_id=health_result.id,
                    alert_type="HEALTH_WARNING",
                    severity="WARNING",
                    title=f"STRUCTURAL HEALTH WARNING (SHI: {health_result.shi_score}/100)",
                    message=(
                        f"Health index has fallen into MODERATE category ({health_result.shi_score}/100). "
                        f"Crack penalty contribution is {health_result.crack_penalty} points."
                    )
                )
                db.add(alert)
                new_alerts.append(alert)

        # 3. RUL Maintenance Recommendations
        # Rule: IF predicted RUL is low (< 10 years or High/Critical risk) -> Maintenance Recommendation
        if rul_prediction:
            if rul_prediction.estimated_rul_years < 10.0 or rul_prediction.risk_level in ["High", "Critical"]:
                alert = Alert(
                    inspection_id=inspection_id,
                    rul_prediction_id=rul_prediction.id,
                    alert_type="MAINTENANCE_RECOMMENDATION",
                    severity="CRITICAL" if rul_prediction.estimated_rul_years < 5.0 else "WARNING",
                    title=f"MAINTENANCE MANDATED: RUL {rul_prediction.estimated_rul_years} YEARS",
                    message=(
                        f"Remaining Useful Life is projected at {rul_prediction.estimated_rul_years} years "
                        f"with an {rul_prediction.deterioration_trend.lower()} deterioration trend. "
                        f"Preventative retrofitting and load redistribution should be scheduled."
                    )
                )
                db.add(alert)
                new_alerts.append(alert)

        db.commit()
        for a in new_alerts:
            db.refresh(a)

        return new_alerts
