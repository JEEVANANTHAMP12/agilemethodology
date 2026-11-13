import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  Cpu,
  Upload,
  Thermometer,
  Droplets,
  Compass,
  Activity,
  Wifi,
  Battery,
  Building2,
  Gamepad2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input, Label } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { api } from '../services/api';
import { RoverTeleopPad } from './RoverTeleopPad';
import { cn } from '../lib/utils';

export const LiveInspection = ({ inspectionData = {}, roverData = {}, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('MODERATE');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDistance, setUploadDistance] = useState(250);
  const [showTeleop, setShowTeleop] = useState(false);

  const [walls, setWalls] = useState([]);
  const [selectedWallId, setSelectedWallId] = useState(inspectionData.wall_id || 1);
  const [liveStreamSample, setLiveStreamSample] = useState(null);

  useEffect(() => {
    api.structures
      .getWalls()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setWalls(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let ws = null;
    try {
      ws = api.scalaStream.connectLiveWebSocket(
        (data) => {
          if (data) setLiveStreamSample(data);
        },
        () => {}
      );
    } catch {
      // ignore if WS unavailable
    }
    return () => {
      try {
        if (ws && ws.readyState === 1) ws.close();
      } catch {
        // cleanup
      }
    };
  }, []);

  const isInspecting = inspectionData.status === 'IN_PROGRESS';

  const tempVal = Number(liveStreamSample?.avg_temp_c ?? liveStreamSample?.avgTempC ?? inspectionData.ambient_temp_c ?? 26.5);
  const humidityVal = Number(liveStreamSample?.humidity_pct ?? liveStreamSample?.avgHumidityPct ?? inspectionData.humidity_pct ?? 55.0);
  const tiltVal = Number(liveStreamSample?.rover_tilt_deg ?? liveStreamSample?.maxTiltDeg ?? inspectionData.rover_tilt_deg ?? 1.2);
  const vibrationVal = Number(liveStreamSample?.vibration_level ?? liveStreamSample?.rmsVibration ?? inspectionData.vibration_level ?? 0.08);
  const batteryVal = Number(liveStreamSample?.battery_percentage ?? liveStreamSample?.currentBatteryPct ?? roverData.battery_percentage ?? 95);
  const wifiVal = liveStreamSample?.wifi_signal_dbm ?? liveStreamSample?.minWifiSignalDbm ?? roverData.wifi_signal_dbm ?? -58;

  const handleStartInspection = async () => {
    try {
      setLoading(true);
      await api.inspection.start(selectedWallId, roverData.rover_code || 'ROVER-01');
      toast.success('Inspection session started');
      if (onActionComplete) onActionComplete();
    } catch (e) {
      toast.error(e.message || 'Unable to start inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleStopInspection = async () => {
    if (!inspectionData.inspection_id) return;
    try {
      setLoading(true);
      await api.inspection.stop(inspectionData.inspection_id, 'Completed operator inspection cycle');
      toast.success('Inspection session completed');
      if (onActionComplete) onActionComplete();
    } catch (e) {
      toast.error(e.message || 'Unable to complete inspection');
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulate = async () => {
    try {
      setLoading(true);
      await api.rover.simulateScan(selectedSeverity, selectedWallId);
      setIsSimModalOpen(false);
      toast.success(`Simulated ${selectedSeverity} wall scan saved`);
      if (onActionComplete) onActionComplete();
    } catch (e) {
      toast.error(e.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      toast.warning('Select an image file before uploading');
      return;
    }
    const currentId = inspectionData.inspection_id || 1;
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append('inspection_id', currentId);
      fd.append('file', uploadFile);
      fd.append('distance_to_wall_mm', uploadDistance);
      await api.images.upload(fd);
      setIsUploadModalOpen(false);
      setUploadFile(null);
      toast.success('Frame uploaded and analyzed');
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error(err.message || 'Image upload failed');
    } finally {
      setLoading(false);
    }
  };

  const sensors = [
    { label: 'Ambient Temp', tag: 'Air', value: tempVal.toFixed(1), unit: '°C', sub: 'Nominal 15–35°C', icon: Thermometer },
    { label: 'Relative Humidity', tag: 'Sensor', value: humidityVal.toFixed(1), unit: '%', sub: 'Non-condensing', icon: Droplets },
    { label: 'Crawler Tilt', tag: 'IMU', value: tiltVal.toFixed(1), unit: '°', sub: 'Limit ±5.0°', icon: Compass },
    { label: 'Vibration RMS', tag: 'Chassis', value: vibrationVal.toFixed(2), unit: 'g', sub: 'Limit ≤ 0.40g', icon: Activity },
    { label: 'Wi-Fi Signal', tag: '802.11n', value: wifiVal, unit: 'dBm', sub: 'Telemetry link', icon: Wifi },
    { label: 'Battery Reserve', tag: '4S Li-Ion', value: Math.round(batteryVal), unit: '%', sub: 'Nominal capacity', icon: Battery },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <select
                aria-label="Target concrete facade"
                value={selectedWallId}
                onChange={(e) => setSelectedWallId(Number(e.target.value))}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {walls.length > 0 ? (
                  walls.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.material || 'C35 Concrete'})
                    </option>
                  ))
                ) : (
                  <option value="1">North Bearing Facade (C35 Concrete)</option>
                )}
              </select>
            </div>

            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span>Standoff: <strong className="text-foreground">250 mm</strong></span>
              <span>·</span>
              <span>Scale: <strong className="text-foreground">2.50 px/mm</strong></span>
              <span>·</span>
              <Badge variant="outline" className="font-mono">
                {inspectionData.inspection_code || 'INSP-LIVE'}
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isInspecting ? (
              <Button size="sm" loading={loading} onClick={handleStartInspection}>
                <Play className="h-3.5 w-3.5" />
                <span>Start Inspection</span>
              </Button>
            ) : (
              <Button variant="destructive" size="sm" loading={loading} onClick={handleStopInspection}>
                <Square className="h-3.5 w-3.5" />
                <span>End Session</span>
              </Button>
            )}

            <Button variant="secondary" size="sm" loading={loading} onClick={() => setIsSimModalOpen(true)}>
              <Cpu className="h-3.5 w-3.5" />
              <span>Simulate Scan</span>
            </Button>

            <Button variant="outline" size="sm" onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Frame</span>
            </Button>

            <Button variant={showTeleop ? 'default' : 'outline'} size="sm" onClick={() => setShowTeleop(!showTeleop)}>
              <Gamepad2 className="h-3.5 w-3.5" />
              <span>{showTeleop ? 'Hide Controls' : 'Teleop'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sensors.map((sensor) => {
          const Icon = sensor.icon;
          return (
            <Card key={sensor.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Icon className="h-3.5 w-3.5" />
                    {sensor.label}
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{sensor.tag}</Badge>
                </div>
                <div className="mt-2 font-mono text-2xl font-semibold tabular-nums">
                  {sensor.value}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{sensor.unit}</span>
                </div>
                <div className="mt-1 text-[11px] text-muted-foreground">{sensor.sub}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showTeleop && (
        <RoverTeleopPad
          roverStatus={roverData.rover_status || 'CONNECTED'}
        />
      )}

      {/* Simulation Dialog */}
      <Dialog open={isSimModalOpen} onOpenChange={setIsSimModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Simulate Autonomous Wall Scan</DialogTitle>
            <DialogDescription>
              Synthesizes a concrete surface frame, runs crack metrology, updates SHI, and computes RUL.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label>Target Crack Severity</Label>
            <div className="grid grid-cols-5 gap-2">
              {['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  className={cn(
                    'rounded-md border px-2 py-2 text-[11px] font-medium transition-colors cursor-pointer',
                    selectedSeverity === sev
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSimModalOpen(false)}>Cancel</Button>
            <Button loading={loading} onClick={handleRunSimulate}>Run Scan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Wall Frame</DialogTitle>
            <DialogDescription>
              Select an inspection photograph for OpenCV &amp; ML crack quantification.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleManualUpload} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="live-upload-input">Image File (JPG / PNG)</Label>
              <Input
                id="live-upload-input"
                type="file"
                accept="image/*"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="live-standoff">Standoff Distance (mm)</Label>
              <Input
                id="live-standoff"
                type="number"
                value={uploadDistance}
                onChange={(e) => setUploadDistance(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">Nominal calibration distance is 250 mm (2.50 px/mm).</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
              <Button type="submit" loading={loading}>Upload &amp; Analyze</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
