import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal, Input } from './UI/Components';
import {
  IconRover,
  IconPlay,
  IconSquare,
  IconCpu,
  IconUpload,
  IconThermometer,
  IconDroplet,
  IconCompass,
  IconActivity,
  IconBattery,
  IconBuilding
} from './UI/Icons';
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
  const [showTeleop, setShowTeleop] = useState(true);

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

  // Smooth animated telemetry values
  const animatedTemp = useAnimatedNumber(inspectionData.ambient_temp_c ?? 26.5, 800, 1);
  const animatedHumidity = useAnimatedNumber(inspectionData.humidity_pct ?? 55.0, 800, 1);
  const animatedTilt = useAnimatedNumber(inspectionData.rover_tilt_deg ?? 1.2, 800, 1);
  const animatedVibration = useAnimatedNumber(inspectionData.vibration_level ?? 0.08, 800, 2);
  const animatedBattery = useAnimatedNumber(roverData.battery_percentage ?? 95, 800, 0);

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

  // Tilt bubble coordinates (clamped between -12 and +12 px)
  const rawTilt = inspectionData.rover_tilt_deg ?? 1.2;
  const bubbleOffset = Math.max(-12, Math.min(12, rawTilt * 4));

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconRover size={18} color="var(--text-primary)" />
          <span>Live Autonomous Inspection Console</span>
        </div>
      }
      subtitle={`Target: ${inspectionData.wall_name || 'North Bearing Facade'} · Standoff Distance 250 mm`}
      tag={
        <Badge
          variant={isInspecting ? 'success' : 'neutral'}
          style={isInspecting ? { animation: 'pulseBeacon 2s infinite' } : {}}
        >
          {isInspecting ? 'Sensing Active' : 'Standby'}
        </Badge>
      }
      style={{ marginBottom: '24px' }}
    >
      {/* Target Asset Selector & Optical Rangefinder Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        padding: '12px 16px',
        background: 'var(--surface-alt)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Wall Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}>
            <IconBuilding size={14} />
            <span>Target Facade:</span>
          </span>
          <select
            value={selectedWallId}
            onChange={(e) => setSelectedWallId(Number(e.target.value))}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border)',
              cursor: 'pointer'
            }}
          >
            {walls.length > 0 ? (
              walls.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.material || 'Concrete'})
                </option>
              ))
            ) : (
              <option value="1">North Bearing Facade (C35 Concrete)</option>
            )}
          </select>

          <span style={{ color: 'var(--border)' }}>|</span>

          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Session: <strong style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--text-primary)' }}>{inspectionData.inspection_code || 'INSP-LIVE'}</strong>
          </span>
        </div>

        {/* Animated Ultrasonic Rangefinder Visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          <span>Optical Standoff:</span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface)',
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px solid var(--border)'
          }}>
            <svg width="24" height="16" viewBox="0 0 24 16">
              <circle cx="3" cy="8" r="2.5" fill="var(--text-primary)" />
              <path
                d="M 8 4 A 5 5 0 0 1 8 12"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ animation: 'radarWave 1.6s infinite' }}
              />
              <path
                d="M 13 2 A 8 8 0 0 1 13 14"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.6"
                strokeLinecap="round"
                style={{ animation: 'radarWave 1.6s 0.35s infinite' }}
              />
              <path
                d="M 18 1 A 11 11 0 0 1 18 15"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.2"
                strokeLinecap="round"
                style={{ animation: 'radarWave 1.6s 0.7s infinite' }}
              />
              <line x1="22" y1="1" x2="22" y2="15" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: DesignTokens.typography.mono }}>250 mm</span>
          </div>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Scale: <strong style={{ color: 'var(--text-primary)' }}>2.5 px/mm</strong></span>
        </div>
      </div>

      {/* Bento Grid Telemetry Tiles with Animated Sensor Visualizations */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* 1. Ambient Temp */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconThermometer size={14} color="var(--accent-amber)" />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ambient Temp</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-amber)', animation: 'pulseBeacon 2.5s infinite' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {animatedTemp} &deg;C
          </div>

          {/* Mini Temperature Sparkline with Continuous Electric Pulse */}
          <div style={{ width: '100%', height: '24px', marginTop: '8px' }}>
            <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 14 Q 25 8, 50 12 T 100 10"
                fill="none"
                stroke="var(--accent-amber)"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="animate-chart-path"
              />
              <path
                d="M 0 14 Q 25 8, 50 12 T 100 10"
                fill="none"
                stroke="var(--accent-amber)"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                strokeLinecap="round"
                className="animate-flow-dash"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* 2. Relative Humidity */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconDroplet size={14} color="var(--accent-cyan)" />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Relative Humidity</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'pulseBeacon 2.5s infinite' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {animatedHumidity} %
          </div>

          <div style={{ width: '100%', height: '24px', marginTop: '8px' }}>
            <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 12 Q 25 18, 50 10 T 100 14"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="animate-chart-path"
              />
              <path
                d="M 0 12 Q 25 18, 50 10 T 100 14"
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="1.8"
                strokeDasharray="4 4"
                strokeLinecap="round"
                className="animate-flow-dash"
                opacity="0.8"
              />
            </svg>
          </div>
        </div>

        {/* 3. Crawler Inclinometer / Artificial Horizon Level */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconCompass size={14} color="var(--accent-emerald)" />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Crawler Tilt</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {animatedTilt}&deg;
            </div>

            {/* Inclinometer Gauge Bubble */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1.5px solid var(--border)',
              background: 'var(--surface)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'var(--border)' }} />
              <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'var(--border)' }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-emerald)',
                transform: `translate(${bubbleOffset}px, ${-bubbleOffset * 0.4}px)`,
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 6px rgba(16, 185, 129, 0.5)'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Roll / Pitch inclinometer
          </div>
        </div>

        {/* 4. Vibration RMS Live Oscilloscope */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconActivity size={14} color="var(--text-primary)" />
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vibration RMS</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-primary)' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {animatedVibration} g
          </div>

          <div style={{ width: '100%', height: '24px', marginTop: '8px', overflow: 'hidden' }}>
            <svg width="300" height="24" viewBox="0 0 300 24" className="animate-oscilloscope" style={{ overflow: 'visible' }}>
              <path
                d="M 0 12 Q 12 4, 25 12 T 50 12 T 75 12 T 100 12 T 125 12 T 150 12 T 175 12 T 200 12 T 225 12 T 250 12 T 275 12 T 300 12"
                fill="none"
                stroke="var(--text-primary)"
                strokeWidth="1.8"
              />
            </svg>
          </div>
        </div>

        {/* 5. Carrier Signal RF Visualizer */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Carrier Signal</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'pulseBeacon 2s infinite' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {roverData.wifi_signal_dbm ?? -58} <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--text-secondary)' }}>dBm</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
              <div className="animate-eq-1" style={{ width: '4px', height: '6px', background: 'var(--accent-emerald)', borderRadius: '1px' }} />
              <div className="animate-eq-2" style={{ width: '4px', height: '10px', background: 'var(--accent-emerald)', borderRadius: '1px' }} />
              <div className="animate-eq-3" style={{ width: '4px', height: '14px', background: 'var(--accent-emerald)', borderRadius: '1px' }} />
              <div className="animate-eq-1" style={{ width: '4px', height: '18px', background: (roverData.wifi_signal_dbm ?? -58) > -65 ? 'var(--accent-emerald)' : 'var(--border)', borderRadius: '1px', animationDelay: '0.5s' }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Wi-Fi 802.11n &middot; Low-latency RF
          </div>
        </div>

        {/* 6. Battery Cell with Animated Fill */}
        <div className="data-card-interactive" style={{ background: 'var(--surface-alt)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Battery Cell</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', animation: 'pulseBeacon 2.5s infinite' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              {animatedBattery}%
            </div>

            <div style={{
              width: '28px',
              height: '14px',
              border: '1.5px solid var(--accent-emerald)',
              borderRadius: '3px',
              padding: '1.5px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div
                className="animate-width-spring"
                style={{
                  width: `${roverData.battery_percentage ?? 95}%`,
                  height: '100%',
                  background: 'var(--accent-emerald)',
                  borderRadius: '1px',
                  transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '-4px',
                top: '3px',
                width: '2px',
                height: '6px',
                background: 'var(--accent-emerald)',
                borderRadius: '0 1px 1px 0'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '6px' }}>
            4S Li-Ion &middot; ~4.2 hrs remaining
          </div>
        </div>
      </div>

      {/* Control Triggers & Teleop Toggle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {!isInspecting ? (
            <Button
              variant="primary"
              loading={loading}
              onClick={handleStartInspection}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconPlay size={13} />
              <span>Start Inspection</span>
            </Button>
          ) : (
            <Button
              variant="danger"
              loading={loading}
              onClick={handleStopInspection}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconSquare size={13} />
              <span>End Inspection Session</span>
            </Button>
          )}

          <Button
            variant="secondary"
            loading={loading}
            onClick={() => setIsSimModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconCpu size={14} />
            <span>Simulate Rover Scan</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconUpload size={14} />
            <span>Upload Frame Artifact</span>
          </Button>
        </div>

        {/* Teleop Pad Accordion Switch */}
        <button
          type="button"
          onClick={() => setShowTeleop(!showTeleop)}
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '6px',
            background: showTeleop ? 'var(--pastel-blue-bg)' : 'var(--surface-alt)',
            color: showTeleop ? 'var(--pastel-blue-text)' : 'var(--text-secondary)',
            border: `1px solid ${showTeleop ? 'var(--pastel-blue-border)' : 'var(--border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <IconRover size={14} />
          <span>{showTeleop ? 'Hide Flight Pad' : 'Show Rover Flight Pad'}</span>
        </button>
      </div>

      {/* Interactive Rover Teleoperation Flight Pad */}
      {showTeleop && (
        <RoverTeleopPad
          roverCode={roverData.rover_code || 'ROVER-01'}
          roverStatus={roverData.rover_status || 'CONNECTED'}
          batteryPercentage={roverData.battery_percentage}
          wifiSignal={roverData.wifi_signal_dbm}
        />
      )}

      {/* Simulation Modal */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title="Simulate Autonomous Wall Scan"
      >
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: '1.6' }}>
          Synthesizes a realistic high-definition concrete surface image, transmits the simulated frame across the ESP32 Wi-Fi buffer, triggers the OpenCV black-hat crack measurement pipeline, computes Structural Health Index (SHI), and updates the RUL degradation model.
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
                    transition: 'all 0.15s ease'
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
                background: 'var(--surface)'
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
    </Card>
  );
};
