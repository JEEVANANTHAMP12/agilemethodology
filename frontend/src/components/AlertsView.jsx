import React, { useState } from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { api } from '../services/api';
import { cn } from '../lib/utils';

export const AlertsView = ({ alerts = [], onAlertAcknowledged }) => {
  const [filterUnack, setFilterUnack] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const handleAck = async (alertId) => {
    try {
      setLoadingId(alertId);
      await api.alerts.acknowledge(alertId);
      toast.success('Safety alert acknowledged');
      if (onAlertAcknowledged) onAlertAcknowledged();
    } catch (e) {
      toast.error(e.message || 'Unable to acknowledge alert');
    } finally {
      setLoadingId(null);
    }
  };

  const displayedAlerts = filterUnack ? alerts.filter((a) => !a.is_acknowledged) : alerts;
  const unacknowledged = alerts.filter((a) => !a.is_acknowledged).length;

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Safety &amp; Structural Threshold Alerts</span>
          </CardTitle>
          <CardDescription>
            Automated rules evaluating fracture apertures, SHI drops, and RUL limits.
          </CardDescription>
        </div>
        <Badge variant={unacknowledged > 0 ? 'destructive' : 'success'}>
          {unacknowledged > 0 ? `${unacknowledged} open` : 'All clear'}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
          <span className="text-xs text-muted-foreground">
            {alerts.length} recorded threshold events
          </span>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
            <Checkbox checked={filterUnack} onCheckedChange={(checked) => setFilterUnack(Boolean(checked))} />
            <span>Show unacknowledged only</span>
          </label>
        </div>

        {displayedAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-10 text-center">
            <CheckCircle2 className="mb-2 h-6 w-6 text-emerald-500" />
            <div className="text-sm font-medium">All structural thresholds nominal</div>
            <div className="mt-1 text-xs text-muted-foreground">
              No unresolved alerts are currently pending.
            </div>
            {filterUnack && (
              <Button size="sm" variant="secondary" className="mt-4" onClick={() => setFilterUnack(false)}>
                Show all alerts
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {displayedAlerts.map((alert) => {
              const isCritical = alert.severity === 'CRITICAL';
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'flex flex-col justify-between gap-3 rounded-md border p-3 sm:flex-row sm:items-center',
                    isCritical && !alert.is_acknowledged && 'border-red-500/40 bg-red-500/5',
                    !isCritical && !alert.is_acknowledged && 'border-amber-500/40 bg-amber-500/5',
                    alert.is_acknowledged && 'opacity-70'
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={isCritical ? 'destructive' : 'warning'}>
                        {isCritical ? <AlertOctagon className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                        {alert.severity}
                      </Badge>
                      <span className="font-mono text-[11px] text-muted-foreground">{alert.type}</span>
                      {alert.is_acknowledged && (
                        <Badge variant="success">
                          <Check className="h-3 w-3" /> Acknowledged
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs font-semibold">{alert.title}</div>
                    <p className="text-xs text-muted-foreground">{alert.message}</p>
                  </div>

                  {!alert.is_acknowledged && (
                    <Button
                      variant="outline"
                      size="sm"
                      loading={loadingId === alert.id}
                      onClick={() => handleAck(alert.id)}
                    >
                      <Check className="h-3.5 w-3.5" />
                      Acknowledge
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
