package agile.rover.http

import agile.rover.model.*
import agile.rover.stream.TelemetryStreamPipeline
import io.circe.parser.decode
import io.circe.syntax.*
import org.apache.pekko.http.scaladsl.model.*
import org.apache.pekko.http.scaladsl.model.headers.*
import org.apache.pekko.http.scaladsl.model.ws.{Message, TextMessage}
import org.apache.pekko.http.scaladsl.server.Directives.*
import org.apache.pekko.http.scaladsl.server.Route
import org.apache.pekko.stream.scaladsl.{Flow, Sink}

import scala.concurrent.{ExecutionContext, Future}

class TelemetryRoutes(pipeline: TelemetryStreamPipeline)(using ec: ExecutionContext) {

  // Permissive CORS response headers for local frontend (port 5173) and backend (port 8000)
  private val corsHeaders = List(
    `Access-Control-Allow-Origin`.*,
    `Access-Control-Allow-Methods`(HttpMethods.GET, HttpMethods.POST, HttpMethods.OPTIONS, HttpMethods.PUT, HttpMethods.DELETE),
    `Access-Control-Allow-Headers`("Content-Type", "Authorization", "X-Requested-With", "Accept")
  )

  private def dashboardHtml(stats: PipelineStats): String =
    s"""<!DOCTYPE html>
       |<html lang="en">
       |<head>
       |  <meta charset="utf-8">
       |  <meta name="viewport" content="width=device-width, initial-scale=1">
       |  <title>Agile Rover — Reactive Telemetry Stream Engine</title>
       |  <style>
       |    * { box-sizing: border-box; }
       |    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #0b1120; color: #f8fafc; margin: 0; padding: 24px 16px; line-height: 1.5; }
       |    .container { max-width: 1040px; margin: 0 auto; }
       |    .topbar { display: flex; justify-content: space-between; align-items: center; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 14px 20px; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
       |    .brand { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; color: #38bdf8; }
       |    .status-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
       |    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; animation: pulse 2s infinite; }
       |    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
       |    .nav-links { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
       |    .btn { display: inline-flex; align-items: center; gap: 6px; background: #0284c7; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 12px; border: none; cursor: pointer; transition: background 0.15s; }
       |    .btn:hover { background: #0369a1; }
       |    .btn-secondary { background: #334155; color: #e2e8f0; }
       |    .btn-secondary:hover { background: #475569; }
       |    .btn-vite { background: linear-gradient(135deg, #4f46e5, #0284c7); box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3); font-weight: 700; padding: 9px 16px; font-size: 13px; }
       |    .btn-vite:hover { opacity: 0.95; }
       |    .banner-suite { background: linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(2, 132, 199, 0.15)); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 12px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; margin-bottom: 20px; }
       |    .grid-kpi { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 14px; margin-bottom: 20px; }
       |    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 16px; position: relative; }
       |    .kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 4px; }
       |    .kpi-val { font-size: 26px; font-weight: 800; font-family: ui-monospace, Menlo, Consolas, monospace; color: #f8fafc; }
       |    .kpi-sub { font-size: 11px; color: #64748b; margin-top: 4px; }
       |    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
       |    .card-title { font-size: 15px; font-weight: 700; color: #e2e8f0; margin-top: 0; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; }
       |    .test-actions { display: flex; gap: 10px; flex-wrap: wrap; }
       |    .btn-preset { padding: 9px 14px; border-radius: 6px; border: 1px solid #334155; background: #0f172a; color: #f8fafc; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
       |    .btn-preset:hover { border-color: #38bdf8; background: #1e293b; color: #38bdf8; }
       |    .table-wrap { overflow-x: auto; max-height: 280px; overflow-y: auto; border: 1px solid #334155; border-radius: 8px; }
       |    table { width: 100%; border-collapse: collapse; font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; }
       |    th { background: #0f172a; padding: 10px 12px; text-align: left; color: #94a3b8; font-weight: 600; position: sticky; top: 0; border-bottom: 1px solid #334155; }
       |    td { padding: 8px 12px; border-bottom: 1px solid #1e293b; color: #cbd5e1; }
       |    tr:nth-child(even) { background: rgba(15, 23, 42, 0.4); }
       |    .tag { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; }
       |    .tag-ok { background: rgba(16, 185, 129, 0.2); color: #34d399; }
       |    .tag-alert { background: rgba(239, 68, 68, 0.2); color: #f87171; }
       |    .endpoints-list { display: flex; gap: 8px; flex-wrap: wrap; }
       |    .endpoint-chip { font-family: monospace; font-size: 11px; background: #0f172a; border: 1px solid #334155; padding: 6px 12px; border-radius: 6px; color: #38bdf8; text-decoration: none; transition: border-color 0.15s; }
       |    .endpoint-chip:hover { border-color: #38bdf8; background: #1e293b; }
       |  </style>
       |</head>
       |<body>
       |  <div class="container">
       |    <div class="topbar">
       |      <div class="brand">
       |        <span>AGILE ROVER</span>
       |        <span style="color:#64748b; font-weight:400;">|</span>
       |        <span style="color:#94a3b8; font-size:13px; font-weight:500;">Pekko Reactive Stream Engine (Scala 3)</span>
       |      </div>
       |      <div class="status-pill">
       |        <div class="status-dot"></div>
       |        <span id="conn-text">Active (Pekko Engine)</span>
       |      </div>
       |    </div>
       |
       |    <div class="banner-suite">
       |      <div>
       |        <div style="font-weight:700; font-size:15px; color:#f8fafc;">Looking for the full React Inspection Dashboard?</div>
       |        <div style="font-size:12px; color:#94a3b8; margin-top:2px;">View real-time synchronized waveforms, 10-slot FIFO strip, and safety threshold gates.</div>
       |      </div>
       |      <a class="btn btn-vite" href="http://127.0.0.1:5173/#/scala">Launch React 19 Frontend Suite (Port 5173) &rarr;</a>
       |    </div>
       |
       |    <div class="grid-kpi">
       |      <div class="kpi-card">
       |        <div class="kpi-label">RMS Vibration (10-Sample Window)</div>
       |        <div class="kpi-val" id="kpi-vib">0.082g</div>
       |        <div class="kpi-sub">Safety Limit: &le; 0.400g</div>
       |      </div>
       |      <div class="kpi-card">
       |        <div class="kpi-label">Peak Crawler Tilt</div>
       |        <div class="kpi-val" id="kpi-tilt">1.2&deg;</div>
       |        <div class="kpi-sub">Safety Limit: &le; 5.0&deg;</div>
       |      </div>
       |      <div class="kpi-card">
       |        <div class="kpi-label">Mean Ambient Temp</div>
       |        <div class="kpi-val" id="kpi-temp">26.4&deg;C</div>
       |        <div class="kpi-sub">Safety Limit: &le; 45.0&deg;C</div>
       |      </div>
       |      <div class="kpi-card">
       |        <div class="kpi-label">Total Ingested Packets</div>
       |        <div class="kpi-val" id="kpi-ingested" style="color:#38bdf8;">${stats.totalIngestedCount}</div>
       |        <div class="kpi-sub" id="kpi-uptime">Uptime: ${stats.uptimeSeconds}s</div>
       |      </div>
       |    </div>
       |
       |    <div class="card">
       |      <div class="card-title">
       |        <span>Interactive Telemetry Ingestion Studio</span>
       |        <span style="font-size:11px; color:#94a3b8; font-weight:400;">Inject test packets into Pekko Reactive Pipeline</span>
       |      </div>
       |      <div class="test-actions">
       |        <button class="btn-preset" onclick="sendPacket('nominal')">&#128994; Nominal Packet (0.08g, 1.2&deg;)</button>
       |        <button class="btn-preset" onclick="sendPacket('vib')">&#128993; Vibration Slip (0.74g)</button>
       |        <button class="btn-preset" onclick="sendPacket('tilt')">&#128308; Critical Tilt (6.9&deg;)</button>
       |        <button class="btn-preset" onclick="sendPacket('temp')">&#128308; Thermal Overheat (49.2&deg;C)</button>
       |        <button class="btn-preset" onclick="sendBurst()">&#9889; Burst Ingest (5 Packets)</button>
       |      </div>
       |    </div>
       |
       |    <div class="card">
       |      <div class="card-title">
       |        <span>Live Telemetry Sliding Feed</span>
       |        <span style="font-size:11px; color:#94a3b8; font-weight:400;">Real-time rolling window events</span>
       |      </div>
       |      <div class="table-wrap">
       |        <table>
       |          <thead>
       |            <tr>
       |              <th>Time</th>
       |              <th>Rover</th>
       |              <th>RMS Vib</th>
       |              <th>Max Tilt</th>
       |              <th>Avg Temp</th>
       |              <th>Safety Status</th>
       |            </tr>
       |          </thead>
       |          <tbody id="packet-tbody">
       |            <tr>
       |              <td>Live</td>
       |              <td>ROVER-01</td>
       |              <td>0.082g</td>
       |              <td>1.2&deg;</td>
       |              <td>26.4&deg;C</td>
       |              <td><span class="tag tag-ok">NOMINAL</span></td>
       |            </tr>
       |          </tbody>
       |        </table>
       |      </div>
       |    </div>
       |
       |    <div class="card">
       |      <div class="card-title">
       |        <span>Direct Service Endpoints</span>
       |        <span style="font-size:11px; color:#94a3b8; font-weight:400;">REST &amp; Streaming API</span>
       |      </div>
       |      <div class="endpoints-list">
       |        <a class="endpoint-chip" href="/health">/health (Probe)</a>
       |        <a class="endpoint-chip" href="/api/v1/telemetry/stats">/api/v1/telemetry/stats (Snapshot)</a>
       |        <a class="endpoint-chip" href="/api/v1/telemetry/history">/api/v1/telemetry/history (Sparklines)</a>
       |        <a class="endpoint-chip" href="/api/v1/telemetry/ingest">/api/v1/telemetry/ingest (Gateway)</a>
       |        <a class="endpoint-chip" href="http://127.0.0.1:5173/#/scala">http://127.0.0.1:5173/#/scala (Frontend)</a>
       |      </div>
       |    </div>
       |  </div>
       |
       |  <script>
       |    const wsProto = location.protocol === 'https:' ? 'wss:' : 'ws:';
       |    const wsUrl = wsProto + '//' + location.host + '/api/v1/telemetry/live';
       |    let ws = null;
       |
       |    function connectWS() {
       |      try {
       |        ws = new WebSocket(wsUrl);
       |        ws.onopen = () => {
       |          document.getElementById('conn-text').textContent = 'Live (WebSocket)';
       |        };
       |        ws.onmessage = (e) => {
       |          try {
       |            const agg = JSON.parse(e.data);
       |            updateUI(agg);
       |          } catch(err) {}
       |        };
       |        ws.onclose = () => {
       |          document.getElementById('conn-text').textContent = 'Live (Polling Fallback)';
       |          setTimeout(connectWS, 3000);
       |        };
       |        ws.onerror = () => { ws.close(); };
       |      } catch(e) {
       |        setTimeout(connectWS, 3000);
       |      }
       |    }
       |
       |    setInterval(async () => {
       |      try {
       |        const res = await fetch('/api/v1/telemetry/stats');
       |        if (res.ok) {
       |          const data = await res.json();
       |          document.getElementById('kpi-ingested').textContent = data.totalIngestedCount;
       |          document.getElementById('kpi-uptime').textContent = 'Uptime: ' + data.uptimeSeconds + 's';
       |          if (!ws || ws.readyState !== WebSocket.OPEN) {
       |            if (data.lastAggregation) updateUI(data.lastAggregation);
       |          }
       |        }
       |      } catch(e) {}
       |    }, 1500);
       |
       |    function updateUI(data) {
       |      if (data.rmsVibration !== undefined) {
       |        const el = document.getElementById('kpi-vib');
       |        el.textContent = data.rmsVibration.toFixed(3) + 'g';
       |        el.style.color = data.rmsVibration > 0.40 ? '#ef4444' : '#f8fafc';
       |      }
       |      if (data.maxTiltDeg !== undefined) {
       |        const el = document.getElementById('kpi-tilt');
       |        el.textContent = data.maxTiltDeg.toFixed(1) + '°';
       |        el.style.color = data.maxTiltDeg > 5.0 ? '#ef4444' : '#f8fafc';
       |      }
       |      if (data.avgTempC !== undefined) {
       |        document.getElementById('kpi-temp').textContent = data.avgTempC.toFixed(1) + '°C';
       |      }
       |
       |      const tbody = document.getElementById('packet-tbody');
       |      const tr = document.createElement('tr');
       |      const time = new Date().toLocaleTimeString();
       |      const alertTag = data.anomalyDetected ? '<span class=\"tag tag-alert\">ALERT</span>' : '<span class=\"tag tag-ok\">NOMINAL</span>';
       |      tr.innerHTML = '<td>' + time + '</td><td>' + (data.roverCode || 'ROVER-01') + '</td><td>' + (data.rmsVibration||0).toFixed(3) + 'g</td><td>' + (data.maxTiltDeg||0).toFixed(1) + '&deg;</td><td>' + (data.avgTempC||0).toFixed(1) + '&deg;C</td><td>' + alertTag + '</td>';
       |      tbody.insertBefore(tr, tbody.firstChild);
       |      if (tbody.children.length > 20) tbody.removeChild(tbody.lastChild);
       |    }
       |
       |    async function sendPacket(preset) {
       |      let sample = {
       |        roverCode: 'ROVER-01',
       |        ambientTempC: 26.4,
       |        humidityPct: 54.0,
       |        roverTiltDeg: 1.2,
       |        vibrationLevel: 0.08,
       |        wifiSignalDbm: -54,
       |        batteryPercentage: 96.0,
       |        standoffDistanceMm: 250.0
       |      };
       |      if (preset === 'vib') { sample.vibrationLevel = 0.74; sample.roverTiltDeg = 2.1; }
       |      else if (preset === 'tilt') { sample.roverTiltDeg = 6.9; sample.vibrationLevel = 0.25; }
       |      else if (preset === 'temp') { sample.ambientTempC = 49.2; sample.vibrationLevel = 0.15; }
       |      await fetch('/api/v1/telemetry/ingest', {
       |        method: 'POST',
       |        headers: { 'Content-Type': 'application/json' },
       |        body: JSON.stringify(sample)
       |      });
       |    }
       |
       |    async function sendBurst() {
       |      for (let i = 0; i < 5; i++) {
       |        await sendPacket('nominal');
       |        await new Promise(r => setTimeout(r, 100));
       |      }
       |    }
       |
       |    connectWS();
       |  </script>
       |</body>
       |</html>""".stripMargin

