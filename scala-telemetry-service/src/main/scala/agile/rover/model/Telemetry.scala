package agile.rover.model

import io.circe.{Codec, Decoder, Encoder, HCursor, Json}
import io.circe.generic.semiauto.*

/**
 * Raw telemetry packet received from autonomous crawler or simulated sensor feed.
 * Supports both camelCase and snake_case JSON field representations.
 */
final case class RoverTelemetry(
  roverCode: String = "ROVER-01",
  ambientTempC: Double = 26.5,
  humidityPct: Double = 55.0,
  roverTiltDeg: Double = 1.2,
  vibrationLevel: Double = 0.08,
  wifiSignalDbm: Int = -55,
  batteryPercentage: Double = 98.0,
  pitchDeg: Option[Double] = None,
  rollDeg: Option[Double] = None,
  standoffDistanceMm: Double = 250.0,
  timestampMs: Option[Long] = None
) {
  def effectiveTimestamp: Long = timestampMs.getOrElse(System.currentTimeMillis())
}

object RoverTelemetry {
  /**
   * Resilient decoder accepting either camelCase or snake_case key conventions.
   */
  given Decoder[RoverTelemetry] = (c: HCursor) => {
    def getDoubleField(camel: String, snake: String, default: Double): Double =
      c.downField(camel).as[Double]
        .orElse(c.downField(snake).as[Double])
        .getOrElse(default)

    def getIntField(camel: String, snake: String, default: Int): Int =
      c.downField(camel).as[Int]
        .orElse(c.downField(snake).as[Int])
        .getOrElse(default)

    def getOptDouble(camel: String, snake: String): Option[Double] =
      c.downField(camel).as[Double].toOption
        .orElse(c.downField(snake).as[Double].toOption)

    val roverCode = c.downField("roverCode").as[String]
      .orElse(c.downField("rover_code").as[String])
      .getOrElse("ROVER-01")

    val temp = getDoubleField("ambientTempC", "ambient_temp_c", 26.5)
    val humidity = getDoubleField("humidityPct", "humidity_pct", 55.0)
    val tilt = c.downField("roverTiltDeg").as[Double]
      .orElse(c.downField("rover_tilt_deg").as[Double])
      .orElse(c.downField("tilt_deg").as[Double])
      .getOrElse(1.2)
    val vibration = getDoubleField("vibrationLevel", "vibration_level", 0.08)
    val wifi = getIntField("wifiSignalDbm", "wifi_signal_dbm", -55)
    val battery = getDoubleField("batteryPercentage", "battery_percentage", 98.0)
    val pitch = getOptDouble("pitchDeg", "pitch_deg")
    val roll = getOptDouble("rollDeg", "roll_deg")
    val standoff = getDoubleField("standoffDistanceMm", "standoff_distance_mm", 250.0)
    val timestamp = c.downField("timestampMs").as[Long].toOption
      .orElse(c.downField("timestamp_ms").as[Long].toOption)

    Right(RoverTelemetry(
      roverCode = roverCode,
      ambientTempC = temp,
      humidityPct = humidity,
      roverTiltDeg = tilt,
      vibrationLevel = vibration,
      wifiSignalDbm = wifi,
      batteryPercentage = battery,
      pitchDeg = pitch,
      rollDeg = roll,
      standoffDistanceMm = standoff,
      timestampMs = timestamp
    ))
  }

  given Encoder[RoverTelemetry] = Encoder.instance { r =>
    Json.obj(
      "roverCode" -> Json.fromString(r.roverCode),
      "rover_code" -> Json.fromString(r.roverCode),
      "ambientTempC" -> Json.fromDoubleOrNull(r.ambientTempC),
      "ambient_temp_c" -> Json.fromDoubleOrNull(r.ambientTempC),
      "humidityPct" -> Json.fromDoubleOrNull(r.humidityPct),
      "humidity_pct" -> Json.fromDoubleOrNull(r.humidityPct),
      "roverTiltDeg" -> Json.fromDoubleOrNull(r.roverTiltDeg),
      "rover_tilt_deg" -> Json.fromDoubleOrNull(r.roverTiltDeg),
      "vibrationLevel" -> Json.fromDoubleOrNull(r.vibrationLevel),
      "vibration_level" -> Json.fromDoubleOrNull(r.vibrationLevel),
      "wifiSignalDbm" -> Json.fromInt(r.wifiSignalDbm),
      "wifi_signal_dbm" -> Json.fromInt(r.wifiSignalDbm),
      "batteryPercentage" -> Json.fromDoubleOrNull(r.batteryPercentage),
      "battery_percentage" -> Json.fromDoubleOrNull(r.batteryPercentage),
      "standoffDistanceMm" -> Json.fromDoubleOrNull(r.standoffDistanceMm),
      "standoff_distance_mm" -> Json.fromDoubleOrNull(r.standoffDistanceMm),
      "timestampMs" -> Json.fromLong(r.effectiveTimestamp),
      "timestamp_ms" -> Json.fromLong(r.effectiveTimestamp)
    )
  }
}

