import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Badge, Button } from './UI/Components';
import {
  Cpu,
  Activity,
  Zap,
  Radio,
  AlertTriangle,
  Play,
  Square,
  Terminal,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { DesignTokens } from '../tokens';
import { api } from '../services/api';

const getScalaHost = () => (typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : '127.0.0.1');
const getScalaWsProto = () => (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:');

const SCALA_HTTP_URL = `http://${getScalaHost()}:8090`;
const SCALA_WS_URL = `${getScalaWsProto()}://${getScalaHost()}:8090/api/v1/telemetry/live`;
const WINDOW_SIZE = 10;

export const ScalaStreamView = ({ onActionComplete }) => {
  const [connectionStatus, setConnectionStatus] = useState('CHECKING'); // 'CONNECTED', 'POLLING', 'SIMULATING', 'OFFLINE'
  const [engineMeta, setEngineMeta] = useState({
    engine: 'Apache-Pekko-Scala3-Stream-Engine',
    status: 'RUNNING',
    totalIngestedCount: 42,
    activeSubscribers: 1,
    uptimeSeconds: 180
  });

  const [rawTelemetryBuffer, setRawTelemetryBuffer] = useState(() => {
    // Initial 10-sample baseline buffer for sliding window demonstration
    const baseline = [];
    const now = Date.now();
    for (let i = 10; i >= 1; i--) {
      baseline.push({
        roverCode: 'ROVER-01',
        ambientTempC: Math.round((26.4 + Math.sin(i) * 0.4) * 10) / 10,
        humidityPct: Math.round((54.2 + Math.cos(i) * 0.8) * 10) / 10,
        roverTiltDeg: Math.round((1.2 + Math.sin(i * 0.5) * 0.3) * 10) / 10,
        vibrationLevel: Math.round((0.08 + Math.cos(i) * 0.02) * 100) / 100,
        wifiSignalDbm: -54 + (i % 3),
        batteryPercentage: 98.0,
        timestampMs: now - i * 1500
      });
    }
    return baseline;
  });

  const [lastRawPacket, setLastRawPacket] = useState(() => rawTelemetryBuffer[rawTelemetryBuffer.length - 1]);

  const [aggregatedTelemetry, setAggregatedTelemetry] = useState(() => ({
    roverCode: 'ROVER-01',
    avgTempC: 26.5,
    avgHumidityPct: 54.0,
    maxTiltDeg: 1.4,
    rmsVibration: 0.08,
    minWifiSignalDbm: -56,
    currentBatteryPct: 98.0,
    sampleCount: 10,
    anomalyDetected: false,
    timestampMs: 0
  }));

  const [telemetryHistory, setTelemetryHistory] = useState([
    { time: '10:20:00', rmsVib: 0.08, tilt: 1.2, temp: 26.4 },
    { time: '10:20:02', rmsVib: 0.09, tilt: 1.3, temp: 26.5 },
    { time: '10:20:04', rmsVib: 0.08, tilt: 1.2, temp: 26.4 },
    { time: '10:20:06', rmsVib: 0.07, tilt: 1.4, temp: 26.6 },
    { time: '10:20:08', rmsVib: 0.08, tilt: 1.3, temp: 26.5 },
    { time: '10:20:10', rmsVib: 0.09, tilt: 1.4, temp: 26.5 }
  ]);

  const [activeAlerts, setActiveAlerts] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: '10:20:00', tag: 'BOOT', level: 'info', msg: 'Pekko ActorSystem initialized. Window buffer size: 10' },
    { id: 2, time: '10:20:02', tag: 'INGEST', level: 'info', msg: 'Source.queue offered raw telemetry sample ROVER-01' },
    { id: 3, time: '10:20:04', tag: 'STREAM', level: 'info', msg: 'BroadcastHub broadcasted window aggregate (RMS=0.08g, Tilt=1.2°)' }
  ]);

  const [activeDagStage, setActiveDagStage] = useState('window'); // 'queue', 'window', 'math', 'broadcast'
  const [isAutoStreaming, setIsAutoStreaming] = useState(false);
  const [pulseStage, setPulseStage] = useState(false);
  const [isInjecting, setIsInjecting] = useState(false);

  const wsRef = useRef(null);
  const autoStreamIntervalRef = useRef(null);
  const logCounterRef = useRef(4);

  const addLog = useCallback((tag, level, msg) => {
    const timeStr = new Date().toLocaleTimeString();
    const newLog = {
      id: logCounterRef.current++,
      time: timeStr,
      tag,
      level,
      msg
    };
    setTerminalLogs(prev => [newLog, ...prev.slice(0, 49)]);
  }, []);

  // Compute local Pekko-equivalent sliding window when running simulation or injecting local packet
  const computeSlidingWindow = useCallback((newSample) => {
    setPulseStage(true);
    setTimeout(() => setPulseStage(false), 450);

    setLastRawPacket(newSample);

    setRawTelemetryBuffer(prev => {
      const updated = [...prev.slice(1 - WINDOW_SIZE), newSample];
      const count = updated.length;
      const roverCode = newSample.roverCode || 'ROVER-01';

      const avgTemp = Math.round((updated.reduce((acc, p) => acc + p.ambientTempC, 0) / count) * 10) / 10;
      const avgHumidity = Math.round((updated.reduce((acc, p) => acc + p.humidityPct, 0) / count) * 10) / 10;
      const maxTilt = Math.round(Math.max(...updated.map(p => p.roverTiltDeg)) * 10) / 10;
      const sumSqVib = updated.reduce((acc, p) => acc + (p.vibrationLevel * p.vibrationLevel), 0);
      const rmsVib = Math.round(Math.sqrt(sumSqVib / count) * 100) / 100;
      const minWifi = Math.min(...updated.map(p => p.wifiSignalDbm));
      const currentBatt = newSample.batteryPercentage;

      // Anomaly Rules identical to TelemetryStreamPipeline.scala
      const detectedAnomalies = [];

      if (maxTilt > 5.0) {
        detectedAnomalies.push({
          id: Date.now() + 1,
          roverCode,
          alertType: 'TILT_THRESHOLD_BREACH',
          severity: 'CRITICAL',
          message: `Crawler tilt reached ${maxTilt}°, exceeding safe 5.0° slope limit.`,
          measuredValue: maxTilt,
          thresholdLimit: 5.0,
          timestampMs: Date.now()
        });
      }

      if (rmsVib > 0.40) {
        detectedAnomalies.push({
          id: Date.now() + 2,
          roverCode,
          alertType: 'HIGH_VIBRATION_RMS',
          severity: 'WARNING',
          message: `Chassis vibration RMS reached ${rmsVib}g, indicating surface slippage.`,
          measuredValue: rmsVib,
          thresholdLimit: 0.40,
          timestampMs: Date.now()
        });
      }

      if (currentBatt < 15.0) {
        detectedAnomalies.push({
          id: Date.now() + 3,
          roverCode,
          alertType: 'LOW_BATTERY_RESERVE',
          severity: 'WARNING',
          message: `Power reserve at ${currentBatt}%. Reroute crawler to docking charger.`,
          measuredValue: currentBatt,
          thresholdLimit: 15.0,
          timestampMs: Date.now()
        });
      }

      if (avgTemp > 45.0) {
        detectedAnomalies.push({
          id: Date.now() + 4,
          roverCode,
          alertType: 'THERMAL_OVERHEAT',
          severity: 'CRITICAL',
          message: `Ambient temperature reached ${avgTemp}°C, exceeding motor envelope.`,
          measuredValue: avgTemp,
          thresholdLimit: 45.0,
          timestampMs: Date.now()
        });
      }

      const hasAnomaly = detectedAnomalies.length > 0;

      if (hasAnomaly) {
        setActiveAlerts(prevAlerts => {
          const combined = [...detectedAnomalies, ...prevAlerts];
          const unique = [];
          const seen = new Set();
          for (const a of combined) {
            if (!seen.has(a.alertType)) {
              seen.add(a.alertType);
              unique.push(a);
            }
          }
          return unique.slice(0, 8);
        });
        addLog('ANOMALY', 'error', `Safety rule breached: ${detectedAnomalies.map(a => a.alertType).join(', ')}`);
      }

      const aggResult = {
        roverCode,
        avgTempC: avgTemp,
        avgHumidityPct: avgHumidity,
        maxTiltDeg: maxTilt,
        rmsVibration: rmsVib,
        minWifiSignalDbm: minWifi,
        currentBatteryPct: currentBatt,
        sampleCount: count,
        anomalyDetected: hasAnomaly,
        timestampMs: Date.now()
      };

      setAggregatedTelemetry(aggResult);

      const timeLabel = new Date().toLocaleTimeString().slice(3, 8);
      setTelemetryHistory(h => [
        ...h.slice(-24),
        {
          time: timeLabel,
          rmsVib,
          tilt: maxTilt,
          temp: avgTemp
        }
      ]);

      setEngineMeta(meta => ({
        ...meta,
        totalIngestedCount: meta.totalIngestedCount + 1
      }));

      addLog('PEKKO', hasAnomaly ? 'warn' : 'info', `Sliding window (N=${count}) computed: RMS=${rmsVib}g, MaxTilt=${maxTilt}°, MeanTemp=${avgTemp}°C`);

      return updated;
    });
  }, [addLog]);

  // Connect to live Scala server WebSocket with automatic fallback
  useEffect(() => {
    let ws = null;
    let didCancel = false;

    const checkAndConnect = async () => {
      try {
        const stats = await api.scalaStream.getStats();
        if (didCancel) return;
        setEngineMeta(prev => ({
          ...prev,
          totalIngestedCount: stats.totalIngestedCount || prev.totalIngestedCount,
          activeSubscribers: stats.activeSubscribers || 1,
          uptimeSeconds: stats.uptimeSeconds || prev.uptimeSeconds,
          status: stats.status || 'RUNNING'
        }));
        if (stats.lastAggregation) {
          setAggregatedTelemetry(stats.lastAggregation);
        }
        if (stats.activeAlerts) {
          setActiveAlerts(stats.activeAlerts);
        }
        setConnectionStatus('CONNECTED');
        addLog('CONNECT', 'info', `Connected to Scala 3 / Pekko service on ${SCALA_HTTP_URL}`);
      } catch {
        if (!didCancel) {
          setConnectionStatus('SIMULATING');
          addLog('SYSTEM', 'info', 'Scala service on port 8090 offline. Engaged local Pekko reactive stream simulation.');
        }
      }

      // Initialize WebSocket connection
      try {
        ws = new WebSocket(SCALA_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!didCancel) {
            setConnectionStatus('CONNECTED');
            addLog('WS', 'info', `WebSocket stream established: ${SCALA_WS_URL}`);
          }
        };

        ws.onmessage = (event) => {
          if (didCancel) return;
          try {
            const data = JSON.parse(event.data);
            setAggregatedTelemetry(data);
            setPulseStage(true);
            setTimeout(() => setPulseStage(false), 350);

            const timeLabel = new Date().toLocaleTimeString().slice(3, 8);
            setTelemetryHistory(h => [
              ...h.slice(-24),
              {
                time: timeLabel,
                rmsVib: data.rmsVibration,
                tilt: data.maxTiltDeg,
                temp: data.avgTempC
              }
            ]);

            setEngineMeta(meta => ({
              ...meta,
              totalIngestedCount: meta.totalIngestedCount + 1
            }));

            addLog('WS_MSG', 'info', `Received live Pekko broadcast: RMS=${data.rmsVibration}g, Tilt=${data.maxTiltDeg}°`);
          } catch (err) {
            console.error('Failed to parse WebSocket packet:', err);
          }
        };

        ws.onerror = () => {
          if (!didCancel && connectionStatus !== 'SIMULATING') {
            setConnectionStatus('SIMULATING');
          }
        };

        ws.onclose = () => {
          if (!didCancel && connectionStatus === 'CONNECTED') {
            setConnectionStatus('SIMULATING');
            addLog('WS', 'warn', 'WebSocket connection disconnected. Reverting to local stream simulation.');
          }
        };
      } catch {
        if (!didCancel) setConnectionStatus('SIMULATING');
      }
    };

    checkAndConnect();

    return () => {
      didCancel = true;
      if (ws) {
        ws.close();
      }
    };
  }, [addLog, connectionStatus]);

  // Periodic Uptime Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setEngineMeta(m => ({ ...m, uptimeSeconds: m.uptimeSeconds + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Continuous Ingest Streamer (Simulated sensor feed pulse)
  useEffect(() => {
    if (isAutoStreaming) {
      autoStreamIntervalRef.current = setInterval(() => {
        const nominalSample = {
          roverCode: 'ROVER-01',
          ambientTempC: Math.round((26.0 + Math.random() * 1.5) * 10) / 10,
          humidityPct: Math.round((53.5 + Math.random() * 2.0) * 10) / 10,
          roverTiltDeg: Math.round((1.0 + Math.random() * 0.8) * 10) / 10,
          vibrationLevel: Math.round((0.07 + Math.random() * 0.04) * 100) / 100,
          wifiSignalDbm: -54 + Math.floor(Math.random() * 4 - 2),
          batteryPercentage: 97.5,
          timestampMs: Date.now()
        };

        // Try HTTP post if live, otherwise compute locally
        if (connectionStatus === 'CONNECTED') {
          api.scalaStream.ingestTelemetry(nominalSample).catch(() => {});
        }
        computeSlidingWindow(nominalSample);
      }, 1200);
    } else {
      if (autoStreamIntervalRef.current) clearInterval(autoStreamIntervalRef.current);
    }

    return () => {
      if (autoStreamIntervalRef.current) clearInterval(autoStreamIntervalRef.current);
    };
  }, [isAutoStreaming, connectionStatus, computeSlidingWindow]);

  // Telemetry Injection Handlers
  const handleInjectTelemetry = async (type) => {
    setIsInjecting(true);
    let sample = null;

    if (type === 'NOMINAL') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 26.8,
        humidityPct: 54.5,
        roverTiltDeg: 1.3,
        vibrationLevel: 0.09,
        wifiSignalDbm: -53,
        batteryPercentage: 98.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'info', 'Triggered nominal telemetry packet ingestion.');
    } else if (type === 'TILT_BREACH') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 27.2,
        humidityPct: 53.0,
        roverTiltDeg: 6.8, // > 5.0 slope breach!
        vibrationLevel: 0.14,
        wifiSignalDbm: -58,
        batteryPercentage: 94.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'warn', 'Injected Critical Tilt Angle: 6.8° (Limit: 5.0°)');
    } else if (type === 'VIBRATION_SPIKE') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 28.5,
        humidityPct: 52.0,
        roverTiltDeg: 1.9,
        vibrationLevel: 0.72, // Heavy spike yielding RMS > 0.40g!
        wifiSignalDbm: -56,
        batteryPercentage: 92.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'warn', 'Injected Mechanical Slip: 0.72g vibration impulse (Limit: 0.40g RMS)');
    } else if (type === 'THERMAL_OVERHEAT') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 48.6, // > 45C limit
        humidityPct: 40.0,
        roverTiltDeg: 1.1,
        vibrationLevel: 0.10,
        wifiSignalDbm: -55,
        batteryPercentage: 90.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'error', 'Injected Motor Driver Thermal Overheat: 48.6°C (Limit: 45.0°C)');
    } else if (type === 'LOW_BATTERY') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 26.5,
        humidityPct: 54.0,
        roverTiltDeg: 0.8,
        vibrationLevel: 0.06,
        wifiSignalDbm: -60,
        batteryPercentage: 11.2, // < 15% limit
        timestampMs: Date.now()
      };
      addLog('INJECT', 'warn', 'Injected Power Depletion: 11.2% battery reserve (Limit: 15.0%)');
    }

    if (sample) {
      if (connectionStatus === 'CONNECTED') {
        try {
          await api.scalaStream.ingestTelemetry(sample);
        } catch {
          // fallback locally
        }
      }
      computeSlidingWindow(sample);
      if (onActionComplete) onActionComplete();
    }

    setTimeout(() => setIsInjecting(false), 200);
  };

  const formatUptime = (sec) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '28px' }}>
      {/* 1. Header & Engine Status Banner */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu size={18} color="var(--primary)" />
            <span>Scala 3 &amp; Apache Pekko Reactive Stream Engine</span>
            <span style={{
              fontSize: '11px',
              fontFamily: DesignTokens.typography.mono,
              background: 'var(--surface-alt)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)'
            }}>
              JVM 21 · PORT 8090
            </span>
          </div>
        }
        subtitle="Asynchronous, non-blocking backpressured sliding-window stream processing & anomaly detection"
        tag={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {connectionStatus === 'CONNECTED' ? (
              <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', animation: 'pulseBeacon 2s infinite' }} />
                <span>LIVE WEBSOCKET</span>
              </Badge>
            ) : (
              <Badge variant="warning" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }} />
                <span>LOCAL SIMULATOR ACTIVE</span>
              </Badge>
            )}
          </div>
        }
      >
        {/* Offline Helper Notice when running in simulator mode */}
        {connectionStatus !== 'CONNECTED' && (
          <div style={{
            background: 'var(--pastel-yellow-bg)',
            border: '1px solid var(--pastel-yellow-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '16px',
            fontSize: '12px',
            color: 'var(--pastel-yellow-text)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div>
              <strong>Native Scala Service Standby:</strong> The JVM engine on <code>http://localhost:8090</code> is not running. 
              The page is fully interactive using the embedded Pekko simulation engine.
            </div>
            <div style={{ fontFamily: DesignTokens.typography.mono, background: 'rgba(0,0,0,0.06)', padding: '3px 8px', borderRadius: '4px', fontSize: '11px' }}>
              Launch: .\run_scala.bat
            </div>
          </div>
        )}

        {/* Real-Time Engine Counters Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '14px',
          background: 'var(--surface-alt)',
          borderRadius: '8px',
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: DesignTokens.typography.mono }}>
              Total Ingested Packets
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {engineMeta.totalIngestedCount.toLocaleString()}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Source.queue items offered</div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: DesignTokens.typography.mono }}>
              Sliding Window Buffer
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-cyan)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {WINDOW_SIZE} Samples
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>.sliding(10, step = 1)</div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: DesignTokens.typography.mono }}>
              Engine Uptime
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {formatUptime(engineMeta.uptimeSeconds)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>JVM System Runtime</div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: DesignTokens.typography.mono }}>
              Active WebSocket Sinks
            </div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {engineMeta.activeSubscribers} Client{engineMeta.activeSubscribers !== 1 ? 's' : ''}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BroadcastHub subscribers</div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: DesignTokens.typography.mono }}>
              Stream Anomaly Status
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge variant={aggregatedTelemetry.anomalyDetected ? 'danger' : 'success'} size="sm">
                {aggregatedTelemetry.anomalyDetected ? 'THRESHOLD BREACH' : 'NOMINAL SAFE'}
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Live threshold gate</div>
          </div>
        </div>
      </Card>

      {/* 2. Interactive Pekko Stream Pipeline DAG Visualizer */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} color="var(--primary)" />
            <span>Pekko Reactive Stream Pipeline Architecture</span>
          </div>
        }
        subtitle="Click any stage below to inspect its internal Pekko Streams DSL implementation & real-time queue states"
      >
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {/* Stage 1: Ingest Queue */}
          <div
            onClick={() => setActiveDagStage('queue')}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: `2px solid ${activeDagStage === 'queue' ? 'var(--primary)' : 'var(--border)'}`,
              background: activeDagStage === 'queue' ? 'var(--surface)' : 'var(--surface-alt)',
              cursor: 'pointer',
              boxShadow: pulseStage ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Stage 1: Source Queue
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
              Source.queue(512)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Strategy: OverflowStrategy.dropHead
            </div>
          </div>

          {/* Stage 2: Sliding Window */}
          <div
            onClick={() => setActiveDagStage('window')}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: `2px solid ${activeDagStage === 'window' ? 'var(--primary)' : 'var(--border)'}`,
              background: activeDagStage === 'window' ? 'var(--surface)' : 'var(--surface-alt)',
              cursor: 'pointer',
              boxShadow: pulseStage ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Stage 2: Window Buffer
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
              .sliding(10, step = 1)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              10-Sample FIFO Moving Window
            </div>
          </div>

          {/* Stage 3: Transformation & Anomaly Gate */}
          <div
            onClick={() => setActiveDagStage('math')}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: `2px solid ${activeDagStage === 'math' ? 'var(--primary)' : 'var(--border)'}`,
              background: activeDagStage === 'math' ? 'var(--surface)' : 'var(--surface-alt)',
              cursor: 'pointer',
              boxShadow: pulseStage ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Stage 3: Transform &amp; Anomaly
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: aggregatedTelemetry.anomalyDetected ? 'var(--accent-red)' : 'var(--accent-emerald)' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
              processWindow(window)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              RMS Vibration, Max Tilt, Safety Rules
            </div>
          </div>

          {/* Stage 4: BroadcastHub */}
          <div
            onClick={() => setActiveDagStage('broadcast')}
            style={{
              padding: '14px',
              borderRadius: '8px',
              border: `2px solid ${activeDagStage === 'broadcast' ? 'var(--primary)' : 'var(--border)'}`,
              background: activeDagStage === 'broadcast' ? 'var(--surface)' : 'var(--surface-alt)',
              cursor: 'pointer',
              boxShadow: pulseStage ? '0 0 12px rgba(6, 182, 212, 0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Stage 4: BroadcastHub
              </span>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
              BroadcastHub.sink(256)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              WebSocket Multi-Subscriber Fan-out
            </div>
          </div>
        </div>

        {/* Selected Stage Detail Panel */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 16px',
          fontSize: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {activeDagStage === 'queue' && 'Stage 1: Reactive Ingestion Buffer'}
              {activeDagStage === 'window' && 'Stage 2: 10-Sample Sliding Window Buffer'}
              {activeDagStage === 'math' && 'Stage 3: Pure Functional Aggregations & Anomaly Filter'}
              {activeDagStage === 'broadcast' && 'Stage 4: Dynamic Broadcast Hub (WebSocket Fan-out)'}
            </span>
            <div style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '2px' }}>
              {activeDagStage === 'queue' && 'Accepts incoming raw telemetry via HTTP POST /ingest or crawler WebSocket. Drops oldest sample if buffer exceeds 512.'}
              {activeDagStage === 'window' && 'Groups contiguous samples into a moving 10-sample window. Each new sample produces a new window slice.'}
              {activeDagStage === 'math' && 'Computes root-mean-square (RMS) vibration, max tilt azimuth, arithmetic means, and fires threshold alerts.'}
              {activeDagStage === 'broadcast' && 'Distributes transformed AggregatedTelemetry JSON messages to all connected WebSockets with zero backpressure leakage.'}
            </div>
          </div>
          <code style={{
            background: 'var(--surface-alt)',
            padding: '4px 8px',
            borderRadius: '4px',
            fontFamily: DesignTokens.typography.mono,
            fontSize: '11px',
            color: 'var(--accent-cyan)'
          }}>
            {activeDagStage === 'queue' && 'queue.offer(telemetry)'}
            {activeDagStage === 'window' && '.sliding(windowSize = 10, step = 1)'}
            {activeDagStage === 'math' && 'Math.sqrt(sumSqVib / count)'}
            {activeDagStage === 'broadcast' && 'toMat(BroadcastHub.sink)(Keep.both)'}
          </code>
        </div>
      </Card>

      {/* 3. Telemetry Injection & Anomaly Trigger Studio */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={16} color="var(--primary)" />
            <span>Reactive Telemetry Injection Studio</span>
          </div>
        }
        subtitle="Inject synthetic telemetry packets or safety threshold violations into the Scala stream to witness real-time processing"
      >
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '16px'
        }}>
          <Button
            variant="primary"
            size="sm"
            disabled={isInjecting}
            onClick={() => handleInjectTelemetry('NOMINAL')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckCircle2 size={13} />
            <span>Send Nominal Packet</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isInjecting}
            onClick={() => handleInjectTelemetry('TILT_BREACH')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)' }}
          >
            <AlertTriangle size={13} />
            <span>Inject Tilt Breach (6.8° &gt; 5.0°)</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isInjecting}
            onClick={() => handleInjectTelemetry('VIBRATION_SPIKE')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}
          >
            <Activity size={13} />
            <span>Inject Vibration Slip (0.72g)</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isInjecting}
            onClick={() => handleInjectTelemetry('THERMAL_OVERHEAT')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-red)' }}
          >
            <Zap size={13} />
            <span>Thermal Overheat (48.6°C)</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isInjecting}
            onClick={() => handleInjectTelemetry('LOW_BATTERY')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)' }}
          >
            <Radio size={13} />
            <span>Low Battery (11.2%)</span>
          </Button>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant={isAutoStreaming ? 'danger' : 'outline'}
              size="sm"
              onClick={() => setIsAutoStreaming(!isAutoStreaming)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isAutoStreaming ? <Square size={13} /> : <Play size={13} />}
              <span>{isAutoStreaming ? 'Stop Continuous Stream' : 'Continuous Stream (1.2s)'}</span>
            </Button>
          </div>
        </div>

        {/* 4. Side-by-Side: Raw Ingest vs Computed Window */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {/* Left Column: Raw Ingest Telemetry */}
          <div style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Raw Inflow (RoverTelemetry)
                </span>
              </div>
              <span style={{ fontSize: '10px', fontFamily: DesignTokens.typography.mono, color: 'var(--text-muted)' }}>
                INPUT TO QUEUE
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '12px',
              marginBottom: '14px'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Instantaneous Temp:</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {lastRawPacket.ambientTempC.toFixed(1)} °C
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Relative Humidity:</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {lastRawPacket.humidityPct.toFixed(1)} %
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Instantaneous Tilt:</span>
                <div style={{ fontWeight: 700, color: lastRawPacket.roverTiltDeg > 5.0 ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {lastRawPacket.roverTiltDeg.toFixed(1)} °
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Instantaneous Vibration:</span>
                <div style={{ fontWeight: 700, color: lastRawPacket.vibrationLevel > 0.4 ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {lastRawPacket.vibrationLevel.toFixed(2)} g
                </div>
              </div>
            </div>

            {/* Formatted JSON payload snippet */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontFamily: DesignTokens.typography.mono,
              fontSize: '11px',
              color: 'var(--text-secondary)',
              maxHeight: '120px',
              overflowY: 'auto'
            }}>
              <pre style={{ margin: 0 }}>{JSON.stringify(lastRawPacket, null, 2)}</pre>
            </div>
          </div>

          {/* Right Column: Computed Windowed Aggregate */}
          <div style={{
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '16px',
            borderLeft: '4px solid var(--primary)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Pekko Transformed Aggregate
                </span>
              </div>
              <Badge variant={aggregatedTelemetry.anomalyDetected ? 'danger' : 'success'} size="sm">
                {aggregatedTelemetry.sampleCount} SAMPLES SLIDING
              </Badge>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              fontSize: '12px',
              marginBottom: '14px'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Temp (10-sample):</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {aggregatedTelemetry.avgTempC.toFixed(1)} °C
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Mean Humidity:</span>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {aggregatedTelemetry.avgHumidityPct.toFixed(1)} %
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Peak Tilt (max):</span>
                <div style={{ fontWeight: 700, color: aggregatedTelemetry.maxTiltDeg > 5.0 ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                  {aggregatedTelemetry.maxTiltDeg.toFixed(1)} ° {aggregatedTelemetry.maxTiltDeg > 5.0 ? '(!)' : ''}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Vibration RMS:</span>
                <div style={{ fontWeight: 700, color: aggregatedTelemetry.rmsVibration > 0.40 ? 'var(--accent-red)' : 'var(--accent-emerald)', fontFamily: DesignTokens.typography.mono }}>
                  {aggregatedTelemetry.rmsVibration.toFixed(2)} g RMS
                </div>
              </div>
            </div>

            {/* Formula callout */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                Mathematical Transformation Applied:
              </div>
              <div style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--accent-cyan)' }}>
                RMS = √( (1/N) * Σ(vᵢ²) ) = {aggregatedTelemetry.rmsVibration.toFixed(2)} g
              </div>
              <div style={{ marginTop: '3px' }}>
                Peak Azimuth: max(tiltᵢ) = {aggregatedTelemetry.maxTiltDeg.toFixed(1)}°
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 5. Live Waveform Charts (RMS Vibration & Crawler Tilt) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Chart 1: Vibration RMS vs 0.40g limit */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={16} color="var(--primary)" />
              <span>RMS Chassis Vibration vs. Limit (0.40g)</span>
            </div>
          }
          subtitle="Rolling stream computed by Pekko .sliding(10) pipeline"
        >
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="vibGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-cyan)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--accent-cyan)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis domain={[0, 0.8]} stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px' }}
                />
                <ReferenceLine y={0.40} stroke="var(--accent-red)" strokeDasharray="4 4" label={{ value: 'Limit: 0.40g', fill: 'var(--accent-red)', fontSize: 10, position: 'top' }} />
                <Area type="monotone" dataKey="rmsVib" name="RMS Vibration (g)" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#vibGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Chassis Tilt vs 5.0 deg limit */}
        <Card
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Radio size={16} color="var(--primary)" />
              <span>Chassis Tilt vs. Slope Limit (5.0°)</span>
            </div>
          }
          subtitle="Real-time angle of attack across vertical bearing wall"
        >
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={10} />
                <YAxis domain={[0, 8]} stroke="var(--text-muted)" fontSize={10} />
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', borderColor: 'var(--border)', borderRadius: '6px', fontSize: '11px' }}
                />
                <ReferenceLine y={5.0} stroke="var(--accent-red)" strokeDasharray="4 4" label={{ value: 'Limit: 5.0°', fill: 'var(--accent-red)', fontSize: 10, position: 'top' }} />
                <Line type="monotone" dataKey="tilt" name="Peak Tilt (°)" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 6. Active Stream Anomaly Alerts Ledger */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} color="var(--accent-amber)" />
            <span>Pekko Stream Anomaly Gate &amp; Safety Ledger</span>
          </div>
        }
        subtitle="Violations detected in sliding windows dispatched to active subscribers and crawler bus"
      >
        {activeAlerts.length === 0 ? (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-secondary)',
            background: 'var(--surface-alt)',
            borderRadius: '8px',
            border: '1px dashed var(--border)',
            fontSize: '12px'
          }}>
            <ShieldCheck size={28} color="var(--accent-emerald)" style={{ marginBottom: '8px', opacity: 0.8 }} />
            <div>All streaming metrics nominal. Zero safety thresholds breached in rolling window.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Crawler</th>
                  <th>Anomaly Type</th>
                  <th>Severity</th>
                  <th>Measured Value</th>
                  <th>Safe Limit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeAlerts.map(alert => (
                  <tr key={alert.id || alert.timestampMs}>
                    <td style={{ fontFamily: DesignTokens.typography.mono, fontSize: '11px' }}>
                      {new Date(alert.timestampMs).toLocaleTimeString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>{alert.roverCode}</td>
                    <td style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {alert.alertType}
                    </td>
                    <td>
                      <Badge variant={alert.severity === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                        {alert.severity}
                      </Badge>
                    </td>
                    <td style={{ fontFamily: DesignTokens.typography.mono, fontWeight: 700, color: 'var(--accent-red)' }}>
                      {alert.measuredValue}
                    </td>
                    <td style={{ fontFamily: DesignTokens.typography.mono }}>
                      {alert.thresholdLimit}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {alert.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 7. Live Developer Terminal Stream Console */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={16} color="var(--primary)" />
            <span>Scala Event Stream Terminal Console</span>
          </div>
        }
        subtitle="Live socket log showing packet ingestion, sliding-window calculations, and subscriber broadcasts"
        tag={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTerminalLogs([])}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
          >
            <Trash2 size={12} />
            <span>Clear Log</span>
          </Button>
        }
      >
        <div style={{
          background: 'var(--surface-raised, #10191c)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px 14px',
          fontFamily: DesignTokens.typography.mono,
          fontSize: '11px',
          maxHeight: '200px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}>
          {terminalLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>[{log.time}]</span>
              <span style={{
                color: log.tag === 'ANOMALY' ? 'var(--accent-red)' : (log.tag === 'INJECT' ? 'var(--accent-amber)' : 'var(--accent-cyan)'),
                fontWeight: 700
              }}>
                {log.tag}:
              </span>
              <span style={{ color: log.level === 'error' ? 'var(--accent-red)' : (log.level === 'warn' ? 'var(--accent-amber)' : 'var(--text-primary)') }}>
                {log.msg}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
