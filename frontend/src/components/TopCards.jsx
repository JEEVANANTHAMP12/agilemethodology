import React from 'react';
import { Activity, Bot, Clock, Crosshair } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';

const statusVariant = (status) => {
  if (status === 'CRITICAL') return 'destructive';
  if (status === 'HEALTHY') return 'success';
  return 'warning';
};

const riskVariant = (risk) => {
  if (risk === 'Critical') return 'destructive';
  if (risk === 'High' || risk === 'Moderate') return 'warning';
  return 'success';
};

export const TopCards = ({ data = {}, crackData = {} }) => {
  const {
    rover_status = 'CONNECTED',
    rover_code = 'ROVER-01',
    battery_percentage = 95.0,
    wifi_signal_dbm = -58,
    health_index = 82.0,
    wall_status = 'HEALTHY',
    estimated_rul_years = 18.5,
    risk_level = 'Low',
  } = data;

  const crackWidth = crackData?.primary_width_mm ?? data?.primary_width_mm ?? 0.0;
  const crackSeverity = crackData?.primary_severity || (wall_status === 'HEALTHY' ? 'NONE' : 'MODERATE');

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key Metrics">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Structural Health</span>
            <Activity className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{Number(health_index).toFixed(1)}</span>
              <span className="ml-1 text-xs text-muted-foreground">/ 100 SHI</span>
            </div>
            <Badge variant={statusVariant(wall_status)}>
              {wall_status === 'HEALTHY' ? 'Grade A' : wall_status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Max Aperture</span>
            <Crosshair className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{Number(crackWidth).toFixed(2)}</span>
              <span className="ml-1 text-xs text-muted-foreground">mm</span>
            </div>
            <Badge
              variant={
                crackSeverity === 'CRITICAL'
                  ? 'destructive'
                  : crackSeverity === 'HIGH' || crackSeverity === 'MODERATE'
                  ? 'warning'
                  : 'success'
              }
            >
              {crackSeverity}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Prognosis RUL</span>
            <Clock className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{Number(estimated_rul_years).toFixed(1)}</span>
              <span className="ml-1 text-xs text-muted-foreground">years</span>
            </div>
            <Badge variant={riskVariant(risk_level)}>{risk_level} Risk</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{rover_code} Link</span>
            <Bot className="h-3.5 w-3.5" />
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <div>
              <span className="text-2xl font-semibold tabular-nums">{Math.round(Number(battery_percentage))}%</span>
              <span className="ml-1 text-xs text-muted-foreground">power</span>
            </div>
            <Badge variant={rover_status === 'CONNECTED' ? 'success' : 'destructive'}>
              {wifi_signal_dbm} dBm
            </Badge>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
