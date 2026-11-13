package agile.rover

import agile.rover.model.*
import agile.rover.stream.TelemetryStreamEngine
import io.circe.parser.decode
import io.circe.syntax.*
import munit.FunSuite
import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors

class TelemetrySpec extends FunSuite {
  // Initialize SLF4J synchronously before ActorSystem starts threads
  org.slf4j.LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME)

  test("RoverTelemetry decodes camelCase JSON correctly") {
    val json =
      """{
        |  "roverCode": "ROVER-ALPHA",
        |  "ambientTempC": 28.4,
        |  "humidityPct": 62.1,
        |  "roverTiltDeg": 2.3,
        |  "vibrationLevel": 0.12,
        |  "wifiSignalDbm": -58,
        |  "batteryPercentage": 89.5
        |}""".stripMargin

    val result = decode[RoverTelemetry](json)
    assert(result.isRight)
    val telemetry = result.toOption.get
    assertEquals(telemetry.roverCode, "ROVER-ALPHA")
    assertEquals(telemetry.ambientTempC, 28.4)
    assertEquals(telemetry.humidityPct, 62.1)
    assertEquals(telemetry.roverTiltDeg, 2.3)
    assertEquals(telemetry.vibrationLevel, 0.12)
    assertEquals(telemetry.wifiSignalDbm, -58)
    assertEquals(telemetry.batteryPercentage, 89.5)
  }

  test("RoverTelemetry decodes snake_case JSON correctly") {
    val json =
      """{
        |  "rover_code": "ROVER-02",
        |  "ambient_temp_c": 31.0,
        |  "humidity_pct": 48.5,
        |  "rover_tilt_deg": 1.7,
        |  "vibration_level": 0.09,
        |  "wifi_signal_dbm": -63,
        |  "battery_percentage": 94.0
        |}""".stripMargin

    val result = decode[RoverTelemetry](json)
    assert(result.isRight)
    val telemetry = result.toOption.get
    assertEquals(telemetry.roverCode, "ROVER-02")
    assertEquals(telemetry.ambientTempC, 31.0)
    assertEquals(telemetry.humidityPct, 48.5)
    assertEquals(telemetry.roverTiltDeg, 1.7)
    assertEquals(telemetry.vibrationLevel, 0.09)
    assertEquals(telemetry.wifiSignalDbm, -63)
    assertEquals(telemetry.batteryPercentage, 94.0)
  }

  test("AggregatedTelemetry encodes dual camelCase and snake_case keys") {
    val agg = AggregatedTelemetry(
      roverCode = "ROVER-01",
      avgTempC = 27.2,
      avgHumidityPct = 52.0,
      maxTiltDeg = 1.4,
      rmsVibration = 0.11,
      minWifiSignalDbm = -56,
      currentBatteryPct = 91.0,
      sampleCount = 10,
      anomalyDetected = false
    )

    val jsonStr = agg.asJson.noSpaces
    assert(jsonStr.contains("\"avgTempC\":27.2"))
    assert(jsonStr.contains("\"avg_temp_c\":27.2"))
    assert(jsonStr.contains("\"maxTiltDeg\":1.4"))
    assert(jsonStr.contains("\"rover_tilt_deg\":1.4"))
    assert(jsonStr.contains("\"rmsVibration\":0.11"))
    assert(jsonStr.contains("\"vibration_level\":0.11"))
  }

  test("TelemetryStreamEngine computes correct aggregates and detects tilt anomaly") {
    given system: ActorSystem[Any] = ActorSystem(Behaviors.empty, "test-system")
    val engine = new TelemetryStreamEngine(windowSize = 3)

    val samples = List(
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 20.0, humidityPct = 50.0, roverTiltDeg = 1.0, vibrationLevel = 0.10, wifiSignalDbm = -50, batteryPercentage = 80.0),
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 22.0, humidityPct = 52.0, roverTiltDeg = 2.0, vibrationLevel = 0.10, wifiSignalDbm = -52, batteryPercentage = 80.0),
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 24.0, humidityPct = 54.0, roverTiltDeg = 6.2, vibrationLevel = 0.10, wifiSignalDbm = -54, batteryPercentage = 80.0)
    )

    val agg = engine.processWindow(samples)
    assertEquals(agg.roverCode, "ROVER-01")
    assertEquals(agg.avgTempC, 22.0)
    assertEquals(agg.avgHumidityPct, 52.0)
    assertEquals(agg.maxTiltDeg, 6.2)
    assert(agg.anomalyDetected, "Anomaly should be flagged when tilt > 5.0 deg")

    val stats = engine.getStats
    assert(stats.activeAlerts.exists(_.alertType == "TILT_THRESHOLD_BREACH"))

    system.terminate()
  }

  test("TelemetryStreamEngine detects vibration RMS anomaly") {
    given system: ActorSystem[Any] = ActorSystem(Behaviors.empty, "test-system-vib")
    val engine = new TelemetryStreamEngine(windowSize = 2)

    val samples = List(
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 25.0, humidityPct = 50.0, roverTiltDeg = 1.0, vibrationLevel = 0.50, wifiSignalDbm = -50, batteryPercentage = 75.0),
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 25.0, humidityPct = 50.0, roverTiltDeg = 1.0, vibrationLevel = 0.45, wifiSignalDbm = -50, batteryPercentage = 75.0)
    )

    val agg = engine.processWindow(samples)
    assert(agg.anomalyDetected)
    assert(agg.rmsVibration > 0.40)

    val stats = engine.getStats
    assert(stats.activeAlerts.exists(_.alertType == "HIGH_VIBRATION_RMS"))

    system.terminate()
  }

  test("TelemetryStreamEngine detects low battery and thermal overheat anomalies") {
    given system: ActorSystem[Any] = ActorSystem(Behaviors.empty, "test-system-batt-temp")
    val engine = new TelemetryStreamEngine(windowSize = 2)

    val samples = List(
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 48.0, humidityPct = 50.0, roverTiltDeg = 1.0, vibrationLevel = 0.10, wifiSignalDbm = -50, batteryPercentage = 12.5),
      RoverTelemetry(roverCode = "ROVER-01", ambientTempC = 49.0, humidityPct = 50.0, roverTiltDeg = 1.0, vibrationLevel = 0.10, wifiSignalDbm = -50, batteryPercentage = 12.0)
    )

    val agg = engine.processWindow(samples)
    assert(agg.anomalyDetected)
    assertEquals(agg.avgTempC, 48.5)
    assertEquals(agg.currentBatteryPct, 12.0)

    val stats = engine.getStats
    assert(stats.activeAlerts.exists(_.alertType == "LOW_BATTERY_RESERVE"), "Should trigger LOW_BATTERY_RESERVE for < 15.0%")
    assert(stats.activeAlerts.exists(_.alertType == "THERMAL_OVERHEAT"), "Should trigger THERMAL_OVERHEAT for > 45.0C")

    system.terminate()
  }
}
