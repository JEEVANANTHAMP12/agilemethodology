import React, { useState, useEffect } from 'react';
import { Button, Modal, Input } from './UI/Components';
import {
  Play as IconPlay,
  Square as IconSquare,
  Cpu as IconCpu,
  Upload as IconUpload,
  Thermometer as IconThermometer,
  Droplets as IconDroplet,
  Compass as IconCompass,
  Activity as IconActivity,
  Wifi as IconWifi,
  Battery as IconBattery,
  Building2 as IconBuilding,
  Gamepad2 as IconGamepad
} from 'lucide-react';
import { DesignTokens } from '../tokens';
import { api } from '../services/api';
import { useAnimatedNumber } from './UI/useAnimatedNumber';
import { RoverTeleopPad } from './RoverTeleopPad';

export const LiveInspection = ({ inspectionData = {}, roverData = {}, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('MODERATE');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDistance, setUploadDistance] = useState(250);
  const [showTeleop, setShowTeleop] = useState(false); // Collapsed by default

  // Facility & Wall Selection
  const [walls, setWalls] = useState([]);
  const [selectedWallId, setSelectedWallId] = useState(inspectionData.wall_id || 1);

  useEffect(() => {
    api.structures.getWalls()
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setWalls(data);
        }
      })
      .catch(e => console.log('Notice loading walls:', e));
  }, []);

  const isInspecting = inspectionData.status === 'IN_PROGRESS';

  // Real-time Scala 3 / Pekko Reactive Stream integration (Port 8090)
  const [liveStreamSample, setLiveStreamSample] = useState(null);

  useEffect(() => {
    let ws = null;
    try {
      ws = api.scalaStream.connectLiveWebSocket(
        (data) => {
          if (data) setLiveStreamSample(data);
        },
        () => {
          // Fallback silently to polling inspectionData if Scala stream is inactive
        }
      );
    } catch {
      // Ignore network errors
    }
    return () => {
      try {
        if (ws && ws.readyState === 1) ws.close();
      } catch {
        // cleanup
      }
    };
  }, []);

  const tempVal = liveStreamSample?.avg_temp_c ?? liveStreamSample?.avgTempC ?? inspectionData.ambient_temp_c ?? 26.5;
  const humidityVal = liveStreamSample?.humidity_pct ?? liveStreamSample?.avgHumidityPct ?? inspectionData.humidity_pct ?? 55.0;
  const tiltVal = liveStreamSample?.rover_tilt_deg ?? liveStreamSample?.maxTiltDeg ?? inspectionData.rover_tilt_deg ?? 1.2;
  const vibrationVal = liveStreamSample?.vibration_level ?? liveStreamSample?.rmsVibration ?? inspectionData.vibration_level ?? 0.08;
  const batteryVal = liveStreamSample?.battery_percentage ?? liveStreamSample?.currentBatteryPct ?? roverData.battery_percentage ?? 95;
  const wifiVal = liveStreamSample?.wifi_signal_dbm ?? liveStreamSample?.minWifiSignalDbm ?? roverData.wifi_signal_dbm ?? -58;

  // Crisp telemetry values
  const animatedTemp = useAnimatedNumber(tempVal, 600, 1);
  const animatedHumidity = useAnimatedNumber(humidityVal, 600, 1);
  const animatedTilt = useAnimatedNumber(tiltVal, 600, 1);
  const animatedVibration = useAnimatedNumber(vibrationVal, 600, 2);
  const animatedBattery = useAnimatedNumber(batteryVal, 600, 0);

  const handleStartInspection = async () => {
    try {
      setLoading(true);
      await api.inspection.start(selectedWallId, roverData.rover_code || 'ROVER-01');
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert('Inspection initiation error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStopInspection = async () => {
    if (!inspectionData.inspection_id) return;
    try {
      setLoading(true);
      await api.inspection.stop(inspectionData.inspection_id, 'Completed operator inspection cycle');
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert('Inspection termination error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulate = async () => {
    try {
      setLoading(true);
      await api.rover.simulateScan(selectedSeverity, selectedWallId);
      setIsSimModalOpen(false);
      if (onActionComplete) onActionComplete();
    } catch (e) {
      alert('Simulation error: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert('Select an image file before proceeding.');
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
      if (onActionComplete) onActionComplete();
    } catch (err) {
      alert('Image upload error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="live-console">
      {/* 1. Header Toolbar: Facade Stance & Primary Action Buttons */}
      <div className="live-console__toolbar">
        <div className="live-console__stance">
          <div className="live-console__selector-wrap">
            <IconBuilding size={14} className="ui-muted" />
            <select
              aria-label="Target concrete facade"
              className="live-console__select"
              value={selectedWallId}
              onChange={(e) => setSelectedWallId(Number(e.target.value))}
            >
              {walls.length > 0 ? (
                walls.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.material || 'C35 Concrete'})
                  </option>
                ))
              ) : (
                <option value="1">North Bearing Facade (C35 Concrete)</option>
              )}
            </select>
          </div>

          <div className="live-console__meta-tags">
            <span className="live-console__meta-tag">Standoff: <strong>250 mm</strong></span>
            <span className="live-console__meta-divider">·</span>
            <span className="live-console__meta-tag">Optical Scale: <strong>2.50 px/mm</strong></span>
            <span className="live-console__meta-divider">·</span>
            <span className="live-console__meta-tag">Session: <strong style={{ fontFamily: DesignTokens.typography.mono }}>{inspectionData.inspection_code || 'INSP-LIVE'}</strong></span>
          </div>
        </div>

        <div className="live-console__actions">
          {!isInspecting ? (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={handleStartInspection}
              icon={<IconPlay size={13} />}
            >
              Start Inspection
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              loading={loading}
              onClick={handleStopInspection}
              icon={<IconSquare size={13} />}
            >
              End Session
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={() => setIsSimModalOpen(true)}
            icon={<IconCpu size={13} />}
          >
            Simulate Scan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            icon={<IconUpload size={13} />}
          >
            Upload Frame
          </Button>

          <Button
            variant={showTeleop ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowTeleop(!showTeleop)}
            icon={<IconGamepad size={14} />}
          >
            {showTeleop ? 'Hide Flight Pad' : 'Show Flight Pad'}
          </Button>
        </div>
      </div>

      {/* 2. Calm Telemetry Grid: Clean, stationary numbers and units */}
      <div className="live-telemetry-grid">
        {/* Ambient Temperature */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconThermometer size={13} />
              <span>Ambient Temp</span>
            </span>
            <span className="live-telemetry-card__badge">Air</span>
          </div>
          <div className="live-telemetry-card__value">
            {animatedTemp}
            <span className="live-telemetry-card__unit">°C</span>
          </div>
          <div className="live-telemetry-card__sub">Nominal range 15–35°C</div>
        </div>

        {/* Relative Humidity */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconDroplet size={13} />
              <span>Relative Humidity</span>
            </span>
            <span className="live-telemetry-card__badge">Sensor</span>
          </div>
          <div className="live-telemetry-card__value">
            {animatedHumidity}
            <span className="live-telemetry-card__unit">%</span>
          </div>
          <div className="live-telemetry-card__sub">Non-condensing environment</div>
        </div>

        {/* Crawler Inclinometer */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconCompass size={13} />
              <span>Crawler Tilt</span>
            </span>
            <span className="live-telemetry-card__badge">Attitude</span>
          </div>
          <div className="live-telemetry-card__value">
            {animatedTilt}
            <span className="live-telemetry-card__unit">°</span>
          </div>
          <div className="live-telemetry-card__sub">Pitch & roll angle within ±5°</div>
        </div>

        {/* Vibration RMS */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconActivity size={13} />
              <span>Vibration RMS</span>
            </span>
            <span className="live-telemetry-card__badge">Chassis</span>
          </div>
          <div className="live-telemetry-card__value">
            {animatedVibration}
            <span className="live-telemetry-card__unit">g</span>
          </div>
          <div className="live-telemetry-card__sub">Mechanical stability nominal</div>
        </div>

        {/* Carrier Signal */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconWifi size={13} />
              <span>Wi-Fi Signal</span>
            </span>
            <span className="live-telemetry-card__badge">802.11n</span>
          </div>
          <div className="live-telemetry-card__value">
            {wifiVal}
            <span className="live-telemetry-card__unit">dBm</span>
          </div>
          <div className="live-telemetry-card__sub">Low-latency RF link active</div>
        </div>

        {/* Battery Power */}
        <div className="live-telemetry-card">
          <div className="live-telemetry-card__header">
            <span className="live-telemetry-card__label">
              <IconBattery size={13} />
              <span>Battery Reserve</span>
            </span>
            <span className="live-telemetry-card__badge">4S Li-Ion</span>
          </div>
          <div className="live-telemetry-card__value">
            {animatedBattery}
            <span className="live-telemetry-card__unit">%</span>
          </div>
          <div className="live-telemetry-card__sub">~4.2 hrs operational capacity</div>
        </div>
      </div>

      {/* 3. Collapsible Rover Flight Pad (Hidden by default) */}
      {showTeleop && (
        <div className="live-teleop-drawer ui-animate-rise">
          <RoverTeleopPad
            roverCode={roverData.rover_code || 'ROVER-01'}
            roverStatus={roverData.rover_status || 'CONNECTED'}
            batteryPercentage={roverData.battery_percentage}
            wifiSignal={roverData.wifi_signal_dbm}
          />
        </div>
      )}

      {/* Simulation Modal */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title="Simulate Autonomous Wall Scan"
      >
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.6' }}>
          Synthesizes a realistic high-definition concrete surface image, processes the simulated frame through the OpenCV crack measurement pipeline, computes Structural Health Index (SHI), and updates the RUL degradation model.
        </p>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '8px' }}>
            Select Target Crack Profile:
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
            {['NONE', 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'].map((sev) => {
              const active = selectedSeverity === sev;
              return (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    padding: '10px 4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    background: active ? 'var(--text-primary)' : 'var(--surface-alt)',
                    color: active ? 'var(--canvas)' : 'var(--text-secondary)',
                    border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border)'}`,
                    transition: 'all 0.15s ease',
                    cursor: 'pointer'
                  }}
                >
                  {sev}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setIsSimModalOpen(false)}>Cancel</Button>
          <Button variant="primary" loading={loading} onClick={handleRunSimulate}>Run Autonomous Scan</Button>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Wall Image for Crack Measurement"
      >
        <form onSubmit={handleManualUpload}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              Select Wall Image File (JPG / PNG):
            </label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={(e) => setUploadFile(e.target.files[0])}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                background: 'var(--surface)',
                color: 'var(--text-primary)'
              }}
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <Input
              label="Standoff Distance to Wall (mm)"
              type="number"
              value={uploadDistance}
              onChange={(e) => setUploadDistance(e.target.value)}
              helperText="Nominal camera distance from concrete surface is 250 mm"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={loading}>Upload &amp; Analyze</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
