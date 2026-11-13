import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  Radio,
  ShieldCheck,
  Terminal,
  Trash2,
  Zap,
  ChevronDown,
  ChevronUp,
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
  ReferenceLine,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { SparkScalaReportView } from './SparkScalaReportView';
import { api } from '../services/api';
import { cn } from '../lib/utils';

const PRESETS = [
  {
    id: 'nominal',
    label: 'Nominal Packet',
    sample: { roverCode: 'ROVER-01', ambientTempC: 26.2, humidityPct: 54.0, roverTiltDeg: 1.2, vibrationLevel: 0.08, wifiSignalDbm: -53, batteryPercentage: 97.5 },
  },
  {
    id: 'vibration',
    label: 'Vibration Slip (0.74g)',
    sample: { roverCode: 'ROVER-01', ambientTempC: 28.0, humidityPct: 55.0, roverTiltDeg: 2.1, vibrationLevel: 0.74, wifiSignalDbm: -56, batteryPercentage: 94.0 },
  },
  {
    id: 'tilt',
    label: 'Critical Tilt (6.9°)',
    sample: { roverCode: 'ROVER-01', ambientTempC: 29.0, humidityPct: 52.0, roverTiltDeg: 6.9, vibrationLevel: 0.22, wifiSignalDbm: -58, batteryPercentage: 92.0 },
  },
  {
    id: 'thermal',
    label: 'Thermal Overheat (49.2°C)',
    sample: { roverCode: 'ROVER-01', ambientTempC: 49.2, humidityPct: 48.0, roverTiltDeg: 1.5, vibrationLevel: 0.14, wifiSignalDbm: -55, batteryPercentage: 91.0 },
  },
];

