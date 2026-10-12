import os
import random
import numpy as np
import cv2
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.rover import Rover
from app.models.inspection import Inspection
from app.config import settings

class RoverService:
    """
    Manages ESP32 Wi-Fi Rover connection, telemetry streaming,
    command dispatch, and synthetic test-image synthesis for hardware-in-the-loop simulation.
    """

    @staticmethod
    def connect_rover(db: Session, rover_code: str, ip_address: str = "192.168.4.1", port: int = 8080, name: str = "ESP32 Crawler") -> Rover:
        rover = db.query(Rover).filter(Rover.rover_code == rover_code).first()
        if not rover:
            rover = Rover(
                rover_code=rover_code,
                name=name,
                ip_address=ip_address,
                port=port,
                battery_percentage=98.0,
                status="CONNECTED",
                wifi_signal_dbm=-54,
                firmware_version="v2.4.1-ESP32-CAM",
                last_seen_at=datetime.now(timezone.utc)
            )
            db.add(rover)
        else:
            rover.ip_address = ip_address
            rover.port = port
            rover.status = "CONNECTED"
            rover.last_seen_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(rover)
        return rover

    @staticmethod
    def get_status(db: Session, rover_code: str = "ROVER-01") -> Optional[Rover]:
        rover = db.query(Rover).filter(Rover.rover_code == rover_code).first()
        if not rover:
            # Create a default registered rover if not present
            rover = RoverService.connect_rover(db, rover_code)
        return rover

    @staticmethod
    def generate_synthetic_wall_image(output_path: str, add_crack: bool = True, crack_severity: str = "MODERATE") -> str:
        """
        Synthesizes a realistic high-definition concrete wall image with surface texture
        and procedural crack patterns for testing, demo, and prototype verification.
        """
        w, h = 1280, 720
        # Base concrete gray with Gaussian texture
        base_gray = np.random.normal(185, 12, (h, w)).clip(130, 240).astype(np.uint8)
        
        # Colorize to concrete warm-gray BGR
        b = (base_gray * 0.96).clip(0, 255).astype(np.uint8)
        g = (base_gray * 0.98).clip(0, 255).astype(np.uint8)
        r = (base_gray * 1.00).clip(0, 255).astype(np.uint8)
        canvas = cv2.merge([b, g, r])

        # Add plaster noise and aggregate spots
        for _ in range(400):
            spot_x = random.randint(0, w - 1)
            spot_y = random.randint(0, h - 1)
            radius = random.randint(1, 4)
            color_val = random.randint(70, 150)
            cv2.circle(canvas, (spot_x, spot_y), radius, (color_val, color_val, color_val), -1)

        if add_crack:
            # Procedural branching crack synthesis
            num_branches = 2 if crack_severity in ["HIGH", "CRITICAL"] else 1
            start_x = random.randint(250, 450)
            start_y = random.randint(150, 250)

            thickness = 2
            if crack_severity == "CRITICAL":
                thickness = 7
            elif crack_severity == "HIGH":
                thickness = 4
            elif crack_severity == "MODERATE":
                thickness = 2
            else:
                thickness = 1

            for _ in range(num_branches):
                curr_x = start_x + random.randint(-40, 40)
                curr_y = start_y + random.randint(-40, 40)
                points = [(curr_x, curr_y)]
                steps = random.randint(35, 75)

                for _ in range(steps):
                    curr_x += random.randint(5, 16)
                    curr_y += random.randint(-8, 12)
                    curr_x = max(10, min(w - 10, curr_x))
                    curr_y = max(10, min(h - 10, curr_y))
                    points.append((curr_x, curr_y))

                # Draw irregular crack line
                pts_arr = np.array(points, np.int32).reshape((-1, 1, 2))
                # Dark crack core
                cv2.polylines(canvas, [pts_arr], False, (35, 30, 28), thickness, cv2.LINE_AA)
                # Outer shadow edge
                cv2.polylines(canvas, [pts_arr], False, (75, 70, 68), thickness + 2, cv2.LINE_AA)

        cv2.imwrite(str(output_path), canvas)
        return output_path
