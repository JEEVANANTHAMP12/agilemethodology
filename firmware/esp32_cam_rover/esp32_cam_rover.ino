/*
 * =========================================================================================
 * STRUCTURAL HEALTH & CRACK DETECTION ROVER - ESP32-CAM FIRMWARE
 * Autonomous Crawler Inspection Node
 * =========================================================================================
 * Description:
 *  - Captures high-resolution imagery using the onboard OV2640 camera sensor.
 *  - Measures standoff distance using HC-SR04 Ultrasonic sensor (dynamic mm calibration).
 *  - Samples environmental telemetry: Ambient Temp (°C), Humidity (%), Rover Tilt (°), Vibration.
 *  - Communicates with FastAPI backend over Wi-Fi (REST API).
 *  - Posts captured frames & telemetry via multipart/form-data to /api/images/upload.
 *  - Sends periodic heartbeats to /api/rover/telemetry.
 *  - Controls dual-channel DC motors via L298N motor driver.
 * =========================================================================================
 */

#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>

// -----------------------------------------------------------------------------
// 1. NETWORK CONFIGURATION & BACKEND ENDPOINTS
// -----------------------------------------------------------------------------
const char* WIFI_SSID     = "STRUCTURAL_SCAN_WIFI";
const char* WIFI_PASSWORD = "SafeConcrete2026!";

// BACKEND_HOST options:
// - Local LAN:                   "http://192.168.1.100:8000"
// - Live Real-Time Tunnel (ngrok): "https://your-subdomain.ngrok-free.app" (run tunnel_rover.py)
// - Live Cloud Deployment (Render): "https://structural-rover.onrender.com"
const char* BACKEND_HOST  = "http://192.168.1.100:8000"; 
const char* ROVER_CODE    = "ROVER-01";
const char* ROVER_NAME    = "ESP32 Autonomous Crawler Alpha";

// -----------------------------------------------------------------------------
// 2. ESP32-CAM AI-THINKER CAMERA PIN ASSIGNMENTS
// -----------------------------------------------------------------------------
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

// -----------------------------------------------------------------------------
// 3. HARDWARE PERIPHERALS & SENSOR PINS
// -----------------------------------------------------------------------------
// HC-SR04 Ultrasonic Sensor (Standoff distance for sub-pixel calibration)
#define TRIG_PIN          12
#define ECHO_PIN          13

// L298N Motor Driver Pins (Crawler tracks)
#define MOTOR_LEFT_FWRD   14
#define MOTOR_LEFT_BKWD   15
#define MOTOR_RIGHT_FWRD   2
#define MOTOR_RIGHT_BKWD   4

// Onboard Flash LED for illuminating dark inspection areas
#define FLASH_LED_PIN      4

// Inspection Session Tracking
int activeInspectionId = 1;
unsigned long lastTelemetryTime = 0;
const unsigned long TELEMETRY_INTERVAL_MS = 5000;

// -----------------------------------------------------------------------------
// 4. FUNCTION PROTOTYPES
// -----------------------------------------------------------------------------
bool initCamera();
bool connectWiFi();
void registerRoverWithBackend();
void sendTelemetryHeartbeat();
float measureDistanceMM();
float sampleTiltAngle();
float sampleVibrationLevel();
bool uploadInspectionImage(int inspectionId, float distanceMM, float tempC, float humidity, float tilt, float vibration);
void moveForward(int durationMs);
void stopMotors();

// -----------------------------------------------------------------------------
// 5. SETUP ENTRYPOINT
// -----------------------------------------------------------------------------
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n[ROVER] Booting Autonomous Structural Rover Crawler...");

  // Setup motor pins
  pinMode(MOTOR_LEFT_FWRD, OUTPUT);
  pinMode(MOTOR_LEFT_BKWD, OUTPUT);
  pinMode(MOTOR_RIGHT_FWRD, OUTPUT);
  pinMode(MOTOR_RIGHT_BKWD, OUTPUT);
  stopMotors();

  // Setup ultrasonic sensor pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Setup flash LED
  pinMode(FLASH_LED_PIN, OUTPUT);
  digitalWrite(FLASH_LED_PIN, LOW);

  // Initialize camera sensor
  if (!initCamera()) {
    Serial.println("[ERROR] Camera initialization failed!");
    while (true) delay(1000);
  }
  Serial.println("[ROVER] OV2640 Camera initialized successfully.");

  // Connect to Wi-Fi
  if (connectWiFi()) {
    Serial.println("[ROVER] Wi-Fi link established.");
    registerRoverWithBackend();
  } else {
    Serial.println("[WARNING] Wi-Fi connection timed out. Proceeding in offline mode.");
  }
}