export const ScalaStreamPanel = ({ onActionComplete }) => {
  const [connMode, setConnMode] = useState('CHECKING'); // 'WS' | 'POLLING' | 'OFFLINE' | 'CHECKING'
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showConsole, setShowConsole] = useState(false);
  const [busy, setBusy] = useState(false);
  const logIdRef = useRef(1);

  const appendLog = useCallback((tag, msg) => {
    setLogs((prev) => [
      { id: logIdRef.current++, time: new Date().toLocaleTimeString(), tag, msg },
      ...prev.slice(0, 29),
    ]);
  }, []);

  const refreshSnapshot = useCallback(async () => {
    try {
      const [statsRes, histRes] = await Promise.all([
        api.scalaStream.getStats(),
        api.scalaStream.getHistory().catch(() => []),
      ]);
      setStats(statsRes);
      if (Array.isArray(histRes) && histRes.length > 0) {
        setHistory(
          histRes.slice(-24).map((h) => ({
            time: new Date(h.timestampMs || Date.now()).toLocaleTimeString(),
            rmsVib: Number(h.rmsVibration || 0),
            tilt: Number(h.maxTiltDeg || 0),
            temp: Number(h.avgTempC || 0),
            battery: Number(h.currentBatteryPct || 0),
          }))
        );
      }
      setConnMode((prev) => (prev === 'WS' ? 'WS' : 'POLLING'));
      return true;
    } catch {
      setConnMode('OFFLINE');
      return false;
    }
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => refreshSnapshot(), 0);
    const timer = window.setInterval(() => {
      refreshSnapshot();
    }, 2000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refreshSnapshot]);

  useEffect(() => {
    let ws = null;
    let cancelled = false;

    try {
      ws = api.scalaStream.connectLiveWebSocket(
        (agg) => {
          if (cancelled || !agg) return;
          setConnMode('WS');
          setStats((prev) =>
            prev
              ? { ...prev, totalIngestedCount: prev.totalIngestedCount + 1, lastAggregation: agg }
              : { engine: 'Apache-Pekko-Scala3-Stream-Engine', status: 'RUNNING', totalIngestedCount: 1, activeSubscribers: 1, uptimeSeconds: 0, activeAlerts: [], lastAggregation: agg }
          );
          setHistory((prev) => [
            ...prev.slice(-23),
            {
              time: new Date(agg.timestampMs || Date.now()).toLocaleTimeString(),
              rmsVib: Number(agg.rmsVibration || 0),
              tilt: Number(agg.maxTiltDeg || 0),
              temp: Number(agg.avgTempC || 0),
              battery: Number(agg.currentBatteryPct || 0),
            },
          ]);
          appendLog('WS', `RMS=${agg.rmsVibration}g · MaxTilt=${agg.maxTiltDeg}° · Temp=${agg.avgTempC}°C`);
        },
        () => {
          if (!cancelled) setConnMode((prev) => (prev === 'WS' ? 'POLLING' : prev));
        }
      );

      if (ws) {
        ws.onopen = () => {
          if (!cancelled) {
            setConnMode('WS');
            appendLog('PEKKO', 'WebSocket connected to port 8090');
          }
        };
        ws.onclose = () => {
          if (!cancelled) setConnMode((prev) => (prev === 'WS' ? 'POLLING' : prev));
        };
      }
    } catch {
      // rely on polling
    }

    return () => {
      cancelled = true;
      try {
        if (ws && ws.readyState === 1) ws.close();
      } catch {
        // cleanup
      }
    };
  }, [appendLog]);

  const handleInjectPreset = async (preset) => {
    try {
      setBusy(true);
      await api.scalaStream.ingestTelemetry(preset.sample);
      appendLog('INGEST', `Sent ${preset.label}`);
      toast.success(`Injected ${preset.label}`);
      await refreshSnapshot();
      if (onActionComplete) onActionComplete();
    } catch (e) {
      toast.error(e.message || 'Scala engine unreachable on port 8090');
    } finally {
      setBusy(false);
    }
  };

  const handleResetAlerts = async () => {
    try {
      setBusy(true);
      await api.scalaStream.resetAlerts();
      appendLog('ALERT', 'Cleared active Pekko alerts');
      toast.success('Cleared active stream alerts');
      await refreshSnapshot();
    } catch (e) {
      toast.error(e.message || 'Unable to reset alerts');
    } finally {
      setBusy(false);
    }
  };

  const agg = stats?.lastAggregation || {};
  const alerts = stats?.activeAlerts || [];
  const rmsVib = Number(agg.rmsVibration ?? 0);
  const maxTilt = Number(agg.maxTiltDeg ?? 0);
  const avgTemp = Number(agg.avgTempC ?? 0);
  const battery = Number(agg.currentBatteryPct ?? 0);

  const [mode, setMode] = useState(() => (window.location.hash.includes('spark') ? 'spark' : 'stream'));

  return (
    <Tabs value={mode} onValueChange={setMode} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          <TabsTrigger value="stream">
            <Radio className="h-3.5 w-3.5" />
            <span>Live Pekko Stream</span>
          </TabsTrigger>
          <TabsTrigger value="spark">
            <Cpu className="h-3.5 w-3.5" />
            <span>Spark 7-Stage Analysis</span>
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="stream" className="space-y-4">
      {connMode === 'OFFLINE' && (
        <Alert variant="warning">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Scala Telemetry Engine Offline (Port 8090)</AlertTitle>
          <AlertDescription>
            Start the Scala service using <code className="font-mono">./run_scala.bat</code> to stream real-time Pekko metrics.
          </AlertDescription>
        </Alert>
      )}

      {/* Status Header */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span>Scala 3 &amp; Apache Pekko Telemetry Stream</span>
            </CardTitle>
            <CardDescription>
              Non-blocking 10-sample rolling window reductions via Apache Pekko Streams.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={connMode === 'WS' ? 'success' : connMode === 'POLLING' ? 'info' : 'destructive'}
            >
              <Radio className="h-3 w-3" />
              {connMode === 'WS' ? 'WebSocket Live' : connMode === 'POLLING' ? 'HTTP Polling' : connMode === 'CHECKING' ? 'Connecting...' : 'Offline'}
            </Badge>
            <Badge variant="outline" className="font-mono tabular-nums">
              {stats?.totalIngestedCount ?? 0} pkts
            </Badge>
            <Badge variant="secondary" className="font-mono tabular-nums">
              Uptime {stats?.uptimeSeconds ?? 0}s
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Stage 1: Ingestion Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Zap className="h-3.5 w-3.5" />
              Inject Test Packet:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <Button key={p.id} variant="outline" size="sm" disabled={busy} onClick={() => handleInjectPreset(p)}>
                  {p.label}
                </Button>
              ))}
              {alerts.length > 0 && (
                <Button variant="ghost" size="sm" disabled={busy} onClick={handleResetAlerts}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear Alerts</span>
                </Button>
              )}
            </div>
          </div>

          {/* Stage 2: Window Reductions */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-md border p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">RMS Vibration (10-pt)</div>
              <div className={cn('mt-1 font-mono text-xl font-semibold tabular-nums', rmsVib > 0.4 && 'text-red-500')}>
                {rmsVib.toFixed(3)} g
              </div>
              <div className="text-[11px] text-muted-foreground">Limit &le; 0.400 g</div>
            </div>

            <div className="rounded-md border p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Peak Tilt</div>
              <div className={cn('mt-1 font-mono text-xl font-semibold tabular-nums', maxTilt > 5.0 && 'text-red-500')}>
                {maxTilt.toFixed(1)}°
              </div>
              <div className="text-[11px] text-muted-foreground">Limit &le; 5.0°</div>
            </div>

            <div className="rounded-md border p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Mean Temperature</div>
              <div className={cn('mt-1 font-mono text-xl font-semibold tabular-nums', avgTemp > 45.0 && 'text-amber-500')}>
                {avgTemp.toFixed(1)} °C
              </div>
              <div className="text-[11px] text-muted-foreground">Limit &le; 45.0 °C</div>
            </div>

            <div className="rounded-md border p-3.5">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Crawler Battery</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{battery.toFixed(1)}%</div>
              <div className="text-[11px] text-muted-foreground">Subscribers: {stats?.activeSubscribers ?? 0}</div>
            </div>
          </div>

          {/* Stage 3: Waveforms */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Activity className="h-3.5 w-3.5" />
                  <span>RMS Vibration Waveform (g)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={history} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 'auto']} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <ReferenceLine y={0.4} stroke="#ef4444" strokeDasharray="4 4" />
                      <Area type="monotone" dataKey="rmsVib" name="RMS Vib (g)" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.18} strokeWidth={2} isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-xs">
                  <Activity className="h-3.5 w-3.5" />
                  <span>Peak Chassis Tilt (°)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                      <YAxis domain={[0, 'auto']} stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <ReferenceLine y={5.0} stroke="#ef4444" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="tilt" name="Peak Tilt (°)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & History Table */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5">
                    {alerts.length > 0 ? <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> : <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />}
                    Safety Gate Status
                  </span>
                  <Badge variant={alerts.length > 0 ? 'destructive' : 'success'}>
                    {alerts.length > 0 ? `${alerts.length} Active` : 'Nominal'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {alerts.length === 0 ? (
                  <div className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    All sliding-window envelopes within nominal limits.
                  </div>
                ) : (
                  alerts.slice(0, 4).map((a, idx) => (
                    <div key={`${a.alertType}-${idx}`} className="rounded-md border border-red-500/30 bg-red-500/5 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-red-500">{a.alertType}</span>
                        <Badge variant={a.severity === 'CRITICAL' ? 'destructive' : 'warning'}>{a.severity}</Badge>
                      </div>
                      <p className="mt-1 text-muted-foreground">{a.message}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs">Recent Window Samples</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-48 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>RMS Vib</TableHead>
                        <TableHead>Tilt</TableHead>
                        <TableHead>Temp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.slice(-6).reverse().map((row, idx) => (
                        <TableRow key={`${row.time}-${idx}`}>
                          <TableCell className="font-mono text-[11px]">{row.time}</TableCell>
                          <TableCell className="font-mono tabular-nums">{row.rmsVib.toFixed(3)}g</TableCell>
                          <TableCell className="font-mono tabular-nums">{row.tilt.toFixed(1)}°</TableCell>
                          <TableCell className="font-mono tabular-nums">{row.temp.toFixed(1)}°C</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Collapsible Stream Log */}
          <div>
            <Button variant="outline" size="sm" className="w-full justify-between" onClick={() => setShowConsole(!showConsole)}>
              <span className="flex items-center gap-2">
                <Terminal className="h-3.5 w-3.5" />
                <span>Stream Event Log ({logs.length})</span>
              </span>
              {showConsole ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            {showConsole && (
              <div className="mt-2 max-h-44 overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[11px] space-y-1">
                {logs.length === 0 ? (
                  <div className="text-muted-foreground">No stream events captured yet.</div>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="flex gap-2">
                      <span className="text-muted-foreground">{l.time}</span>
                      <span className="font-semibold text-sky-500">[{l.tag}]</span>
                      <span>{l.msg}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="spark">
        <SparkScalaReportView />
      </TabsContent>
    </Tabs>
  );
};
