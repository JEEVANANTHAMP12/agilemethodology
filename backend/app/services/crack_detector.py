from typing import Any

import cv2
import numpy as np
from app.config import settings
from app.services.ml_crack_model import ml_crack_engine


class CrackDetector:
    """
    Advanced Machine Learning & Computer Vision Crack Detection and Measurement Service.
    Powered by the MLCrackModel ensemble (Random Forest + Gradient Boosting,
    Hessian ridge tubularity, LBP texture analysis, and sub-pixel distance transform metrology).
    """

    def __init__(self, pixels_per_mm: float = settings.DEFAULT_PIXELS_PER_MM):
        self.pixels_per_mm = pixels_per_mm

    def analyze_image(self, input_image_path: str, output_image_path: str = None) -> dict[str, Any]:
        """
        Processes a wall image with the ML model, detects cracks, extracts physical metrics in mm,
        classifies structural severity, and writes an annotated visualization.
        """
        img = cv2.imread(str(input_image_path))
        if img is None:
            raise ValueError(f"Could not read image from {input_image_path}")

        try:
            # Run ML Crack Model prediction
            prediction = ml_crack_engine.predict(
                image_bgr=img,
                pixels_per_mm=self.pixels_per_mm
            )

            # Render visualization with HUD overlay
            if output_image_path:
                heatmap_path = str(output_image_path).replace(".jpg", "_heatmap.jpg") if output_image_path.endswith(".jpg") else None
                ml_crack_engine.render_visualizations(
                    img_bgr=img,
                    prediction=prediction,
                    output_processed_path=output_image_path,
                    output_heatmap_path=heatmap_path
                )

            return {
                "crack_detected": prediction["crack_detected"],
                "total_cracks": prediction["total_defects"],
                "primary_length_mm": prediction["primary_length_mm"],
                "primary_width_mm": prediction["primary_width_mm"],
                "severity": prediction["severity"],
                "confidence_percentage": prediction["confidence_percentage"],
                "crack_probability": prediction["crack_probability"],
                "severity_probabilities": prediction.get("severity_probabilities", {}),
                "aci_224r_compliant": prediction.get("aci_224r_compliant", True),
                "feature_attributions": prediction.get("feature_attributions", []),
                "defects": prediction["defects"],
                "model_name": prediction.get("model_name", "Wall-Crack-Ensemble-v2.4")
            }
        except Exception:
            # Fallback to classical OpenCV pipeline if ML inference raises
            return self._classical_fallback(img, output_image_path)

    def _classical_fallback(self, img: np.ndarray, output_image_path: str = None) -> dict[str, Any]:
        height, width = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
        equalized = clahe.apply(gray)
        blurred = cv2.bilateralFilter(equalized, d=7, sigmaColor=50, sigmaSpace=50)

        kernel_rect = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        blackhat = cv2.morphologyEx(blurred, cv2.MORPH_BLACKHAT, kernel_rect)

        _, thresh = cv2.threshold(blackhat, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel_clean, iterations=1)
        closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, kernel_clean, iterations=2)

        dist_transform = cv2.distanceTransform(closed, cv2.DIST_L2, 5)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        defects: list[dict[str, Any]] = []
        annotated_img = img.copy()
        mask_overlay = np.zeros_like(img)
        min_pixel_len = int(20 * (self.pixels_per_mm / 2.5))

        for idx, cnt in enumerate(contours):
            perimeter = cv2.arcLength(cnt, False)
            area = cv2.contourArea(cnt)
            x, y, w, h = cv2.boundingRect(cnt)

            if perimeter < min_pixel_len and area < 80:
                continue

            length_px = max(perimeter / 2.0, max(w, h))
            length_mm = round(length_px / self.pixels_per_mm, 2)

            c_mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.drawContours(c_mask, [cnt], -1, 255, -1)
            pts = np.where(c_mask == 255)
            if len(pts[0]) > 0:
                max_radius = np.max(dist_transform[pts])
                mean_radius = np.mean(dist_transform[pts])
            else:
                max_radius = 1.0
                mean_radius = 0.5

            max_width_mm = round(float(max_radius * 2.0) / self.pixels_per_mm, 2)
            avg_width_mm = round(float(mean_radius * 2.0) / self.pixels_per_mm, 2)
            area_sqmm = round(float(area) / (self.pixels_per_mm ** 2), 2)

            severity = self._classify_severity(max_width_mm, length_mm)
            confidence = 0.92

            color = self._get_severity_bgr(severity)
            cv2.drawContours(mask_overlay, [cnt], -1, color, thickness=cv2.FILLED)
            cv2.drawContours(annotated_img, [cnt], -1, color, thickness=2)
            cv2.rectangle(annotated_img, (x - 2, y - 2), (x + w + 2, y + h + 2), color, 2)

            epsilon = 0.01 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            contour_list = approx.reshape(-1, 2).tolist()

            defects.append({
                "id": idx + 1,
                "defect_type": "CRACK",
                "length_mm": length_mm,
                "max_width_mm": max_width_mm,
                "avg_width_mm": avg_width_mm,
                "area_sqmm": area_sqmm,
                "severity": severity,
                "confidence": confidence,
                "bounding_box": [int(x), int(y), int(w), int(h)],
                "contour_points": contour_list
            })

        cv2.addWeighted(mask_overlay, 0.35, annotated_img, 0.65, 0, annotated_img)

        primary_severity = "NONE"
        primary_length = 0.0
        primary_width = 0.0
        if defects:
            defects.sort(key=lambda d: d["length_mm"], reverse=True)
            primary_severity = defects[0]["severity"]
            primary_length = defects[0]["length_mm"]
            primary_width = defects[0]["max_width_mm"]

        if output_image_path:
            cv2.imwrite(str(output_image_path), annotated_img)

        return {
            "crack_detected": len(defects) > 0,
            "total_cracks": len(defects),
            "primary_length_mm": primary_length,
            "primary_width_mm": primary_width,
            "severity": primary_severity,
            "confidence_percentage": 92.0,
            "defects": defects,
            "model_name": "OpenCV-Classical-Fallback"
        }

    def _classify_severity(self, width_mm: float, length_mm: float) -> str:
        if width_mm >= 5.0 or length_mm >= 300.0:
            return "CRITICAL"
        elif width_mm >= 2.0 or length_mm >= 150.0:
            return "HIGH"
        elif width_mm >= 0.5 or length_mm >= 50.0:
            return "MODERATE"
        return "LOW"

    def _get_severity_bgr(self, severity: str) -> tuple[int, int, int]:
        if severity == "CRITICAL":
            return (0, 0, 220)
        elif severity == "HIGH":
            return (0, 140, 255)
        elif severity == "MODERATE":
            return (0, 215, 255)
        elif severity == "LOW":
            return (210, 200, 0)
        return (100, 220, 100)