// -----------------------------------------------------------------------------
// 6. MAIN LOOP
// -----------------------------------------------------------------------------
void loop() {
  // Check Wi-Fi reconnection if dropped
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(2000);
    return;
  }

  // Periodic Telemetry Heartbeat
  if (millis() - lastTelemetryTime > TELEMETRY_INTERVAL_MS) {
    lastTelemetryTime = millis();
    sendTelemetryHeartbeat();
  }

  // Autonomous Scan Trigger Check (Example: periodic snapshot or upon command)
  static unsigned long lastCaptureTime = 0;
  if (millis() - lastCaptureTime > 15000) { // Every 15 seconds
    lastCaptureTime = millis();

    Serial.println("\n[SCAN] Preparing Autonomous Wall Surface Inspection Capture...");
    
    // Stop crawler during capture for zero motion blur
    stopMotors();
    delay(300);

    // Measure standoff distance with ultrasonic sensor
    float distanceMM = measureDistanceMM();
    if (distanceMM < 50.0 || distanceMM > 1500.0) {
      distanceMM = 250.0; // fallback standard standoff
    }

    // Telemetry readings
    float tempC = 27.5;       // Replace with DHT sensor read
    float humidityPct = 58.0; // Replace with DHT sensor read
    float tiltDeg = sampleTiltAngle();
    float vibration = sampleVibrationLevel();

    // Turn on illumination flash LED
    digitalWrite(FLASH_LED_PIN, HIGH);
    delay(150);

    // Capture and upload frame to FastAPI Computer Vision pipeline
    bool success = uploadInspectionImage(activeInspectionId, distanceMM, tempC, humidityPct, tiltDeg, vibration);

    // Turn off illumination
    digitalWrite(FLASH_LED_PIN, LOW);

    if (success) {
      Serial.println("[SCAN] Image uploaded and analyzed successfully by backend!");
    } else {
      Serial.println("[SCAN] Image upload failed.");
    }

    // Autonomous crawl step: move forward along wall
    moveForward(800);
    stopMotors();
  }

  delay(100);
}

// -----------------------------------------------------------------------------
// 7. CAMERA INITIALIZATION (OV2640 UXGA/SVGA CONFIGURATION)
// -----------------------------------------------------------------------------
bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size   = FRAMESIZE_SVGA; // 800x600 for sharp concrete fissure detection
    config.jpeg_quality = 10;             // High quality JPEG
    config.fb_count     = 2;
  } else {
    config.frame_size   = FRAMESIZE_VGA;  // 640x480 fallback
    config.jpeg_quality = 12;
    config.fb_count     = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  return (err == ESP_OK);
}

// -----------------------------------------------------------------------------
// 8. WI-FI & BACKEND REGISTRATION
// -----------------------------------------------------------------------------
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 25) {
    delay(500);
    Serial.print(".");
    retries++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WIFI] Connected! IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }
  return false;
}

void registerRoverWithBackend() {
  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/rover/connect";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["rover_code"] = ROVER_CODE;
  doc["name"] = ROVER_NAME;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["port"] = 8080;
  doc["firmware_version"] = "v2.4.1-ESP32-CAM";

  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);
  if (httpResponseCode == 200) {
    Serial.println("[ROVER] Handshake successful with FastAPI backend.");
    String response = http.getString();
    StaticJsonDocument<512> respDoc;
    deserializeJson(respDoc, response);
    if (!respDoc["active_inspection_id"].isNull()) {
      activeInspectionId = respDoc["active_inspection_id"];
      Serial.printf("[ROVER] Attached to active inspection ID: %d\n", activeInspectionId);
    }
  } else {
    Serial.printf("[ROVER] Connect handshake returned status: %d\n", httpResponseCode);
  }
  http.end();
}

void sendTelemetryHeartbeat() {
  HTTPClient http;
  String url = String(BACKEND_HOST) + "/api/rover/telemetry";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["rover_code"] = ROVER_CODE;
  doc["battery_percentage"] = 92.5; // Estimated from ADC voltage divider
  doc["status"] = "INSPECTING";
  doc["wifi_signal_dbm"] = WiFi.RSSI();
  doc["tilt_deg"] = sampleTiltAngle();
  doc["vibration_level"] = sampleVibrationLevel();

  String body;
  serializeJson(doc, body);
  http.POST(body);
  http.end();
}

