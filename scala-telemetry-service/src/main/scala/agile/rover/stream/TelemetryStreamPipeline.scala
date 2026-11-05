package agile.rover.stream

import agile.rover.model.*
import org.apache.pekko.NotUsed
import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.stream.{OverflowStrategy, QueueOfferResult}
import org.apache.pekko.stream.scaladsl.{BroadcastHub, Keep, Sink, Source, SourceQueueWithComplete}

import java.util.concurrent.ConcurrentLinkedDeque
import java.util.concurrent.atomic.{AtomicInteger, AtomicLong, AtomicReference}
import scala.concurrent.{ExecutionContext, Future}
import scala.jdk.CollectionConverters.*

class TelemetryStreamPipeline(windowSize: Int = 10, maxHistory: Int = 50)(using system: ActorSystem[?]) {
  given ExecutionContext = system.executionContext

  private val startTimeMs: Long = System.currentTimeMillis()
  private val totalIngested = new AtomicLong(0)
  private val activeSubscribers = new AtomicInteger(0)
  private val lastAggregationRef = new AtomicReference[Option[AggregatedTelemetry]](None)
  private val activeAlertsRef = new AtomicReference[List[AnomalyAlert]](Nil)
  private val historyBuffer = new ConcurrentLinkedDeque[AggregatedTelemetry]()

  // 1. Reactive Source Queue with backpressure strategy: dropHead prevents queue lag (buffer: 512)
  private val (queue: SourceQueueWithComplete[RoverTelemetry], broadcastSource: Source[AggregatedTelemetry, NotUsed]) =
    Source
      .queue[RoverTelemetry](bufferSize = 512, OverflowStrategy.dropHead)
      // Sliding window over N telemetry samples, stepping 1 sample at a time
      .sliding(windowSize, step = 1)
      .map(window => processWindow(window))
      // Wire a broadcast hub so multiple WebSocket clients share the stream with low fan-out overhead
      .toMat(BroadcastHub.sink[AggregatedTelemetry](bufferSize = 256))(Keep.both)
      .run()

  // 2. Consume broadcast internally to keep latest stats and history updated
  broadcastSource.runWith(
    Sink.foreach { agg =>
      lastAggregationRef.set(Some(agg))
      historyBuffer.addLast(agg)
      while (historyBuffer.size() > maxHistory) {
        historyBuffer.pollFirst()
      }
    }
  )

  /**
   * Evaluates rolling aggregates and anomaly alerts across a sample window.
   */
  def processWindow(window: collection.Seq[RoverTelemetry]): AggregatedTelemetry = {
    if (window.isEmpty) {
      AggregatedTelemetry(
        roverCode = "ROVER-01",
        avgTempC = 26.5,
        avgHumidityPct = 55.0,
        maxTiltDeg = 1.2,
        rmsVibration = 0.08,
        minWifiSignalDbm = -55,
        currentBatteryPct = 98.0,
        sampleCount = 0,
        anomalyDetected = false
      )
    } else {
      val count = window.size
      val roverCode = window.last.roverCode
      val avgTemp = (window.map(_.ambientTempC).sum / count * 10).round / 10.0
      val avgHumidity = (window.map(_.humidityPct).sum / count * 10).round / 10.0
      val maxTilt = (window.map(_.roverTiltDeg).max * 10).round / 10.0
      val rmsVib = (Math.sqrt(window.map(t => t.vibrationLevel * t.vibrationLevel).sum / count) * 100).round / 100.0
      val minWifi = window.map(_.wifiSignalDbm).min
      val currentBatt = (window.last.batteryPercentage * 10).round / 10.0

      // Dynamic Anomaly Rules conforming to Agile Rover safety envelopes
      var anomalies: List[AnomalyAlert] = Nil

      // 1. Crawler Slope / Incline rollover risk
      if (maxTilt > 5.0) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "TILT_THRESHOLD_BREACH",
          severity = "CRITICAL",
          message = s"Crawler tilt reached ${maxTilt}°, exceeding safe 5.0° slope limit on vertical wall.",
          measuredValue = maxTilt,
          thresholdLimit = 5.0
        ) :: anomalies
      }

