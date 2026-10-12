from typing import Dict, Any, List, Optional
import numpy as np

class RULPredictor:
    """
    Remaining Useful Life (RUL) Prediction Engine.
    Uses trend-based deterioration modeling, historical inspection regression,
    and degradation curve extrapolation.
    """

    CRITICAL_FAILURE_SHI = 40.0  # SHI threshold below which structure requires urgent rebuild/overhaul

    def predict_rul(
        self,
        current_shi: float,
        previous_shi_history: List[Dict[str, Any]] = None,
        building_age_years: int = 15
    ) -> Dict[str, Any]:
        """
        Calculates Estimated RUL in Years, deterioration rate, trend, and risk level.
        """
        # Determine annual deterioration rate (points per year)
        if previous_shi_history and len(previous_shi_history) >= 2:
            # Multi-point trend regression
            scores = [rec.get("shi_score", 100.0) for rec in previous_shi_history]
            scores.append(current_shi)
            indices = np.arange(len(scores))
            # Fit line: slope is change per inspection cycle
            slope, _ = np.polyfit(indices, scores, 1)
            # Negative slope means degradation
            rate = abs(float(slope))
            # Assume 1 cycle ~ 6-12 months
            annual_rate = max(0.5, rate * 1.5)
            previous_shi = previous_shi_history[-1].get("shi_score")
        elif previous_shi_history and len(previous_shi_history) == 1:
            previous_shi = previous_shi_history[0].get("shi_score", 90.0)
            diff = max(0.2, previous_shi - current_shi)
            annual_rate = max(0.8, diff * 1.2)
        else:
            previous_shi = None
            # Baseline empirical degradation from age
            effective_age = max(1, building_age_years)
            drop = max(2.0, 100.0 - current_shi)
            annual_rate = min(5.0, max(0.8, drop / effective_age))

        annual_rate = round(float(annual_rate), 2)

        # Deterioration trend classification
        if annual_rate >= 3.0:
            trend = "Accelerating"
        elif annual_rate >= 1.5:
            trend = "Increasing"
        else:
            trend = "Stable"

        # RUL in Years: time until SHI reaches CRITICAL_FAILURE_SHI (40)
        shi_margin = max(0.0, current_shi - self.CRITICAL_FAILURE_SHI)
        estimated_rul_years = round(max(0.5, shi_margin / annual_rate), 1)

        # Risk Level
        if current_shi < 50.0 or estimated_rul_years < 5.0:
            risk_level = "Critical"
        elif current_shi < 70.0 or estimated_rul_years < 12.0:
            risk_level = "High"
        elif current_shi < 80.0 or estimated_rul_years < 22.0:
            risk_level = "Moderate"
        else:
            risk_level = "Low"

        confidence = 0.90 if previous_shi_history else 0.84

        return {
            "current_shi": current_shi,
            "previous_shi": previous_shi,
            "estimated_rul_years": estimated_rul_years,
            "deterioration_rate": annual_rate,
            "deterioration_trend": trend,
            "risk_level": risk_level,
            "prediction_model": "Trend-Extrapolation-Degradation-v1",
            "confidence_score": round(confidence, 2),
            "details": {
                "critical_failure_shi": self.CRITICAL_FAILURE_SHI,
                "shi_margin_remaining": round(shi_margin, 1),
                "annual_loss_rate_pts": annual_rate,
                "history_points_used": len(previous_shi_history) if previous_shi_history else 0
            }
        }