  val routes: Route = respondWithHeaders(corsHeaders) {
    concat(
      // Global CORS preflight handler
      options {
        complete(StatusCodes.OK)
      },

      // Root path directly serves standalone Reactive Telemetry Dashboard
      pathEndOrSingleSlash {
        get {
          val stats = pipeline.getStats
          complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, dashboardHtml(stats)))
        }
      },

      // Liveness / readiness probe
      path("health") {
        get {
          val stats = pipeline.getStats
          val healthJson =
            s"""{
               |  "status": "UP",
               |  "service": "agile-rover-scala-telemetry-stream",
               |  "engine": "Apache Pekko Streams 1.0.2 on Scala 3.3.3",
               |  "uptimeSeconds": ${stats.uptimeSeconds},
               |  "totalIngested": ${stats.totalIngestedCount},
               |  "activeSubscribers": ${stats.activeSubscribers}
               |}""".stripMargin
          complete(HttpEntity(ContentTypes.`application/json`, healthJson))
        }
      },

      pathPrefix("api" / "v1" / "telemetry") {
        concat(
          // Ingest telemetry sample (single packet or array of packets)
          path("ingest") {
            concat(
              get {
                val stats = pipeline.getStats
                val html =
                  s"""<!DOCTYPE html>
                     |<html lang="en">
                     |<head>
                     |  <meta charset="utf-8">
                     |  <meta name="viewport" content="width=device-width, initial-scale=1">
                     |  <title>Agile Rover — Telemetry Ingest Gateway</title>
                     |  <style>
                     |    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b1120; color: #f8fafc; padding: 40px 20px; margin: 0; line-height: 1.6; }
                     |    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 28px; max-width: 820px; margin: 0 auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                     |    h1 { margin-top: 0; font-size: 22px; color: #38bdf8; display: flex; align-items: center; gap: 10px; }
                     |    .badge { background: #0284c7; color: #f0f9ff; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; }
                     |    pre { background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 14px; overflow-x: auto; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 13px; color: #38bdf8; }
                     |    .btn { display: inline-flex; align-items: center; gap: 6px; background: #0284c7; color: white; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; border: none; cursor: pointer; }
                     |    .btn:hover { background: #0369a1; }
                     |    .btn-secondary { background: #334155; color: #e2e8f0; }
                     |    .btn-secondary:hover { background: #475569; }
                     |    .metric-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin: 20px 0; }
                     |    .metric-item { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 12px; }
                     |    .metric-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
                     |    .metric-value { font-size: 20px; font-weight: 700; color: #f8fafc; font-family: monospace; margin-top: 2px; }
                     |  </style>
                     |</head>
                     |<body>
                     |  <div class="card">
                     |    <h1>Agile Rover Telemetry Ingest Gateway <span class="badge">HTTP POST</span></h1>
                     |    <p>This endpoint receives crawler telemetry packets and sliding-window batches into the <strong>Apache Pekko Streams</strong> reactive pipeline running on <strong>Scala 3 / JVM 21</strong>.</p>
                     |    
                     |    <div class="metric-grid">
                     |      <div class="metric-item">
                     |        <div class="metric-label">Engine Status</div>
                     |        <div class="metric-value" style="color:#10b981;">${stats.status}</div>
                     |      </div>
                     |      <div class="metric-item">
                     |        <div class="metric-label">Ingested Packets</div>
                     |        <div class="metric-value">${stats.totalIngestedCount}</div>
                     |      </div>
                     |      <div class="metric-item">
                     |        <div class="metric-label">Active WebSocket Sinks</div>
                     |        <div class="metric-value" style="color:#38bdf8;">${stats.activeSubscribers}</div>
                     |      </div>
                     |    </div>
                     |
                     |    <h3 style="color:#e2e8f0; font-size:14px; margin-bottom:8px;">Ingestion Protocol (cURL / HTTP POST):</h3>
                     |    <pre>curl -X POST http://127.0.0.1:8090/api/v1/telemetry/ingest \\
                     |  -H "Content-Type: application/json" \\
                     |  -d '{
                     |    "roverCode": "ROVER-01",
                     |    "ambientTempC": 26.5,
                     |    "humidityPct": 54.0,
                     |    "roverTiltDeg": 1.2,
                     |    "vibrationLevel": 0.08,
                     |    "wifiSignalDbm": -54,
                     |    "batteryPercentage": 98.0
                     |  }'</pre>
                     |
                     |    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:24px;">
                     |      <a class="btn" href="/">Open Live Scala Dashboard &rarr;</a>
                     |      <a class="btn btn-secondary" href="http://127.0.0.1:5173/#/scala">React Frontend Suite (Port 5173)</a>
                     |      <a class="btn btn-secondary" href="/api/v1/telemetry/stats">Pipeline Stats JSON</a>
                     |      <a class="btn btn-secondary" href="/health">Health Endpoint</a>
                     |    </div>
                     |  </div>
                     |</body>
                     |</html>""".stripMargin
                complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, html))
              },
              post {
                entity(as[String]) { jsonStr =>
                  decode[List[RoverTelemetry]](jsonStr) match {
                    case Right(list) if list.nonEmpty =>
                      val futures = list.map(sample => pipeline.ingest(sample))
                      onSuccess(Future.sequence(futures)) { _ =>
                        complete(
                          StatusCodes.Accepted,
                          HttpEntity(
                            ContentTypes.`application/json`,
                            s"""{"status":"INGESTED","count":${list.size},"message":"Batch telemetry accepted"}"""
                          )
                        )
                      }

                    case _ =>
                      decode[RoverTelemetry](jsonStr) match {
                        case Right(sample) =>
                          onSuccess(pipeline.ingest(sample)) { _ =>
                            complete(
                              StatusCodes.Accepted,
                              HttpEntity(
                                ContentTypes.`application/json`,
                                s"""{"status":"INGESTED","roverCode":"${sample.roverCode}","timestampMs":${System.currentTimeMillis()}}"""
                              )
                            )
                          }

                        case Left(err) =>
                          complete(
                            StatusCodes.BadRequest,
                            HttpEntity(
                              ContentTypes.`application/json`,
                              s"""{"status":"ERROR","error":"Malformed JSON: ${err.getMessage.replace('"', '\'')}"}"""
                            )
                          )
                      }
                  }
                }
              }
            )
          },

