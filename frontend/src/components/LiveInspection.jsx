import React, { useState } from 'react';
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
  IconBattery
} from './UI/Icons';
import { DesignTokens } from '../tokens';
import { api } from '../services/api';
import { useAnimatedNumber } from './UI/useAnimatedNumber';

export const LiveInspection = ({ inspectionData = {}, roverData = {}, onActionComplete }) => {
  const [loading, setLoading] = useState(false);
  const [isSimModalOpen, setIsSimModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState('MODERATE');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDistance, setUploadDistance] = useState(250);

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
      await api.inspection.start(1, roverData.rover_code || 'ROVER-01');
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
      await api.rover.simulateScan(selectedSeverity);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconRover size={16} color="#111111" />
          <span>Live Autonomous Inspection</span>
        </div>
      }
      subtitle={`Target: ${inspectionData.wall_name || 'WALL-NORTH-01'}`}
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
      {/* Session Header & Animated Rangefinder */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        padding: '10px 14px',
        background: '#FBFBFA',
        borderRadius: '8px',
        border: '1px solid #EAEAEA',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ fontSize: '13px', color: '#787774', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Session Code:</span>
          <span style={{ fontFamily: DesignTokens.typography.mono, color: '#111111', fontWeight: 600 }}>
            {inspectionData.inspection_code || 'INSP-IDLE'}
          </span>
          {isInspecting && (
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#346538', animation: 'pulseBeacon 1.5s infinite' }} />
          )}
        </div>

        {/* Animated Ultrasonic Rangefinder Visual */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', color: '#787774' }}>
          <span>Optical Standoff:</span>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: '#FFFFFF',
            padding: '3px 10px',
            borderRadius: '12px',
            border: '1px solid #EAEAEA'
          }}>
            <svg width="22" height="14" viewBox="0 0 22 14">
              <circle cx="3" cy="7" r="2.5" fill="#111111" />
              <path
                d="M 8 3 A 5 5 0 0 1 8 11"
                fill="none"
                stroke="#1F6C9F"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ animation: 'radarWave 1.8s infinite' }}
              />
              <path
                d="M 13 1 A 9 9 0 0 1 13 13"
                fill="none"
                stroke="#1F6C9F"
                strokeWidth="1.5"
                strokeLinecap="round"
                style={{ animation: 'radarWave 1.8s 0.4s infinite' }}
              />
              <line x1="19" y1="1" x2="19" y2="13" stroke="#787774" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#111111', fontWeight: 600, fontFamily: DesignTokens.typography.mono }}>250 mm</span>
          </div>
          <span style={{ color: '#EAEAEA' }}>|</span>
          <span>Calibration: <strong style={{ color: '#111111' }}>2.5 px/mm</strong></span>
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
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconThermometer size={14} color="#956400" />
              <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ambient Temp</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#956400' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111111', marginTop: '6px' }}>
            {animatedTemp} &deg;C
          </div>

          {/* Mini Temperature Sparkline */}
          <div style={{ width: '100%', height: '24px', marginTop: '8px' }}>
            <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 14 Q 25 8, 50 12 T 100 10"
                fill="none"
                stroke="#956400"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="animate-chart-path"
              />
            </svg>
          </div>
        </div>

        {/* 2. Relative Humidity */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconDroplet size={14} color="#1F6C9F" />
              <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Relative Humidity</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1F6C9F' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111111', marginTop: '6px' }}>
            {animatedHumidity} %
          </div>

          {/* Mini Humidity Sparkline */}
          <div style={{ width: '100%', height: '24px', marginTop: '8px' }}>
            <svg width="100%" height="24" viewBox="0 0 100 24" preserveAspectRatio="none">
              <path
                d="M 0 12 Q 25 18, 50 10 T 100 14"
                fill="none"
                stroke="#1F6C9F"
                strokeWidth="1.8"
                strokeLinecap="round"
                className="animate-chart-path"
              />
            </svg>
          </div>
        </div>

        {/* 3. Crawler Inclinometer / Artificial Horizon Level */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconCompass size={14} color="#346538" />
              <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Crawler Tilt</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#346538' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111111' }}>
              {animatedTilt}&deg;
            </div>

            {/* Inclinometer Gauge Bubble */}
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              border: '1.5px solid #111111',
              background: '#FFFFFF',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {/* Crosshair guidelines */}
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: '#EAEAEA' }} />
              <div style={{ position: 'absolute', height: '100%', width: '1px', background: '#EAEAEA' }} />
              <div style={{ position: 'absolute', width: '12px', height: '12px', borderRadius: '50%', border: '1px dashed #CCCCCC' }} />
              {/* Damped level bubble */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#346538',
                transform: `translate(${bubbleOffset}px, ${-bubbleOffset * 0.4}px)`,
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 4px rgba(52, 101, 56, 0.5)'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#787774', marginTop: '6px' }}>
            Roll / Pitch inclinometer
          </div>
        </div>

        {/* 4. Vibration RMS Live Oscilloscope */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <IconActivity size={14} color="#111111" />
              <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Vibration RMS</span>
            </span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#111111' }} />
          </div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#111111', marginTop: '6px' }}>
            {animatedVibration} g
          </div>

          {/* Animated Oscilloscope Sine Ripple */}
          <div style={{ width: '100%', height: '24px', marginTop: '8px', overflow: 'hidden' }}>
            <svg width="200" height="24" viewBox="0 0 200 24" style={{ animation: isInspecting ? 'waveOscillate 2.4s linear infinite' : 'none' }}>
              <path
                d="M 0 12 Q 12 4, 25 12 T 50 12 T 75 12 T 100 12 T 125 12 T 150 12 T 175 12 T 200 12"
                fill="none"
                stroke="#111111"
                strokeWidth="1.6"
              />
            </svg>
          </div>
        </div>

        {/* 5. Carrier Signal RF Visualizer */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Carrier Signal</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#346538', animation: 'pulseBeacon 2s infinite' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#111111' }}>
              {roverData.wifi_signal_dbm ?? -58} <span style={{ fontSize: '12px', fontWeight: 400, color: '#787774' }}>dBm</span>
            </div>

            {/* 4-Bar Signal Meter */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '16px' }}>
              <div style={{ width: '4px', height: '6px', background: '#346538', borderRadius: '1px' }} />
              <div style={{ width: '4px', height: '10px', background: '#346538', borderRadius: '1px' }} />
              <div style={{ width: '4px', height: '13px', background: '#346538', borderRadius: '1px' }} />
              <div style={{ width: '4px', height: '16px', background: (roverData.wifi_signal_dbm ?? -58) > -65 ? '#346538' : '#D7E5D6', borderRadius: '1px' }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#787774', marginTop: '6px' }}>
            Wi-Fi 802.11n &middot; Nominal link
          </div>
        </div>

        {/* 6. Battery Cell with Animated Fill */}
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: '#787774', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Battery Cell</span>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#346538' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#346538' }}>
              {animatedBattery}%
            </div>

            {/* Battery Icon with Fluid Level Fill */}
            <div style={{
              width: '28px',
              height: '14px',
              border: '1.5px solid #346538',
              borderRadius: '3px',
              padding: '1.5px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div
                style={{
                  width: `${roverData.battery_percentage ?? 95}%`,
                  height: '100%',
                  background: '#346538',
                  borderRadius: '1px',
                  transition: 'width 1s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              />
              <div style={{
                position: 'absolute',
                right: '-4px',
                top: '3px',
                width: '2px',
                height: '6px',
                background: '#346538',
                borderRadius: '0 1px 1px 0'
              }} />
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#787774', marginTop: '6px' }}>
            4S Li-Ion &middot; ~4.2 hrs remaining
          </div>
        </div>
      </div>

      {/* Control Triggers */}
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

      {/* Simulation Modal */}
      <Modal
        isOpen={isSimModalOpen}
        onClose={() => setIsSimModalOpen(false)}
        title="Simulate Autonomous Wall Scan"
      >
        <p style={{ fontSize: '13px', color: '#787774', marginBottom: '18px', lineHeight: '1.6' }}>
          Synthesizes a realistic high-definition concrete surface image, transmits the simulated frame across the ESP32 Wi-Fi buffer, triggers the OpenCV black-hat crack measurement pipeline, computes Structural Health Index (SHI), and updates the RUL degradation model.
        </p>

        <div style={{ marginBottom: '22px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#111111', display: 'block', marginBottom: '8px' }}>
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
                    background: active ? '#111111' : '#FBFBFA',
                    color: active ? '#FFFFFF' : '#787774',
                    border: `1px solid ${active ? '#111111' : '#EAEAEA'}`,
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
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#111111', display: 'block', marginBottom: '6px' }}>
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
                border: '1px solid #EAEAEA',
                borderRadius: '6px',
                background: '#FBFBFA'
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
