import React, { useState } from 'react';
import { Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Slider } from './ui/slider';
import { WhatIfComparisonChart } from './charts/EngineeringCharts';
import { cn } from '../lib/utils';

export const WhatIfScenarioSimulator = ({ currentShi = 76.0, baseRul = 14.5 }) => {
  const [stressFactor, setStressFactor] = useState(1.0);
  const [applyEpoxy, setApplyEpoxy] = useState(false);
  const [applySilaneSealer, setApplySilaneSealer] = useState(false);

  const bonusYears = (applyEpoxy ? 5.5 : 0) + (applySilaneSealer ? 3.0 : 0);
  const simulatedRul = Math.max(0.5, Math.round(((baseRul / stressFactor) + bonusYears) * 10) / 10);
  const rulDelta = (simulatedRul - baseRul).toFixed(1);

  const preventativeCost = (applyEpoxy ? 3200 : 0) + (applySilaneSealer ? 1600 : 800);
  const deferredCost = Math.round(35000 + (100 - currentShi) * 450);
  const potentialSavings = Math.max(0, deferredCost - preventativeCost);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-500" />
            <span>Prognostic Scenario Simulator</span>
          </CardTitle>
          <CardDescription>
            Model mechanical load changes and concrete remediation interventions.
          </CardDescription>
        </div>
        <Badge variant={Number(rulDelta) >= 0 ? 'success' : 'destructive'}>
          {Number(rulDelta) >= 0 ? `+${rulDelta} yrs extension` : `${rulDelta} yrs reduction`}
        </Badge>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Controls */}
        <div className="space-y-3">
          <div className="rounded-md border p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Stress Multiplier</span>
              <span className="font-mono font-semibold tabular-nums">
                {stressFactor.toFixed(1)}x ({stressFactor < 1 ? 'Reduced' : stressFactor === 1 ? 'Nominal' : 'Elevated'})
              </span>
            </div>
            <Slider
              min={0.7}
              max={1.8}
              step={0.1}
              value={[stressFactor]}
              onValueChange={([v]) => setStressFactor(v)}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0.7x Sheltered</span>
              <span>1.0x Baseline</span>
              <span>1.8x Cyclic</span>
            </div>
          </div>

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-xs transition-colors',
              applyEpoxy && 'border-primary bg-muted/40'
            )}
          >
            <Checkbox checked={applyEpoxy} onCheckedChange={(c) => setApplyEpoxy(Boolean(c))} className="mt-0.5" />
            <div>
              <div className="font-medium">Structural Epoxy Micro-Injection</div>
              <div className="text-muted-foreground">Restores shear continuity (+5.5 yrs RUL)</div>
            </div>
          </label>

          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-md border p-3 text-xs transition-colors',
              applySilaneSealer && 'border-primary bg-muted/40'
            )}
          >
            <Checkbox checked={applySilaneSealer} onCheckedChange={(c) => setApplySilaneSealer(Boolean(c))} className="mt-0.5" />
            <div>
              <div className="font-medium">Silane Hydrophobic Sealer</div>
              <div className="text-muted-foreground">Reduces moisture ingress (+3.0 yrs RUL)</div>
            </div>
          </label>
        </div>

        {/* Trajectory Chart */}
        <div className="rounded-md border p-3.5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-muted-foreground">Degradation Shift</span>
            <div className="flex gap-3 text-[11px]">
              <span className="text-amber-500">Baseline</span>
              <span className="text-emerald-500">Remediated</span>
            </div>
          </div>
          <WhatIfComparisonChart currentShi={currentShi} baseRul={baseRul} simulatedRul={simulatedRul} height={180} />
        </div>

        {/* Economics & Summary */}
        <div className="flex flex-col justify-between rounded-md border p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md bg-muted/50 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Baseline RUL</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{baseRul.toFixed(1)} yrs</div>
            </div>
            <div className="rounded-md bg-muted/50 p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Simulated RUL</div>
              <div
                className={cn(
                  'mt-1 font-mono text-lg font-semibold tabular-nums',
                  simulatedRul >= baseRul ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {simulatedRul.toFixed(1)} yrs
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t pt-3 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preventative Action</span>
              <span className="font-mono font-medium tabular-nums">${preventativeCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deferred Major Shoring</span>
              <span className="font-mono font-medium text-red-500 tabular-nums">${deferredCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-emerald-700 dark:text-emerald-400">
              <span className="font-medium">Projected Savings</span>
              <span className="font-mono font-semibold tabular-nums">${potentialSavings.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