          // Current pipeline statistics snapshot
          path("stats") {
            get {
              val statsJson = pipeline.getStats.asJson.noSpaces
              complete(HttpEntity(ContentTypes.`application/json`, statsJson))
            }
          },

          // Historical sliding-window aggregations for sparklines
          path("history") {
            get {
              val historyJson = pipeline.getHistory.asJson.noSpaces
              complete(HttpEntity(ContentTypes.`application/json`, historyJson))
            }
          },

          // Reset active safety alerts
          path("reset-alerts") {
            post {
              pipeline.clearAlerts()
              complete(
                StatusCodes.OK,
                HttpEntity(ContentTypes.`application/json`, """{"status":"CLEARED","message":"Active alerts reset."}""")
              )
            }
          },

          // Live WebSocket stream or HTML live viewer on browser GET
          path("live") {
            concat(
              extractUpgradeToWebSocket { upgrade =>
                val wsFlow: Flow[Message, Message, Any] =
                  Flow.fromSinkAndSource(
                    Sink.ignore,
                    pipeline.liveStreamSource.map(agg => TextMessage(agg.asJson.noSpaces))
                  )
                complete(upgrade.handleMessages(wsFlow))
              },
              get {
                val stats = pipeline.getStats
                complete(HttpEntity(ContentTypes.`text/html(UTF-8)`, dashboardHtml(stats)))
              }
            )
          }
        )
      }
    )
  }
}