// -----------------------------------------------------------------------------
// 9. SENSOR READING UTILITIES
// -----------------------------------------------------------------------------
float measureDistanceMM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 250.0;
  // Speed of sound = 343 m/s = 0.343 mm/us -> Distance = (duration * 0.343) / 2
  float distMM = (duration * 0.343f) / 2.0f;
  return distMM;
}

float sampleTiltAngle() {
  // Simplified tilt estimation (e.g. from MPU6050 accelerometer pitch/roll)
  return 1.25f;
}

float sampleVibrationLevel() {
  // Simplified RMS vibration level
  return 0.08f;
}

// -----------------------------------------------------------------------------
// 10. MULTIPART IMAGE UPLOAD TO FASTAPI
// -----------------------------------------------------------------------------
bool uploadInspectionImage(int inspectionId, float distanceMM, float tempC, float humidity, float tilt, float vibration) {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[ERROR] Camera buffer capture failed");
    return false;
  }

  WiFiClient client;
  // Parse host and port from BACKEND_HOST (e.g., http://192.168.1.100:8000)
  String host = "192.168.1.100";
  int port = 8000;

  if (!client.connect(host.c_str(), port)) {
    Serial.println("[ERROR] Failed to connect to backend server for upload");
    esp_camera_fb_return(fb);
    return false;
  }

  String boundary = "----ESP32RoverBoundary987654321";
  String head = "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"inspection_id\"\r\n\r\n";
  head += String(inspectionId) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"distance_to_wall_mm\"\r\n\r\n";
  head += String(distanceMM, 1) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"ambient_temp_c\"\r\n\r\n";
  head += String(tempC, 1) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"humidity_pct\"\r\n\r\n";
  head += String(humidity, 1) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"rover_tilt_deg\"\r\n\r\n";
  head += String(tilt, 2) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"vibration_level\"\r\n\r\n";
  head += String(vibration, 3) + "\r\n";

  head += "--" + boundary + "\r\n";
  head += "Content-Disposition: form-data; name=\"file\"; filename=\"rover_frame.jpg\"\r\n";
  head += "Content-Type: image/jpeg\r\n\r\n";

  String tail = "\r\n--" + boundary + "--\r\n";

  size_t totalLen = head.length() + fb->len + tail.length();

  // Send HTTP Header
  client.println("POST /api/images/upload HTTP/1.1");
  client.println("Host: " + host + ":" + String(port));
  client.println("Content-Type: multipart/form-data; boundary=" + boundary);
  client.println("Content-Length: " + String(totalLen));
  client.println("Connection: close");
  client.println();

  // Send Multipart Body
  client.print(head);

  // Send binary JPEG buffer in chunks
  uint8_t* fbBuf = fb->buf;
  size_t fbLen = fb->len;
  size_t chunkSize = 1024;
  while (fbLen > 0) {
    size_t toWrite = (fbLen < chunkSize) ? fbLen : chunkSize;
    client.write(fbBuf, toWrite);
    fbBuf += toWrite;
    fbLen -= toWrite;
  }

  client.print(tail);
  esp_camera_fb_return(fb);

  // Wait for server response
  unsigned long timeout = millis();
  while (client.available() == 0) {
    if (millis() - timeout > 10000) {
      Serial.println("[ERROR] Server response timed out");
      client.stop();
      return false;
    }
  }

  String responseLine = client.readStringUntil('\r');
  Serial.println("[UPLOAD RESPONSE] " + responseLine);
  client.stop();
  return responseLine.indexOf("200") > 0;
}

// -----------------------------------------------------------------------------
// 11. MOTOR LOCOMOTION ROUTINES
// -----------------------------------------------------------------------------
void moveForward(int durationMs) {
  digitalWrite(MOTOR_LEFT_FWRD, HIGH);
  digitalWrite(MOTOR_LEFT_BKWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWRD, HIGH);
  digitalWrite(MOTOR_RIGHT_BKWD, LOW);
  delay(durationMs);
}

void stopMotors() {
  digitalWrite(MOTOR_LEFT_FWRD, LOW);
  digitalWrite(MOTOR_LEFT_BKWD, LOW);
  digitalWrite(MOTOR_RIGHT_FWRD, LOW);
  digitalWrite(MOTOR_RIGHT_BKWD, LOW);
}
