from datetime import datetime, timezone
from typing import Any

from app.config import settings


class SHIEngine:
    """
    Structural Health Index (SHI) Calculation Engine.
    Implements multi-parameter normalization and weighted assessment based on:
    - Crack severity and physical dimensions (length, width, area)
    - Building age and structural typology
    - Rover environmental telemetry (ambient temperature, humidity, tilt, vibration)
    - Historical inspection progression
    """

    def calculate_shi(
        self,
        defects: list[dict[str, Any]],
        building_construction_year: int,
        inspection_telemetry: dict[str, float],
        previous_shi_scores: list[float] = None
    ) -> dict[str, Any]:
        """
        Computes the normalized Structural Health Index (0 - 100).
        """
        current_year = datetime.now(timezone.utc).year
        building_age = max(0, current_year - building_construction_year)

        # 1. Crack Severity and Dimensional Penalty (Weight: 50%)
        crack_penalty = 0.0
        if defects:
            total_length_mm = sum(d.get("length_mm", 0.0) for d in defects)
            max_width_mm = max((d.get("max_width_mm", 0.0) for d in defects), default=0.0)
            
            # Count severities
            crit_count = sum(1 for d in defects if d.get("severity") == "CRITICAL")
            high_count = sum(1 for d in defects if d.get("severity") == "HIGH")
            mod_count = sum(1 for d in defects if d.get("severity") == "MODERATE")
            low_count = sum(1 for d in defects if d.get("severity") == "LOW")

            base_severity_penalty = (crit_count * 22.0) + (high_count * 14.0) + (mod_count * 6.0) + (low_count * 2.0)
            
            # Dimension factors
            length_factor = min(15.0, (total_length_mm / 400.0) * 15.0)
            width_factor = min(15.0, (max_width_mm / 5.0) * 15.0)

            crack_penalty = min(50.0, base_severity_penalty + length_factor + width_factor)
        else:
            crack_penalty = 0.0

        # 2. Building Age Penalty (Weight: 20%)
        # Nominal 50-year concrete design life
        if building_age <= 5:
            age_penalty = 0.0
        elif building_age <= 25:
            age_penalty = (building_age - 5) / 20.0 * 8.0  # max 8 pts
        elif building_age <= 50:
            age_penalty = 8.0 + ((building_age - 25) / 25.0 * 8.0)  # max 16 pts
        else:
            age_penalty = min(20.0, 16.0 + ((building_age - 50) / 20.0 * 4.0))

        # 3. Environmental & Rover Sensor Penalty (Weight: 15%)
        env_penalty = 0.0
        temp = inspection_telemetry.get("ambient_temp_c", 25.0)
        humidity = inspection_telemetry.get("humidity_pct", 50.0)
        tilt = abs(inspection_telemetry.get("rover_tilt_deg", 0.0))
        vibration = inspection_telemetry.get("vibration_level", 0.0)

        # Humidity extremes accelerate rebar corrosion and spalling
        if humidity > 80.0:
            env_penalty += min(4.0, (humidity - 80.0) * 0.2)
        elif humidity < 25.0:
            env_penalty += min(2.0, (25.0 - humidity) * 0.1)

        # Temperature thermal shock risk
        if temp > 40.0 or temp < 5.0:
            env_penalty += 3.0

        # Rover Tilt & Vibration (indicative of uneven wall plane, bulging or mechanical resonance)
        if tilt > 2.0:
            env_penalty += min(5.0, (tilt - 2.0) * 2.0)
        if vibration > 0.20:
            env_penalty += min(3.0, (vibration - 0.20) * 10.0)

        env_penalty = min(15.0, env_penalty)

        # 4. Inspection History Penalty (Weight: 15%)
        history_penalty = 0.0
        if previous_shi_scores:
            avg_prev = sum(previous_shi_scores) / len(previous_shi_scores)
            if avg_prev < 70.0:
                history_penalty += min(15.0, (70.0 - avg_prev) * 0.4)

        # Final SHI Computation
        total_penalty = crack_penalty + age_penalty + env_penalty + history_penalty
        raw_shi = 100.0 - total_penalty
        shi_score = round(max(0.0, min(100.0, raw_shi)), 1)

        # Classification
        if shi_score >= settings.SHI_HEALTHY_MIN:
            health_status = "HEALTHY"
        elif shi_score >= settings.SHI_MODERATE_MIN:
            health_status = "MODERATE"
        else:
            health_status = "CRITICAL"

        return {
            "shi_score": shi_score,
            "health_status": health_status,
            "crack_penalty": round(crack_penalty, 2),
            "age_penalty": round(age_penalty, 2),
            "env_penalty": round(env_penalty, 2),
            "history_penalty": round(history_penalty, 2),
            "calculation_factors": {
                "building_age_years": building_age,
                "total_cracks_evaluated": len(defects),
                "ambient_temp_c": temp,
                "humidity_pct": humidity,
                "rover_tilt_deg": tilt,
                "vibration_level": vibration,
                "thresholds": {
                    "healthy_min": settings.SHI_HEALTHY_MIN,
                    "moderate_min": settings.SHI_MODERATE_MIN
                }
            }
        }
