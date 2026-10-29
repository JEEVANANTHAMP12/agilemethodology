import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button } from './UI/Components';
import {
  IconRover,
  IconCompass,
  IconArrowUp,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconSquare,
  IconActivity,
  IconWifi
} from './UI/Icons';
import { DesignTokens } from '../tokens';

export const RoverTeleopPad = ({
  roverCode = 'ROVER-01',
  roverStatus = 'CONNECTED',
  batteryPercentage = 95,
  wifiSignal = -54,
  onCommand
}) => {
  const [activeDirection, setActiveDirection] = useState(null);
  const [speedMode, setSpeedMode] = useState('NORMAL'); // 'SLOW', 'NORMAL', 'TURBO'
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [laserGuideOn, setLaserGuideOn] = useState(true);
  const [compassHeading, setCompassHeading] = useState(42);
  const [commandLog, setCommandLog] = useState([
    { id: 1, text: 'Telemetry Link Verified · Ping 14ms', time: '18:20:00' },
    { id: 2, text: 'Heading Locked at 042° Azimuth', time: '18:20:04' }
  ]);

  const sendRoverCommand = useCallback((cmd, param = '') => {
    setActiveDirection(cmd);
    const timeStr = new Date().toLocaleTimeString();
    const newLog = {
      id: Date.now(),
      text: `CMD: ${cmd} ${param ? `[${param}]` : ''} · ACK OK`,
      time: timeStr
    };
    setCommandLog(prev => [newLog, ...prev.slice(0, 4)]);

    // Update simulated heading on turn
    if (cmd === 'LEFT') {
      setCompassHeading(prev => (prev - 15 + 360) % 360);
    } else if (cmd === 'RIGHT') {
      setCompassHeading(prev => (prev + 15) % 360);
    }

    if (onCommand) onCommand(cmd, param);

    // Release active direction visual after short duration
    if (cmd !== 'STOP') {
      setTimeout(() => setActiveDirection(null), 300);
    } else {
      setTimeout(() => setActiveDirection(null), 150);
    }
  }, [onCommand]);

  // Keyboard controls listener (WASD and Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept when user is typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          sendRoverCommand('FORWARD', speedMode);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          sendRoverCommand('REVERSE', speedMode);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          sendRoverCommand('LEFT', '15°');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          sendRoverCommand('RIGHT', '15°');
          break;
        case ' ':
          e.preventDefault();
          sendRoverCommand('STOP', 'BRAKE');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sendRoverCommand, speedMode]);

  const isConnected = roverStatus === 'CONNECTED';

  return (
    <div style={{
      background: 'var(--surface-alt)',
      border: '1px solid var(--border)',
      borderRadius: '10px',
      padding: '18px 20px',
      marginBottom: '20px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      alignItems: 'center'
    }}>
      {/* 1. D-Pad Directional Flight Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center',
          marginBottom: '12px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)'
          }}>
            Crawler Teleoperation
          </span>
          <span style={{
            fontSize: '10px',
            fontFamily: DesignTokens.typography.mono,
            color: 'var(--text-muted)'
          }}>
            KEYS: WASD / ARROWS
          </span>
        </div>

        {/* Tactile D-PAD Cluster */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 48px)',
          gridTemplateRows: 'repeat(3, 48px)',
          gap: '8px',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          {/* Top: Forward */}
          <div style={{ gridColumn: '2', gridRow: '1' }}>
            <button
              type="button"
              onClick={() => sendRoverCommand('FORWARD', speedMode)}
              title="Drive Forward (W / Up)"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: activeDirection === 'FORWARD' ? 'var(--accent-cyan)' : 'var(--surface)',
                color: activeDirection === 'FORWARD' ? 'var(--text-on-accent)' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.1s ease'
              }}
            >
              <IconArrowUp size={20} />
            </button>
          </div>

          {/* Left: Pivot Left */}
          <div style={{ gridColumn: '1', gridRow: '2' }}>
            <button
              type="button"
              onClick={() => sendRoverCommand('LEFT', '15°')}
              title="Pivot Left (A / Left)"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: activeDirection === 'LEFT' ? 'var(--accent-cyan)' : 'var(--surface)',
                color: activeDirection === 'LEFT' ? 'var(--text-on-accent)' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.1s ease'
              }}
            >
              <IconArrowLeft size={20} />
            </button>
          </div>

          {/* Center: Emergency Brake */}
          <div style={{ gridColumn: '2', gridRow: '2' }}>
            <button
              type="button"
              onClick={() => sendRoverCommand('STOP', 'BRAKE')}
              title="Emergency Stop (Spacebar)"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: activeDirection === 'STOP' ? 'var(--accent-red)' : 'var(--surface)',
                color: activeDirection === 'STOP' ? '#FFFFFF' : 'var(--accent-red)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.1s ease'
              }}
            >
              <IconSquare size={16} />
            </button>
          </div>

          {/* Right: Pivot Right */}
          <div style={{ gridColumn: '3', gridRow: '2' }}>
            <button
              type="button"
              onClick={() => sendRoverCommand('RIGHT', '15°')}
              title="Pivot Right (D / Right)"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: activeDirection === 'RIGHT' ? 'var(--accent-cyan)' : 'var(--surface)',
                color: activeDirection === 'RIGHT' ? 'var(--text-on-accent)' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.1s ease'
              }}
            >
              <IconArrowRight size={20} />
            </button>
          </div>

          {/* Bottom: Reverse */}
          <div style={{ gridColumn: '2', gridRow: '3' }}>
            <button
              type="button"
              onClick={() => sendRoverCommand('REVERSE', speedMode)}
              title="Drive Reverse (S / Down)"
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: activeDirection === 'REVERSE' ? 'var(--accent-cyan)' : 'var(--surface)',
                color: activeDirection === 'REVERSE' ? 'var(--text-on-accent)' : 'var(--text-primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-subtle)',
                transition: 'all 0.1s ease'
              }}
            >
              <IconArrowDown size={20} />
            </button>
          </div>
        </div>

        {/* Speed / Throttle Selector */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginTop: '14px',
          background: 'var(--surface)',
          padding: '3px',
          borderRadius: '6px',
          border: '1px solid var(--border)'
        }}>
          {[
            { id: 'SLOW', label: 'Precision (0.2 m/s)' },
            { id: 'NORMAL', label: 'Nominal (0.6 m/s)' },
            { id: 'TURBO', label: 'Traverse (1.2 m/s)' }
          ].map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSpeedMode(s.id)}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                fontWeight: 600,
                borderRadius: '4px',
                background: speedMode === s.id ? 'var(--text-primary)' : 'transparent',
                color: speedMode === s.id ? 'var(--canvas)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive Compass Azimuth & Horizon Heading */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)'
          }}>
            Azimuth & Heading
          </span>
          <Badge variant="info" size="sm">
            {compassHeading.toString().padStart(3, '0')}&deg; NNE
          </Badge>
        </div>

        {/* SVG Compass Rose with Rotating Needle */}
        <div style={{ position: 'relative', width: '130px', height: '130px', margin: '4px 0' }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            {/* Outer dial ring */}
            <circle cx="65" cy="65" r="58" fill="none" stroke="var(--border)" strokeWidth="2" />
            <circle cx="65" cy="65" r="54" fill="var(--surface)" stroke="none" />

            {/* Compass degree tick marks */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
              const rad = (deg - 90) * (Math.PI / 180);
              const x1 = 65 + 48 * Math.cos(rad);
              const y1 = 65 + 48 * Math.sin(rad);
              const x2 = 65 + 56 * Math.cos(rad);
              const y2 = 65 + 56 * Math.sin(rad);
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={deg === 0 ? 'var(--accent-red)' : 'var(--text-muted)'}
                  strokeWidth={deg % 90 === 0 ? '2' : '1'}
                />
              );
            })}

            {/* Cardinal Labels */}
            <text x="65" y="24" textAnchor="middle" fill="var(--accent-red)" fontSize="10" fontWeight="700" fontFamily={DesignTokens.typography.mono}>N</text>
            <text x="110" y="69" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600" fontFamily={DesignTokens.typography.mono}>E</text>
            <text x="65" y="114" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600" fontFamily={DesignTokens.typography.mono}>S</text>
            <text x="20" y="69" textAnchor="middle" fill="var(--text-secondary)" fontSize="9" fontWeight="600" fontFamily={DesignTokens.typography.mono}>W</text>

            {/* Rotating Needle */}
            <g style={{
              transform: `rotate(${compassHeading}deg)`,
              transformOrigin: '65px 65px',
              transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
              {/* North Pointer (Red) */}
              <polygon points="65,30 60,65 70,65" fill="var(--accent-red)" />
              {/* South Pointer (Slate) */}
              <polygon points="65,100 60,65 70,65" fill="var(--text-muted)" />
              {/* Center Pivot Pin */}
              <circle cx="65" cy="65" r="4.5" fill="var(--text-primary)" stroke="var(--surface)" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* Optical Auxiliary Toggles */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <button
            type="button"
            onClick={() => setHeadlightsOn(!headlightsOn)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              background: headlightsOn ? 'var(--pastel-yellow-bg)' : 'var(--surface)',
              color: headlightsOn ? 'var(--pastel-yellow-text)' : 'var(--text-muted)',
              border: `1px solid ${headlightsOn ? 'var(--pastel-yellow-border)' : 'var(--border)'}`,
              cursor: 'pointer'
            }}
          >
            Illumination: {headlightsOn ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={() => setLaserGuideOn(!laserGuideOn)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '6px',
              background: laserGuideOn ? 'var(--pastel-blue-bg)' : 'var(--surface)',
              color: laserGuideOn ? 'var(--pastel-blue-text)' : 'var(--text-muted)',
              border: `1px solid ${laserGuideOn ? 'var(--pastel-blue-border)' : 'var(--border)'}`,
              cursor: 'pointer'
            }}
          >
            Laser Reticle: {laserGuideOn ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* 3. Live Crawler Command Terminal / Bus Stream */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '160px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: 'var(--text-secondary)'
          }}>
            Actuator Bus Telemetry
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)', animation: 'pulseBeacon 2s infinite' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontFamily: DesignTokens.typography.mono }}>
              115200 BAUD
            </span>
          </div>
        </div>

        {/* Terminal readout box */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '10px 12px',
          fontFamily: DesignTokens.typography.mono,
          fontSize: '11px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          overflowY: 'auto',
          maxHeight: '130px'
        }}>
          {commandLog.map((log) => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span style={{ color: log.text.includes('STOP') ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                {log.text}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