      // 2. 6-DoF Chassis Vibration & Adhesion Slip
      if (rmsVib > 0.70) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "CHASSIS_ADHESION_FAILURE",
          severity = "CRITICAL",
          message = s"Chassis vibration RMS peaked at ${rmsVib}g. Immediate risk of vacuum/magnetic adhesion release.",
          measuredValue = rmsVib,
          thresholdLimit = 0.70
        ) :: anomalies
      } else if (rmsVib > 0.40) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "HIGH_VIBRATION_RMS",
          severity = "WARNING",
          message = s"Chassis vibration RMS reached ${rmsVib}g, indicating mechanical track slip or concrete surface roughness.",
          measuredValue = rmsVib,
          thresholdLimit = 0.40
        ) :: anomalies
      }

      // 3. Power Reserve Warning & Critical Low (< 15.0% per AGILE ROVER README)
      if (currentBatt < 8.0) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "BATTERY_CRITICAL_SHUTDOWN",
          severity = "CRITICAL",
          message = s"Power reserve at critical ${currentBatt}%. Aborting scan, lock magnetic tracks.",
          measuredValue = currentBatt,
          thresholdLimit = 8.0
        ) :: anomalies
      } else if (currentBatt < 15.0) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "LOW_BATTERY_RESERVE",
          severity = "WARNING",
          message = s"Power reserve at ${currentBatt}%. Reroute crawler to docking charger.",
          measuredValue = currentBatt,
          thresholdLimit = 15.0
        ) :: anomalies
      }

      // 4. Thermal Motor Envelope
      if (avgTemp > 55.0) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "THERMAL_SHUTDOWN_RISK",
          severity = "CRITICAL",
          message = s"Motor driver thermal envelope breached at ${avgTemp}°C (>55°C limit).",
          measuredValue = avgTemp,
          thresholdLimit = 55.0
        ) :: anomalies
      } else if (avgTemp > 45.0) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "THERMAL_OVERHEAT",
          severity = "WARNING",
          message = s"Ambient temperature reached ${avgTemp}°C, elevated risk of motor degradation.",
          measuredValue = avgTemp,
          thresholdLimit = 45.0
        ) :: anomalies
      }

      // 5. Concrete Tunnel / Shaft RF Attenuation
      if (minWifi < -82) {
        anomalies = AnomalyAlert(
          roverCode = roverCode,
          alertType = "WIFI_SIGNAL_DEGRADATION",
          severity = "WARNING",
          message = s"Telemetry RSSI weakened to ${minWifi} dBm due to reinforced concrete attenuation.",
          measuredValue = minWifi.toDouble,
          thresholdLimit = -82.0
        ) :: anomalies
      }

      if (anomalies.nonEmpty) {
        activeAlertsRef.updateAndGet(prev => (anomalies ++ prev).distinctBy(_.alertType).take(15))
      }

      AggregatedTelemetry(
        roverCode = roverCode,
        avgTempC = avgTemp,
        avgHumidityPct = avgHumidity,
        maxTiltDeg = maxTilt,
        rmsVibration = rmsVib,
        minWifiSignalDbm = minWifi,
        currentBatteryPct = currentBatt,
        sampleCount = count,
        anomalyDetected = anomalies.nonEmpty
      )
    }
  }

  /**
   * Ingests a new telemetry sample into the reactive stream buffer.
   */
  def ingest(telemetry: RoverTelemetry): Future[QueueOfferResult] = {
    totalIngested.incrementAndGet()
    queue.offer(telemetry)
  }

  /**
   * Live streaming source for WebSocket subscribers.
   */
  def liveStreamSource: Source[AggregatedTelemetry, NotUsed] = {
    broadcastSource
      .watchTermination() { (_, done) =>
        activeSubscribers.incrementAndGet()
        done.onComplete { _ =>
          activeSubscribers.decrementAndGet()
        }
        NotUsed
      }
  }

  /**
   * Clears accumulated active alerts.
   */
  def clearAlerts(): Unit = {
    activeAlertsRef.set(Nil)
  }

  /**
   * Returns recent historical aggregations for sparklines.
   */
  def getHistory: List[AggregatedTelemetry] = {
    historyBuffer.asScala.toList
  }

  /**
   * Returns current statistics snapshot.
   */
  def getStats: PipelineStats = {
    val uptimeSec = (System.currentTimeMillis() - startTimeMs) / 1000
    PipelineStats(
      totalIngestedCount = totalIngested.get(),
      activeSubscribers = activeSubscribers.get(),
      historyCount = historyBuffer.size(),
      lastAggregation = lastAggregationRef.get(),
      activeAlerts = activeAlertsRef.get(),
      uptimeSeconds = uptimeSec
    )
  }
}
