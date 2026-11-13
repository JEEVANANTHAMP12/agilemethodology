import React, { useState } from 'react';
import { Activity, Clock, AlertTriangle, FileText, Printer, Sliders, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { ShiTrendAreaChart, DegradationRadarChart, RulPrognosticComposedChart } from './charts/EngineeringCharts';
import { WhatIfScenarioSimulator } from './WhatIfScenarioSimulator';
import { AlertsView } from './AlertsView';
import { ReportsView } from './ReportsView';
import { api } from '../services/api';
import { cn } from '../lib/utils';

export const HealthAndReportsView = ({
  healthData = {},
  predictionData = {},
  alerts = [],
  inspectionId = null,
  onActionComplete = () => {},
}) => {
  const [subSection, setSubSection] = useState('overview');
  const [showSimulator, setShowSimulator] = useState(false);
  const [chartMode, setChartMode] = useState('forecast');

  const {
    shi_score = 82.0,
    health_status = 'HEALTHY',
    crack_penalty = 10.5,
    age_penalty = 4.2,
    env_penalty = 3.3,
    historical_trend = [],
  } = healthData;

  const {
    estimated_rul_years = 18.5,
    risk_level = 'Low',
    deterioration_trend = 'Stable',
  } = predictionData;

  const unackAlerts = alerts.filter((a) => !a.is_acknowledged).length;

  const statusVariant = health_status === 'CRITICAL' ? 'destructive' : health_status !== 'HEALTHY' ? 'warning' : 'success';
  const riskVariant = risk_level === 'Critical' ? 'destructive' : risk_level === 'High' || risk_level === 'Moderate' ? 'warning' : 'success';

  const handleOpenReport = () => {
    if (!inspectionId) return;
    window.open(api.reports.getHtmlUrl(inspectionId), '_blank');
  };

  return (
    <Tabs value={subSection} onValueChange={setSubSection} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          <TabsTrigger value="overview">
            <Activity className="h-3.5 w-3.5" />
            <span>Integrity &amp; Prognosis</span>
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Safety Alerts</span>
            {unackAlerts > 0 && (
              <span className="ml-1 rounded-full bg-destructive px-1.5 text-[10px] text-destructive-foreground">
                {unackAlerts}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-3.5 w-3.5" />
            <span>Dossiers</span>
          </TabsTrigger>
        </TabsList>

        {inspectionId && (
          <Button variant="outline" size="sm" onClick={handleOpenReport}>
            <Printer className="h-3.5 w-3.5" />
            <span>Print Dossier</span>
          </Button>
        )}
      </div>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Structural Health Index (SHI) Decomposition</span>
              </CardTitle>
              <CardDescription>
                Weighted penalty scoring across crack geometry, structural age, and environmental load.
              </CardDescription>
            </div>
            <Badge variant={statusVariant}>{health_status}</Badge>
          </CardHeader>

          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col justify-center rounded-md border bg-muted/40 p-4">
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Baseline Score</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-3xl font-semibold tabular-nums">{Number(shi_score).toFixed(1)}</span>
                <span className="text-xs text-muted-foreground">/ 100 SHI</span>
              </div>
            </div>

            <div className="space-y-2.5 rounded-md border p-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> Crack Aperture Impact
                </span>
                <span className="font-mono font-medium tabular-nums">-{Number(crack_penalty).toFixed(1)} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Age &amp; Fatigue
                </span>
                <span className="font-mono font-medium tabular-nums">-{Number(age_penalty).toFixed(1)} pts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-sky-500" /> Environmental Stress
                </span>
                <span className="font-mono font-medium tabular-nums">-{Number(env_penalty).toFixed(1)} pts</span>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-md border bg-muted/40 p-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span>Remaining Useful Life</span>
              </div>
              <div className="my-1 text-2xl font-semibold tabular-nums">
                {Number(estimated_rul_years).toFixed(1)}{' '}
                <span className="text-xs font-normal text-muted-foreground">Years</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant={riskVariant}>{risk_level} Risk</Badge>
                <span className="text-muted-foreground">{deterioration_trend}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                <span>Lifecycle Degradation &amp; Prognosis</span>
              </CardTitle>
              <CardDescription>
                5-year trajectory with 95% confidence bounds and failure intervention threshold.
              </CardDescription>
            </div>
            <div className="inline-flex rounded-md border bg-muted p-0.5">
              {[
                { id: 'forecast', label: 'Forecast' },
                { id: 'history', label: 'History' },
                { id: 'radar', label: 'Penalty Radar' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setChartMode(m.id)}
                  className={cn(
                    'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    chartMode === m.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {chartMode === 'forecast' && (
              <RulPrognosticComposedChart
                currentShi={shi_score}
                estimatedRulYears={estimated_rul_years}
                riskLevel={risk_level}
                height={270}
              />
            )}
            {chartMode === 'history' && (
              <ShiTrendAreaChart data={historical_trend} currentShi={shi_score} height={270} />
            )}
            {chartMode === 'radar' && (
              <DegradationRadarChart
                crackPenalty={crack_penalty}
                agePenalty={age_penalty}
                envPenalty={env_penalty}
                height={270}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => setShowSimulator(!showSimulator)}
          >
            <span className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              <span>What-If Remediation Simulator</span>
            </span>
            {showSimulator ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          {showSimulator && (
            <WhatIfScenarioSimulator currentShi={shi_score} baseRul={estimated_rul_years} />
          )}
        </div>
      </TabsContent>

      <TabsContent value="alerts">
        <AlertsView alerts={alerts} onAlertAcknowledged={onActionComplete} />
      </TabsContent>

      <TabsContent value="reports">
        <ReportsView inspectionId={inspectionId} />
      </TabsContent>
    </Tabs>
  );
};
