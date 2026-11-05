import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Navbar } from '../components/Navbar';
import { Card, Badge, Button } from '../components/UI/Components';
import {
  Cpu,
  Activity,
  Zap,
  Radio,
  AlertTriangle,
  Play,
  Pause,
  Terminal,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flame
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
import { useTheme } from '../ui';
import { api } from '../services/api';

const WINDOW_SIZE = 10;
const getScalaHost = () => (typeof window !== 'undefined' ? window.location.hostname || '127.0.0.1' : '127.0.0.1');
const getScalaWsProto = () => (typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:');

const SCALA_HTTP_URL = `http://${getScalaHost()}:8090`;
const SCALA_WS_URL = `${getScalaWsProto()}://${getScalaHost()}:8090/api/v1/telemetry/live`;

export const ScalaPipelinePage = () => {
  const { theme, toggleTheme } = useTheme();

  // Engine Connection & Metrics State
  const [connectionStatus, setConnectionStatus] = useState('CHECKING'); // 'CONNECTED', 'SIMULATING'
  const [engineMeta, setEngineMeta] = useState({
    engine: 'Apache-Pekko-Scala3-Stream-Engine',
    status: 'RUNNING',
    totalIngestedCount: 48,
    activeSubscribers: 1,
    uptimeSeconds: 120
  });

  // 10-Slot Sliding Window Buffer (Visual Array representing Stage 2)
  const [windowBuffer, setWindowBuffer] = useState(() => {
    const initial = [];
    const now = Date.now();
    for (let i = 10; i >= 1; i--) {
      initial.push({
        slot: 11 - i,
        roverCode: 'ROVER-01',
        temp: Math.round((26.4 + Math.sin(i * 0.8) * 0.5) * 10) / 10,
        humidity: Math.round((54.0 + Math.cos(i * 0.8) * 1.0) * 10) / 10,
        tilt: Math.round((1.2 + Math.sin(i * 0.4) * 0.3) * 10) / 10,
        vib: Math.round((0.08 + Math.cos(i) * 0.02) * 100) / 100,
        wifi: -54 + (i % 3),
        batt: 98.0,
        timestamp: now - i * 1200,
        isNew: false
      });
    }
    return initial;
  });

  // Last Inflow Packet (Stage 1)
  const [lastRawPacket, setLastRawPacket] = useState(() => ({
    roverCode: 'ROVER-01',
    ambientTempC: 26.5,
    humidityPct: 54.2,
    roverTiltDeg: 1.2,
    vibrationLevel: 0.08,
    wifiSignalDbm: -54,
    batteryPercentage: 98.0,
    timestampMs: 0
  }));

  // Computed Sliding Window Aggregate (Stage 3)
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

  // Chart Waveform History (last 24 points)
  const [telemetryHistory, setTelemetryHistory] = useState([
    { time: '11:20:00', rmsVib: 0.08, tilt: 1.2, temp: 26.4 },
    { time: '11:20:02', rmsVib: 0.09, tilt: 1.3, temp: 26.5 },
    { time: '11:20:04', rmsVib: 0.08, tilt: 1.2, temp: 26.4 },
    { time: '11:20:06', rmsVib: 0.07, tilt: 1.4, temp: 26.6 },
    { time: '11:20:08', rmsVib: 0.08, tilt: 1.3, temp: 26.5 },
    { time: '11:20:10', rmsVib: 0.09, tilt: 1.4, temp: 26.5 }
  ]);

  // Real-time Anomaly Alerts
  const [activeAlerts, setActiveAlerts] = useState([]);

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState([
    { id: 1, time: '11:20:00', tag: 'BOOT', level: 'info', msg: 'Apache Pekko Streams ActorSystem initialized on port 8090' },
    { id: 2, time: '11:20:01', tag: 'PIPELINE', level: 'info', msg: 'Source.queue(512) ready. Sliding window buffer: 10 samples (step=1)' },
    { id: 3, time: '11:20:02', tag: 'STREAM', level: 'info', msg: 'BroadcastHub subscriber channel active' }
  ]);

  const [isLiveStreaming, setIsLiveStreaming] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [bufferPulse, setBufferPulse] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const wsRef = useRef(null);
  const streamTimerRef = useRef(null);
  const logCounterRef = useRef(4);

  const addLog = useCallback((tag, level, msg) => {
    const timeStr = new Date().toLocaleTimeString();
    const newEntry = {
      id: logCounterRef.current++,
      time: timeStr,
      tag,
      level,
      msg
    };
    setTerminalLogs(prev => [newEntry, ...prev.slice(0, 39)]);
  }, []);

  // Compute sliding window mathematics matching TelemetryStreamPipeline.scala
  const pushTelemetryPacket = useCallback((sample) => {
    setBufferPulse(true);
    setTimeout(() => setBufferPulse(false), 350);

    setLastRawPacket(sample);

    setWindowBuffer(prev => {
      // Drop oldest sample (FIFO dropHead) and append new sample
      const rawSamples = prev.map(p => ({
        roverCode: p.roverCode,
        ambientTempC: p.temp,
        humidityPct: p.humidity,
        roverTiltDeg: p.tilt,
        vibrationLevel: p.vib,
        wifiSignalDbm: p.wifi,
        batteryPercentage: p.batt,
        timestampMs: p.timestamp
      }));

      const nextSamples = [...rawSamples.slice(1 - WINDOW_SIZE), sample];
      const count = nextSamples.length;
      const roverCode = sample.roverCode || 'ROVER-01';

      // Mathematical reductions
      const avgTemp = Math.round((nextSamples.reduce((sum, p) => sum + p.ambientTempC, 0) / count) * 10) / 10;
      const avgHumidity = Math.round((nextSamples.reduce((sum, p) => sum + p.humidityPct, 0) / count) * 10) / 10;
      const maxTilt = Math.round(Math.max(...nextSamples.map(p => p.roverTiltDeg)) * 10) / 10;
      const sumSqVib = nextSamples.reduce((sum, p) => sum + (p.vibrationLevel * p.vibrationLevel), 0);
      const rmsVib = Math.round(Math.sqrt(sumSqVib / count) * 100) / 100;
      const minWifi = Math.min(...nextSamples.map(p => p.wifiSignalDbm));
      const currentBatt = sample.batteryPercentage;

      // Anomaly Rules
      const detectedAnomalies = [];

      if (maxTilt > 5.0) {
        detectedAnomalies.push({
          id: Date.now() + 1,
          roverCode,
          alertType: 'TILT_THRESHOLD_BREACH',
          severity: 'CRITICAL',
          message: `Crawler tilt reached ${maxTilt}°, exceeding safe 5.0° slope limit.`,
          measuredValue: `${maxTilt}°`,
          thresholdLimit: '5.0°',
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
          measuredValue: `${rmsVib}g`,
          thresholdLimit: '0.40g',
          timestampMs: Date.now()
        });
      }

      if (avgTemp > 45.0) {
        detectedAnomalies.push({
          id: Date.now() + 3,
          roverCode,
          alertType: 'THERMAL_OVERHEAT',
          severity: 'CRITICAL',
          message: `Chassis temperature reached ${avgTemp}°C, exceeding motor thermal limit.`,
          measuredValue: `${avgTemp}°C`,
          thresholdLimit: '45.0°C',
          timestampMs: Date.now()
        });
      }

      if (currentBatt < 15.0) {
        detectedAnomalies.push({
          id: Date.now() + 4,
          roverCode,
          alertType: 'LOW_BATTERY_RESERVE',
          severity: 'WARNING',
          message: `Power reserve at ${currentBatt}%. Reroute crawler to docking station.`,
          measuredValue: `${currentBatt}%`,
          thresholdLimit: '15.0%',
          timestampMs: Date.now()
        });
      }

      const hasAnomaly = detectedAnomalies.length > 0;

      if (hasAnomaly) {
        setActiveAlerts(prev => {
          const combined = [...detectedAnomalies, ...prev];
          const unique = [];
          const seen = new Set();
          for (const a of combined) {
            if (!seen.has(a.alertType)) {
              seen.add(a.alertType);
              unique.push(a);
            }
          }
          return unique.slice(0, 6);
        });
        addLog('ANOMALY', 'error', `Safety Rule Violation: ${detectedAnomalies.map(a => a.alertType).join(', ')}`);
      }

      // Update Aggregated Output
      setAggregatedTelemetry({
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
      });

      // Update Waveform History
      const timeStr = new Date().toLocaleTimeString().slice(3, 8);
      setTelemetryHistory(h => [
        ...h.slice(-24),
        {
          time: timeStr,
          rmsVib,
          tilt: maxTilt,
          temp: avgTemp
        }
      ]);

      setEngineMeta(m => ({ ...m, totalIngestedCount: m.totalIngestedCount + 1 }));
      addLog('PEKKO', hasAnomaly ? 'warn' : 'info', `Window processed: RMS=${rmsVib}g, MaxTilt=${maxTilt}°, MeanTemp=${avgTemp}°C`);

      // Return updated 10-slot visual buffer
      return nextSamples.map((s, idx) => ({
        slot: idx + 1,
        roverCode: s.roverCode,
        temp: s.ambientTempC,
        humidity: s.humidityPct,
        tilt: s.roverTiltDeg,
        vib: s.vibrationLevel,
        wifi: s.wifiSignalDbm,
        batt: s.batteryPercentage,
        timestamp: s.timestampMs || Date.now(),
        isNew: idx === nextSamples.length - 1
      }));
    });
  }, [addLog]);

  // Connect to native Scala 3 / Pekko service on port 8090
  useEffect(() => {
    let ws = null;
    let didCancel = false;

    const connectLiveStream = async () => {
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
        setConnectionStatus('CONNECTED');
        addLog('PEKKO_JVM', 'info', `Connected to Scala 3 engine on ${SCALA_HTTP_URL}`);
      } catch {
        if (!didCancel) {
          setConnectionStatus('SIMULATING');
          addLog('SYSTEM', 'info', 'Pekko port 8090 standby. Running in-browser reactive stream simulator.');
        }
      }

      try {
        ws = new WebSocket(SCALA_WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!didCancel) {
            setConnectionStatus('CONNECTED');
            addLog('WS', 'info', `Live WebSocket broadcast connected: ${SCALA_WS_URL}`);
          }
        };

        ws.onmessage = (event) => {
          if (didCancel) return;
          try {
            const data = JSON.parse(event.data);
            setAggregatedTelemetry(data);
            setBufferPulse(true);
            setTimeout(() => setBufferPulse(false), 300);

            const timeStr = new Date().toLocaleTimeString().slice(3, 8);
            setTelemetryHistory(h => [
              ...h.slice(-24),
              {
                time: timeStr,
                rmsVib: data.rmsVibration,
                tilt: data.maxTiltDeg,
                temp: data.avgTempC
              }
            ]);

            setEngineMeta(m => ({ ...m, totalIngestedCount: m.totalIngestedCount + 1 }));
            addLog('WS_PACKET', 'info', `Pekko broadcast: RMS=${data.rmsVibration}g, PeakTilt=${data.maxTiltDeg}°`);
          } catch (e) {
            console.error('Error parsing live WebSocket payload:', e);
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
            addLog('WS', 'warn', 'WebSocket disconnected. Switched to reactive stream simulation.');
          }
        };
      } catch {
        if (!didCancel) setConnectionStatus('SIMULATING');
      }
    };

    connectLiveStream();

    return () => {
      didCancel = true;
      if (ws) ws.close();
    };
  }, [addLog, connectionStatus]);

  // Periodic Uptime Counter
  useEffect(() => {
    const timer = setInterval(() => {
      setEngineMeta(m => ({ ...m, uptimeSeconds: m.uptimeSeconds + 1 }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Continuous Telemetry Ingest Stream (1.2s cadence)
  useEffect(() => {
    if (isLiveStreaming) {
      streamTimerRef.current = setInterval(() => {
        const sample = {
          roverCode: 'ROVER-01',
          ambientTempC: Math.round((26.2 + Math.random() * 1.4) * 10) / 10,
          humidityPct: Math.round((53.8 + Math.random() * 1.8) * 10) / 10,
          roverTiltDeg: Math.round((1.1 + Math.random() * 0.7) * 10) / 10,
          vibrationLevel: Math.round((0.07 + Math.random() * 0.04) * 100) / 100,
          wifiSignalDbm: -54 + Math.floor(Math.random() * 4 - 2),
          batteryPercentage: 97.8,
          timestampMs: Date.now()
        };

        if (connectionStatus === 'CONNECTED') {
          api.scalaStream.ingestTelemetry(sample).catch(() => {});
        }
        pushTelemetryPacket(sample);
      }, 1200);
    } else {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    }

    return () => {
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, [isLiveStreaming, connectionStatus, pushTelemetryPacket]);

  // Telemetry Injection Presets
  const handleInjectSample = async (type) => {
    setIsProcessing(true);
    let sample = null;

    if (type === 'NOMINAL') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 26.5,
        humidityPct: 54.0,
        roverTiltDeg: 1.2,
        vibrationLevel: 0.08,
        wifiSignalDbm: -53,
        batteryPercentage: 98.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'info', 'Injected Nominal Telemetry sample');
    } else if (type === 'VIB_SPIKE') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 28.0,
        humidityPct: 53.0,
        roverTiltDeg: 1.8,
        vibrationLevel: 0.74, // Exceeds 0.40g RMS threshold
        wifiSignalDbm: -56,
        batteryPercentage: 95.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'warn', 'Injected Vibration Slip: 0.74g (Limit: 0.40g RMS)');
    } else if (type === 'TILT_BREACH') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 27.5,
        humidityPct: 52.0,
        roverTiltDeg: 6.9, // Exceeds 5.0 deg threshold
        vibrationLevel: 0.12,
        wifiSignalDbm: -58,
        batteryPercentage: 93.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'error', 'Injected Critical Slope Tilt: 6.9° (Limit: 5.0°)');
    } else if (type === 'THERMAL_OVERHEAT') {
      sample = {
        roverCode: 'ROVER-01',
        ambientTempC: 49.2, // Exceeds 45.0C threshold
        humidityPct: 38.0,
        roverTiltDeg: 1.0,
        vibrationLevel: 0.09,
        wifiSignalDbm: -55,
        batteryPercentage: 91.0,
        timestampMs: Date.now()
      };
      addLog('INJECT', 'error', 'Injected Motor Thermal Overheat: 49.2°C (Limit: 45.0°C)');
    }

    if (sample) {
      if (connectionStatus === 'CONNECTED') {
        try {
          await api.scalaStream.ingestTelemetry(sample);
        } catch {
          // fallback locally
        }
      }
      pushTelemetryPacket(sample);
    }

    setTimeout(() => setIsProcessing(false), 200);
  };

  const formatUptime = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s.toString().padStart(2, '0')}s`;
  };

  const navTabs = [
    { id: 'dashboard', label: 'Inspection Dashboard' },
    { id: 'scala', label: 'Scala Telemetry Pipeline' }
  ];

  return (
    <div className="ui-app" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 1. Unified App Navbar */}
      <Navbar
        roverStatus="CONNECTED"
        tabs={navTabs.map(t => ({
          ...t,
          icon: t.id === 'dashboard' ? <Activity size={15} /> : <Cpu size={15} />
        }))}
        activeTab="scala"
        onTabChange={(tabId) => {
          if (tabId === 'dashboard') {
            window.location.hash = '#/';
          }
        }}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="ui-main" style={{ flex: 1, padding: '20px', maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
        {/* 2. Page Header & Key Engine Status Bar */}
        <section style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'var(--surface-alt)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)'
              }}>
                <Cpu size={20} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                  Scala 3 &amp; Apache Pekko Real-Time Stream Engine
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Asynchronous sliding-window metrology &amp; reactive anomaly detection pipeline on JVM 21
                </div>
              </div>
            </div>
          </div>

          {/* Engine Status & Stream Control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Badge variant={connectionStatus === 'CONNECTED' ? 'success' : 'warning'} size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: connectionStatus === 'CONNECTED' ? '#10B981' : '#F59E0B', animation: 'pulseBeacon 2s infinite' }} />
              <span>{connectionStatus === 'CONNECTED' ? 'LIVE PEKKO STREAM (PORT 8090)' : 'IN-BROWSER REACTIVE SIMULATOR'}</span>
            </Badge>

            <Button
              variant={isLiveStreaming ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isLiveStreaming ? <Pause size={13} /> : <Play size={13} />}
              <span>{isLiveStreaming ? 'Pause Stream' : 'Resume Live Stream (1.2s)'}</span>
            </Button>
          </div>
        </section>

        {/* 3. Real-Time Telemetry KPI Ribbon */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid var(--accent-cyan)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
              Total Stream Ingested
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {engineMeta.totalIngestedCount.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>pkts</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Source.queue items processed</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid var(--accent-primary)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
              Rolling Buffer Depth
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {WINDOW_SIZE} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Samples</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>.sliding(10, step = 1) window</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid var(--accent-emerald)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
              Active WebSocket Sinks
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-emerald)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {engineMeta.activeSubscribers} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}>Subscriber{engineMeta.activeSubscribers !== 1 ? 's' : ''}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>BroadcastHub live fan-out</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid var(--accent-amber)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
              Engine Uptime
            </div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '2px' }}>
              {formatUptime(engineMeta.uptimeSeconds)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>JVM 21 system clock</div>
          </div>

          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', borderLeft: `3px solid ${aggregatedTelemetry.anomalyDetected ? 'var(--accent-red)' : 'var(--accent-emerald)'}` }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
              Threshold Gate Status
            </div>
            <div style={{ marginTop: '4px' }}>
              <Badge variant={aggregatedTelemetry.anomalyDetected ? 'danger' : 'success'} size="sm">
                {aggregatedTelemetry.anomalyDetected ? 'ANOMALY DETECTED' : 'NOMINAL SAFE'}
              </Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>Continuous safety evaluator</div>
          </div>
        </div>

        {/* 4. THE SIMPLE REAL-TIME WORKFLOW PIPELINE (3 CLEAR STAGES) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '24px' }}>
          {/* STAGE 1 & 2: INGESTION CONTROLLER + PEKKO SLIDING WINDOW BUFFER */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="var(--primary)" />
                <span>Real-Time Stream Processing Pipeline</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                  [ STAGE 1: INGEST ] ➔ [ STAGE 2: 10-SLOT SLIDING WINDOW BUFFER ] ➔ [ STAGE 3: METROLOGY ]
                </span>
              </div>
            }
            subtitle="Watch raw telemetry samples flow into the 10-sample moving buffer, triggering instant mathematical reductions"
          >
            {/* Quick Test Injection Action Row */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px',
              padding: '12px 14px',
              background: 'var(--surface-alt)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Test Injection Studio:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Inject instantaneous packets to test stream reactions
                </span>
              </div>

              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleInjectSample('NOMINAL')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <CheckCircle2 size={12} />
                  <span>Nominal Packet</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleInjectSample('VIB_SPIKE')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-amber)' }}
                >
                  <Zap size={12} />
                  <span>Vibration Slip (0.74g)</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleInjectSample('TILT_BREACH')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-red)' }}
                >
                  <AlertTriangle size={12} />
                  <span>Critical Tilt (6.9°)</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleInjectSample('THERMAL_OVERHEAT')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--accent-red)' }}
                >
                  <Flame size={12} />
                  <span>Thermal (49.2°C)</span>
                </Button>
              </div>
            </div>

            {/* Visual 10-Slot Sliding Window Buffer Strip */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Pekko Sliding Window (N=10 Samples Moving Buffer)
                </span>
                <span style={{ fontSize: '11px', fontFamily: DesignTokens.typography.mono, color: 'var(--text-muted)' }}>
                  FIFO: OLDEST (SLOT 1) ➔ NEWEST (SLOT 10)
                </span>
              </div>

              {/* 10 Buffer Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                gap: '8px',
                overflowX: 'auto',
                padding: '4px 0'
              }}>
                {windowBuffer.map((sample) => (
                  <div
                    key={sample.slot}
                    style={{
                      background: sample.isNew && bufferPulse ? 'var(--pastel-blue-bg)' : 'var(--surface)',
                      border: `1px solid ${sample.vib > 0.4 || sample.tilt > 5.0 ? 'var(--accent-red)' : (sample.isNew ? 'var(--accent-primary)' : 'var(--border)')}`,
                      borderRadius: '6px',
                      padding: '8px 6px',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      boxShadow: sample.isNew && bufferPulse ? '0 0 10px rgba(6, 182, 212, 0.4)' : 'none'
                    }}
                  >
                    <div style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      fontFamily: DesignTokens.typography.mono,
                      color: sample.isNew ? 'var(--accent-primary)' : 'var(--text-muted)',
                      borderBottom: '1px solid var(--border)',
                      paddingBottom: '3px',
                      marginBottom: '4px'
                    }}>
                      SLOT #{sample.slot} {sample.isNew ? '★' : ''}
                    </div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: sample.vib > 0.4 ? 'var(--accent-red)' : 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>
                      {sample.vib.toFixed(2)}g
                    </div>
                    <div style={{ fontSize: '10px', color: sample.tilt > 5.0 ? 'var(--accent-red)' : 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                      {sample.tilt.toFixed(1)}°
                    </div>
                    <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sample.temp.toFixed(1)}°C
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stage 3 Reductions Summary Card */}
            <div style={{
              background: 'var(--surface-alt)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                  Computed Vibration RMS
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: aggregatedTelemetry.rmsVibration > 0.40 ? 'var(--accent-red)' : 'var(--accent-emerald)',
                  fontFamily: DesignTokens.typography.mono,
                  marginTop: '2px'
                }}>
                  {aggregatedTelemetry.rmsVibration.toFixed(2)} g RMS
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  RMS = √( (1/10) * Σ(vᵢ²) ) · Safe &lt; 0.40g
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                  Peak Crawler Azimuth Tilt
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: aggregatedTelemetry.maxTiltDeg > 5.0 ? 'var(--accent-red)' : 'var(--text-primary)',
                  fontFamily: DesignTokens.typography.mono,
                  marginTop: '2px'
                }}>
                  {aggregatedTelemetry.maxTiltDeg.toFixed(1)} °
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Peak = max(tiltᵢ) · Slope Limit 5.0°
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                  Sliding Mean Temperature
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: aggregatedTelemetry.avgTempC > 45.0 ? 'var(--accent-red)' : 'var(--text-primary)',
                  fontFamily: DesignTokens.typography.mono,
                  marginTop: '2px'
                }}>
                  {aggregatedTelemetry.avgTempC.toFixed(1)} °C
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Mean = (1/10) * Σ(Tᵢ) · Limit 45.0°C
                </div>
              </div>

              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontFamily: DesignTokens.typography.mono }}>
                  Latest Ingested Raw Packet
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono, marginTop: '4px' }}>
                  {lastRawPacket.roverCode} · {lastRawPacket.vibrationLevel.toFixed(2)}g vib · {lastRawPacket.roverTiltDeg.toFixed(1)}° tilt
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {lastRawPacket.ambientTempC.toFixed(1)}°C · {lastRawPacket.humidityPct.toFixed(1)}% RH · {lastRawPacket.batteryPercentage}% batt
                </div>
              </div>
            </div>
          </Card>

          {/* STAGE 3: SYNCHRONIZED REAL-TIME STREAM CHARTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
            {/* Chart 1: Vibration RMS Stream */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="var(--primary)" />
                  <span>Continuous Vibration RMS vs. Safe Limit (0.40g)</span>
                </div>
              }
              subtitle="Pekko stream sliding window root-mean-square vibration"
            >
              <div style={{ width: '100%', height: 230 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scalaVibGradient" x1="0" y1="0" x2="0" y2="1">
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
                    <Area type="monotone" dataKey="rmsVib" name="RMS Vibration (g)" stroke="var(--accent-cyan)" strokeWidth={2} fillOpacity={1} fill="url(#scalaVibGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Chart 2: Chassis Tilt Stream */}
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={16} color="var(--primary)" />
                  <span>Chassis Tilt Azimuth vs. Slope Limit (5.0°)</span>
                </div>
              }
              subtitle="Peak inclination angle across vertical retaining concrete facade"
            >
              <div style={{ width: '100%', height: 230 }}>
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

          {/* STAGE 4: ACTIVE ANOMALIES & SAFETY MONITOR */}
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color={activeAlerts.length > 0 ? 'var(--accent-red)' : 'var(--accent-emerald)'} />
                <span>Pekko Reactive Anomaly Gate &amp; Safety Ledger</span>
              </div>
            }
            subtitle="Automated alerts fired when sliding-window metrics exceed civil engineering thresholds"
          >
            {activeAlerts.length === 0 ? (
              <div style={{
                padding: '20px',
                textAlign: 'center',
                color: 'var(--text-secondary)',
                background: 'var(--surface-alt)',
                borderRadius: '8px',
                border: '1px dashed var(--border)',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={20} color="var(--accent-emerald)" />
                <span>Stream telemetry is healthy. All 10 samples within nominal ASTM / ACI 224R operating limits.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeAlerts.map(alert => (
                  <div
                    key={alert.id || alert.timestampMs}
                    style={{
                      background: alert.severity === 'CRITICAL' ? 'var(--pastel-red-bg)' : 'var(--pastel-yellow-bg)',
                      border: `1px solid ${alert.severity === 'CRITICAL' ? 'var(--pastel-red-border)' : 'var(--pastel-yellow-border)'}`,
                      borderRadius: '6px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <AlertTriangle size={16} color={alert.severity === 'CRITICAL' ? 'var(--accent-red)' : 'var(--accent-amber)'} />
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: alert.severity === 'CRITICAL' ? 'var(--pastel-red-text)' : 'var(--pastel-yellow-text)', fontFamily: DesignTokens.typography.mono }}>
                          {alert.alertType} · {alert.severity}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-primary)', marginTop: '2px' }}>
                          {alert.message}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', fontSize: '11px', fontFamily: DesignTokens.typography.mono }}>
                      <div>Measured: <strong style={{ color: 'var(--accent-red)' }}>{alert.measuredValue}</strong> (Limit: {alert.thresholdLimit})</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{new Date(alert.timestampMs).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* STAGE 5: COLLAPSIBLE DEVELOPER EVENT STREAM CONSOLE */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={() => setShowConsole(!showConsole)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: 600
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} color="var(--primary)" />
                <span>Developer Event Stream Console ({terminalLogs.length} events logged)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{showConsole ? 'Hide Console' : 'Show Console'}</span>
                {showConsole ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {showConsole && (
              <div style={{
                borderTop: '1px solid var(--border)',
                padding: '14px',
                background: 'var(--surface-raised, #10191c)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTerminalLogs([])}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                  >
                    <Trash2 size={12} />
                    <span>Clear Events</span>
                  </Button>
                </div>

                <div style={{
                  fontFamily: DesignTokens.typography.mono,
                  fontSize: '11px',
                  maxHeight: '180px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px'
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
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 5. Footer */}
      <footer className="ui-footer">
        <div className="ui-footer__inner">
          <span>Agile Rover · Scala 3 &amp; Apache Pekko Reactive Pipeline</span>
          <span className="dash__footer-right">
            <a href="#/">← Back to Structural Dashboard</a>
            <a href="#/ui-kit">UI Kit</a>
            <span>Port 8090 · Reactive Streams v1.0</span>
          </span>
        </div>
      </footer>
    </div>
  );
};
