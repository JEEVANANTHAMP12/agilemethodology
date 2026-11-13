# Main ESP32 DevKit (30-Pin) Autonomous Rover Firmware

This directory contains the production-ready embedded firmware for the **Main ESP32 DevKit V1 (30-pin)** board controlling the autonomous crawler chassis, ultrasonic collision avoidance, capacitive soil moisture sensor, DHT11 environmental sensor, and Wi-Fi teleoperation.

---

## 1. Key Improvements over Legacy Firmware

1. **FreeRTOS Dual-Core Concurrency**:
   - **Core 1 (Real-Time Safety Loop)**: Dedicated strictly to motor control, 20 Hz ultrasonic scanning, and instant emergency braking.
   - **Core 0 (Networking & Telemetry Task)**: Handles Wi-Fi connection, non-blocking HTTP POST telemetry uploads, and the Web Controller server.
   - *Result: Network latency or HTTP timeouts NEVER freeze the robot or delay emergency obstacle stops.*
2. **Built-in Mobile Web Controller & REST API (Port 80)**:
   - Connect any phone or laptop browser on the same Wi-Fi to `http://<ESP32_IP>/` for an interactive touch D-pad and live sensor meters.
   - REST control endpoints: `GET /control?cmd=F|B|L|R|S`.
3. **Deadman Watchdog Fail-Safe**:
   - Auto-stops motors if no fresh drive command arrives within 1.2 seconds, preventing runaway crashes if Wi-Fi disconnects while moving.
4. **Ultrasonic Glitch Rejection**:
   - 3-sample median filter with 25ms timeout eliminates acoustic reflections and false emergency stops.
5. **Calibrated Soil Moisture**:
   - Calculates calibrated percentage (`0%–100%`) alongside raw 12-bit ADC values.
6. **Dual Server Support**:
   - Telemetry payload is automatically compatible with both generic Flask servers (`/telemetry`) and the FastAPI / Scala reactive stream backend (`/api/telemetry/ingest`).

---

## 2. Pinout & Hardware Connections

### A. Dual L298N Motor Drivers (4 DC Gearmotors)

| Driver | Pin Label | ESP32 GPIO | Description |
| :--- | :--- | :--- | :--- |
| **L298N #1 (Left)** | `IN1` | `GPIO 16` | Left Motors Forward |
| | `IN2` | `GPIO 17` | Left Motors Reverse |
| | `IN3` | `GPIO 18` | Left Motors Forward |
| | `IN4` | `GPIO 19` | Left Motors Reverse |
| **L298N #2 (Right)** | `IN1` | `GPIO 25` | Right Motors Forward |
| | `IN2` | `GPIO 26` | Right Motors Reverse |
| | `IN3` | `GPIO 27` | Right Motors Forward |
| | `IN4` | `GPIO 32` | Right Motors Reverse |

> **Note on ENA/ENB Jumpers:** Keep the 5V enable jumpers installed on both L298N boards for 100% full-speed direction switching.

---

### B. Sensors

| Sensor | Sensor Pin | ESP32 GPIO | Electrical Notes |
| :--- | :--- | :--- | :--- |
| **HC-SR04** | `TRIG` | `GPIO 4` | Direct 3.3V drive from ESP32 |
| | `ECHO` | `GPIO 35` | **MUST use a Voltage Divider!** (ECHO outputs 5V logic; GPIO 35 is 3.3V max) |
| **Soil Moisture** | `AOUT` | `GPIO 34` | Connected to ADC1_CH6 (Safe with Wi-Fi active) |
| **DHT11** | `DATA` | `GPIO 33` | Digital I/O (Ensure 4.7k–10k pull-up resistor to 3.3V) |
| **Status LED** | Onboard | `GPIO 2` | Solid ON = Wi-Fi Connected; Blinking = Connecting |

---

## 3. HC-SR04 5V to 3.3V Voltage Divider Diagram

```text
HC-SR04 ECHO (5V) ──────[ 1 kΩ Resistor ]──────┬──────> ESP32 GPIO 35 (3.3V logic)
                                               │
                                       [ 2 kΩ Resistor ]
                                               │
                                              GND
```

---

## 4. Flashing Instructions (Arduino IDE)

1. **Board Selection**: Select `DOIT ESP32 DEVKIT V1` (or `ESP32 Dev Module`).
2. **Install Required Libraries** (Tools -> Manage Libraries):
   - `DHT sensor library` by Adafruit
   - `Adafruit Unified Sensor`
3. **Configure Wi-Fi & Server IP** in `esp32_main_rover.ino`:
   ```cpp
   const char* WIFI_SSID     = "JEEVA";
   const char* WIFI_PASSWORD = "jeeva9092";
   const char* SERVER_HOST   = "192.168.1.100"; // Your laptop IP
   const int   SERVER_PORT   = 5000;            // 5000 for Flask, 8000 for FastAPI
   ```
4. **Upload** and open Serial Monitor at **115200 baud**.

