import React, { useState, useEffect, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Square } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';

const SPEED_MODES = [
  { id: 'SLOW', label: '0.2 m/s' },
  { id: 'NORMAL', label: '0.6 m/s' },
  { id: 'TURBO', label: '1.2 m/s' },
];

export const RoverTeleopPad = ({ roverStatus = 'CONNECTED', onCommand }) => {
  const [activeDirection, setActiveDirection] = useState(null);
  const [speedMode, setSpeedMode] = useState('NORMAL');
  const [headlightsOn, setHeadlightsOn] = useState(true);
  const [laserGuideOn, setLaserGuideOn] = useState(true);
  const [compassHeading, setCompassHeading] = useState(42);
  const [commandLog, setCommandLog] = useState([]);

  const sendRoverCommand = useCallback(
    (cmd, param = '') => {
      setActiveDirection(cmd);
      setCommandLog((prev) => [
        { id: Date.now(), text: `${cmd}${param ? ` (${param})` : ''}`, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 6),
      ]);

      if (cmd === 'LEFT') {
        setCompassHeading((prev) => (prev - 15 + 360) % 360);
      } else if (cmd === 'RIGHT') {
        setCompassHeading((prev) => (prev + 15) % 360);
      }

      if (onCommand) onCommand(cmd, param);
      window.setTimeout(() => setActiveDirection(null), cmd === 'STOP' ? 150 : 280);
    },
    [onCommand]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
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
    <Card>
      <CardContent className="grid grid-cols-1 gap-6 p-5 md:grid-cols-3">
        {/* Directional Controls */}
        <div className="flex flex-col items-center justify-between space-y-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Teleoperation
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">WASD / Arrows</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div />
            <Button
              variant={activeDirection === 'FORWARD' ? 'default' : 'outline'}
              size="icon"
              className="h-11 w-11"
              onClick={() => sendRoverCommand('FORWARD', speedMode)}
              aria-label="Drive Forward"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <div />

            <Button
              variant={activeDirection === 'LEFT' ? 'default' : 'outline'}
              size="icon"
              className="h-11 w-11"
              onClick={() => sendRoverCommand('LEFT', '15°')}
              aria-label="Pivot Left"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={activeDirection === 'STOP' ? 'destructive' : 'outline'}
              size="icon"
              className="h-11 w-11 border-red-500/40 text-red-500 hover:bg-red-500/10"
              onClick={() => sendRoverCommand('STOP', 'BRAKE')}
              aria-label="Emergency Stop"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={activeDirection === 'RIGHT' ? 'default' : 'outline'}
              size="icon"
              className="h-11 w-11"
              onClick={() => sendRoverCommand('RIGHT', '15°')}
              aria-label="Pivot Right"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div />
            <Button
              variant={activeDirection === 'REVERSE' ? 'default' : 'outline'}
              size="icon"
              className="h-11 w-11"
              onClick={() => sendRoverCommand('REVERSE', speedMode)}
              aria-label="Drive Reverse"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <div />
          </div>

          <div className="inline-flex rounded-md border bg-muted p-0.5">
            {SPEED_MODES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSpeedMode(s.id)}
                className={cn(
                  'rounded-sm px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer',
                  speedMode === s.id
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Azimuth & Optical Auxiliary */}
        <div className="flex flex-col items-center justify-between space-y-3">
          <div className="flex w-full items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Heading
            </span>
            <Badge variant="info" className="font-mono tabular-nums">
              {compassHeading.toString().padStart(3, '0')}°
            </Badge>
          </div>

          <svg width="110" height="110" viewBox="0 0 130 130" aria-label="Compass heading">
            <circle cx="65" cy="65" r="56" fill="none" stroke="var(--border)" strokeWidth="2" />
            <text x="65" y="24" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="700">N</text>
            <text x="110" y="69" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">E</text>
            <text x="65" y="114" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">S</text>
            <text x="20" y="69" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">W</text>
            <g
              style={{
                transform: `rotate(${compassHeading}deg)`,
                transformOrigin: '65px 65px',
                transition: 'transform 0.3s ease-out',
              }}
            >
              <polygon points="65,30 60,65 70,65" fill="#ef4444" />
              <polygon points="65,100 60,65 70,65" fill="var(--muted-foreground)" />
              <circle cx="65" cy="65" r="4" fill="var(--foreground)" />
            </g>
          </svg>

          <div className="flex gap-2">
            <Button
              variant={headlightsOn ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setHeadlightsOn(!headlightsOn)}
            >
              LED: {headlightsOn ? 'ON' : 'OFF'}
            </Button>
            <Button
              variant={laserGuideOn ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setLaserGuideOn(!laserGuideOn)}
            >
              Reticle: {laserGuideOn ? 'ON' : 'OFF'}
            </Button>
          </div>
        </div>

        {/* Command Log */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Command Bus
            </span>
            <Badge variant={isConnected ? 'success' : 'warning'} className="font-mono text-[10px]">
              {isConnected ? 'LINK OK' : roverStatus}
            </Badge>
          </div>

          <div className="flex-1 space-y-1.5 overflow-y-auto rounded-md border bg-muted/40 p-3 font-mono text-[11px] min-h-[140px]">
            {commandLog.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Awaiting directional input...
              </div>
            ) : (
              commandLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between gap-2">
                  <span className={cn(log.text.includes('STOP') && 'font-semibold text-red-500')}>
                    {log.text}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{log.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
