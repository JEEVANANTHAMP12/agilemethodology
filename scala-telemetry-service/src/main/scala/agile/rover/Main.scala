package agile.rover

import agile.rover.http.TelemetryRoutes
import agile.rover.model.RoverTelemetry
import agile.rover.stream.TelemetryStreamPipeline
import org.apache.pekko.actor.typed.ActorSystem
import org.apache.pekko.actor.typed.scaladsl.Behaviors
import org.apache.pekko.http.scaladsl.Http

import java.util.concurrent.atomic.AtomicReference
import scala.concurrent.ExecutionContext
import scala.concurrent.duration.*
import scala.util.{Failure, Random, Success}

object Main {
  def main(args: Array[String]): Unit = {
    // Suppress SLF4J internal initialization replay messages in terminal
    System.setProperty("slf4j.internal.verbosity", "WARN")
    // Eagerly initialize SLF4J / Logback synchronously on main thread before Pekko spawns threads
    org.slf4j.LoggerFactory.getLogger(org.slf4j.Logger.ROOT_LOGGER_NAME)

    given system: ActorSystem[Any] = ActorSystem(Behaviors.empty, "agile-rover-telemetry-system")
    given ec: ExecutionContext = system.executionContext

    val port = sys.env.get("PORT").flatMap(_.toIntOption).getOrElse(8090)
    val bindHost = sys.env.getOrElse("HOST", "0.0.0.0")
    val displayHost = if (bindHost == "0.0.0.0" || bindHost == "::") "127.0.0.1" else bindHost

    val pipeline = new TelemetryStreamPipeline(windowSize = 10, maxHistory = 60)
    val telemetryRoutes = new TelemetryRoutes(pipeline)

    val bindingFuture = Http().newServerAt(bindHost, port).bind(telemetryRoutes.routes)

    bindingFuture.onComplete {
      case Success(binding) =>
        println("================================================================================")
        println("   AGILE ROVER -- REACTIVE TELEMETRY STREAM ENGINE (Scala 3 / Apache Pekko)")
        println("================================================================================")
        println(s"  Engine Port:              $port (listening on all interfaces)")
        println(s"  [1] Live Scala Dashboard: http://$displayHost:$port/")
        println(s"  [2] React Frontend Suite: http://$displayHost:5173/#/scala")
        println(s"  [3] Health Probe (JSON):  http://$displayHost:$port/health")
        println(s"  [4] Stats Snapshot:       http://$displayHost:$port/api/v1/telemetry/stats")
        println(s"  [5] History Sparklines:   http://$displayHost:$port/api/v1/telemetry/history")
        println(s"  [6] Ingestion Gateway:    http://$displayHost:$port/api/v1/telemetry/ingest")
        println(s"  [7] Live Stream Viewer:   http://$displayHost:$port/api/v1/telemetry/live")
        println("================================================================================")

        // Continuous smooth Brownian drift simulator for autonomous rover telemetry feed
        val currentTemp = new AtomicReference[Double](26.4)
        val currentHumidity = new AtomicReference[Double](54.2)
        val currentTilt = new AtomicReference[Double](1.2)
        val currentVib = new AtomicReference[Double](0.08)
        val currentBattery = new AtomicReference[Double](96.4)

        system.scheduler.scheduleAtFixedRate(1.second, 1500.millis) { () =>
          // Smooth Brownian walk around nominal values
          val temp = currentTemp.updateAndGet(prev => Math.max(22.0, Math.min(32.0, prev + (Random.nextDouble() * 0.4 - 0.2))))
          val hum = currentHumidity.updateAndGet(prev => Math.max(45.0, Math.min(65.0, prev + (Random.nextDouble() * 0.6 - 0.3))))
          val tilt = currentTilt.updateAndGet(prev => Math.max(0.5, Math.min(2.8, prev + (Random.nextDouble() * 0.3 - 0.15))))
          val vib = currentVib.updateAndGet(prev => Math.max(0.04, Math.min(0.25, prev + (Random.nextDouble() * 0.04 - 0.02))))
          val batt = currentBattery.updateAndGet(prev => Math.max(10.0, prev - 0.01))

          val sample = RoverTelemetry(
            roverCode = "ROVER-01",
            ambientTempC = (temp * 10).round / 10.0,
            humidityPct = (hum * 10).round / 10.0,
            roverTiltDeg = (tilt * 10).round / 10.0,
            vibrationLevel = (vib * 100).round / 100.0,
            wifiSignalDbm = -54 + Random.nextInt(5) - 2,
            batteryPercentage = (batt * 10).round / 10.0,
            standoffDistanceMm = 250.0
          )
          pipeline.ingest(sample)
        }

      case Failure(ex) =>
        System.err.println(s"[!] Failed to bind Scala HTTP server on $bindHost:$port: ${ex.getMessage}")
        system.terminate()
    }

    // Graceful JVM shutdown hook
    sys.addShutdownHook {
      println("\n[!] Shutting down Agile Rover Scala Telemetry Stream Pipeline...")
      bindingFuture
        .flatMap(_.unbind())
        .onComplete(_ => system.terminate())
    }
  }
}