/**
 * Windowed aggregated telemetry computed across a sliding time/sample buffer.
 * Provides dual camelCase and snake_case attributes for client transparency.
 */
final case class AggregatedTelemetry(
  roverCode: String,
  avgTempC: Double,
  avgHumidityPct: Double,
  maxTiltDeg: Double,
  rmsVibration: Double,
  minWifiSignalDbm: Int,
  currentBatteryPct: Double,
  sampleCount: Int,
  anomalyDetected: Boolean,
  timestampMs: Long = System.currentTimeMillis()
)

object AggregatedTelemetry {
  given Encoder[AggregatedTelemetry] = Encoder.instance { a =>
    Json.obj(
      "roverCode" -> Json.fromString(a.roverCode),
      "rover_code" -> Json.fromString(a.roverCode),
      "avgTempC" -> Json.fromDoubleOrNull(a.avgTempC),
      "avg_temp_c" -> Json.fromDoubleOrNull(a.avgTempC),
      "avgHumidityPct" -> Json.fromDoubleOrNull(a.avgHumidityPct),
      "humidity_pct" -> Json.fromDoubleOrNull(a.avgHumidityPct),
      "maxTiltDeg" -> Json.fromDoubleOrNull(a.maxTiltDeg),
      "rover_tilt_deg" -> Json.fromDoubleOrNull(a.maxTiltDeg),
      "tilt_deg" -> Json.fromDoubleOrNull(a.maxTiltDeg),
      "rmsVibration" -> Json.fromDoubleOrNull(a.rmsVibration),
      "vibration_level" -> Json.fromDoubleOrNull(a.rmsVibration),
      "minWifiSignalDbm" -> Json.fromInt(a.minWifiSignalDbm),
      "wifi_signal_dbm" -> Json.fromInt(a.minWifiSignalDbm),
      "currentBatteryPct" -> Json.fromDoubleOrNull(a.currentBatteryPct),
      "battery_percentage" -> Json.fromDoubleOrNull(a.currentBatteryPct),
      "sampleCount" -> Json.fromInt(a.sampleCount),
      "anomalyDetected" -> Json.fromBoolean(a.anomalyDetected),
      "timestampMs" -> Json.fromLong(a.timestampMs),
      "timestamp_ms" -> Json.fromLong(a.timestampMs)
    )
  }

  given Decoder[AggregatedTelemetry] = deriveDecoder[AggregatedTelemetry]
}

/**
 * Real-time engineering safety alert triggered by stream threshold violations.
 */
final case class AnomalyAlert(
  roverCode: String,
  alertType: String,
  severity: String,
  message: String,
  measuredValue: Double,
  thresholdLimit: Double,
  timestampMs: Long = System.currentTimeMillis()
)

object AnomalyAlert {
  given Encoder[AnomalyAlert] = Encoder.instance { alert =>
    Json.obj(
      "roverCode" -> Json.fromString(alert.roverCode),
      "rover_code" -> Json.fromString(alert.roverCode),
      "alertType" -> Json.fromString(alert.alertType),
      "alert_type" -> Json.fromString(alert.alertType),
      "severity" -> Json.fromString(alert.severity),
      "message" -> Json.fromString(alert.message),
      "measuredValue" -> Json.fromDoubleOrNull(alert.measuredValue),
      "measured_value" -> Json.fromDoubleOrNull(alert.measuredValue),
      "thresholdLimit" -> Json.fromDoubleOrNull(alert.thresholdLimit),
      "threshold_limit" -> Json.fromDoubleOrNull(alert.thresholdLimit),
      "timestampMs" -> Json.fromLong(alert.timestampMs),
      "timestamp_ms" -> Json.fromLong(alert.timestampMs)
    )
  }

  given Decoder[AnomalyAlert] = deriveDecoder[AnomalyAlert]
}

/**
 * Summary status snapshot returned by the Scala telemetry engine.
 */
final case class PipelineStats(
  engine: String = "Apache-Pekko-Scala3-Stream-Engine",
  status: String = "RUNNING",
  totalIngestedCount: Long,
  activeSubscribers: Int,
  historyCount: Int,
  lastAggregation: Option[AggregatedTelemetry],
  activeAlerts: List[AnomalyAlert],
  uptimeSeconds: Long
) derives Codec.AsObject
