# ESP32-CAM Autonomous Structural Inspection Crawler Firmware

This directory contains the production-ready embedded firmware for the physical **ESP32 Crawler Rover** node.

---

## Hardware Bill of Materials (BOM)

| Component | Purpose | Recommended Model |
| :--- | :--- | :--- |
| **Microcontroller / Vision Sensor** | Image capture & Wi-Fi communication | ESP32-CAM (AI-Thinker module with OV2640 2MP lens) |
| **Crawler Chassis & Motors** | Wall surface inspection movement | Tank/Crawler rubber track chassis with dual TT gearmotors |
| **Motor Driver** | Dual DC motor control (H-Bridge) | L298N or TB6612FNG Dual Driver |
| **Ranging Sensor** | Wall standoff distance for millimeter calibration | HC-SR04 / HC-SR04P Ultrasonic Sensor (or VL53L0X ToF) |
| **IMU / Motion Sensor** | Wall tilt angle and vibration measurement | MPU-6050 6-Axis Gyro/Accelerometer |
| **Environmental Sensor** | Ambient temperature & relative humidity | DHT11 or DHT22 digital sensor |
| **Power Supply** | Independent logic and motor power | 2x 18650 Li-ion cells (7.4V) with buck converter (5V output) |
| **Illumination** | Macro wall crack lighting | Onboard Flash LED (GPIO 4) or 5V LED cob array |

---

## Pinout & Wiring Connections

### 1. OV2640 Camera
Connected internally on the AI-Thinker board to standard camera GPIOs (`Y2`–`Y9`, `VSYNC`, `HREF`, `PCLK`, `SIOD`, `SIOC`).

### 2. HC-SR04 Ultrasonic Sensor
- `VCC` -> `5V`
- `GND` -> `GND`
- `TRIG` -> `GPIO 12`
- `ECHO` -> `GPIO 13` *(Use voltage divider if running at 5V)*

### 3. L298N Motor Driver
- `IN1` (Left Forward) -> `GPIO 14`
- `IN2` (Left Backward) -> `GPIO 15`
- `IN3` (Right Forward) -> `GPIO 2`
- `IN4` (Right Backward) -> `GPIO 4`
- `OUT1/OUT2` -> Left Track Motor
- `OUT3/OUT4` -> Right Track Motor
- `GND` -> Common System Ground

---

## Flashing Instructions

1. Install the **Arduino IDE** (v2.0+) or **PlatformIO** in VS Code.
2. In Arduino IDE Preferences, add the ESP32 board manager URL:
   `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Install **ESP32 by Espressif Systems** via Boards Manager.
4. Install required libraries:
   - `ArduinoJson` (v6.x or v7.x)
5. Select Board: **AI Thinker ESP32-CAM**.
6. Set CPU Frequency: **240MHz (WiFi/BT)**, Flash Mode: **QIO**, Partition Scheme: **Huge APP (3MB No OTA / 1MB SPIFFS)**.
7. Open `firmware/esp32_cam_rover/esp32_cam_rover.ino`.
8. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `BACKEND_HOST` (e.g. `http://192.168.1.50:8000`).
9. Connect `GPIO 0` to `GND`, press reset button on the ESP32-CAM, and click **Upload**.
10. Once flashed, disconnect `GPIO 0` from `GND`, reset the board, and open the Serial Monitor at `115200 baud`.

---

## REST API Interaction Protocol

The firmware communicates directly with the following FastAPI endpoints:

1. **Device Handshake & Registration:**
   - `POST /api/rover/connect`
   - Sends: `rover_code`, `name`, `ip_address`, `port`, `firmware_version`
   - Receives: Registered status, battery target, and `active_inspection_id`.

2. **Telemetry Heartbeat:**
   - `POST /api/rover/telemetry`
   - Periodic updates every 5 seconds: `battery_percentage`, `wifi_signal_dbm`, `tilt_deg`, `vibration_level`.

3. **Inspection Image & Sensor Packet:**
   - `POST /api/images/upload`
   - Multipart form-data sending:
     - `inspection_id`: Current active inspection session ID.
     - `distance_to_wall_mm`: Measured standoff distance (used for sub-pixel crack aperture scaling).
     - `ambient_temp_c`: Wall surface temperature.
     - `humidity_pct`: Relative humidity.
     - `rover_tilt_deg`: Chassis inclination.
     - `vibration_level`: RMS vibration magnitude.
     - `file`: Raw JPEG camera frame (`rover_frame.jpg`).
