import React, { useState } from 'react';
import { Card, Badge, Button, Checkbox, EmptyState, useToast } from '../ui';
import { IconAlert, IconAlertOctagon, IconCheckCircle, IconCheck } from './UI/Icons';
import { api } from '../services/api';

export const AlertsView = ({ alerts = [], onAlertAcknowledged }) => {
  const [filterUnack, setFilterUnack] = useState(false);
  const [loadingId, setLoadingId] = useState(null);
  const toast = useToast();

  const handleAck = async (alertId) => {
    try {
      setLoadingId(alertId);
      await api.alerts.acknowledge(alertId);
      toast.success('Alert acknowledged', { title: 'Safety register updated' });
      if (onAlertAcknowledged) onAlertAcknowledged();
    } catch (e) {
      toast.error(e.message || 'Unable to acknowledge the alert.', { title: 'Acknowledgement failed' });
    } finally {
      setLoadingId(null);
    }
  };

  const displayedAlerts = filterUnack ? alerts.filter((a) => !a.is_acknowledged) : alerts;
  const unacknowledged = alerts.filter((a) => !a.is_acknowledged).length;

  return (
    <Card
      className="alerts-panel"
      title={
        <span className="dash-card-title">
          <IconAlert size={18} />
          <span>Engineering Safety &amp; Structural Threshold Alerts</span>
        </span>
      }
      subtitle="Autonomous threshold monitoring, fracture aperture triggers, and RUL failure limits"
      tag={
        <Badge variant={unacknowledged > 0 ? 'danger' : 'success'} dot>
          {unacknowledged > 0 ? `${unacknowledged} open` : 'All clear'}
        </Badge>
      }
    >
      <div className="alerts-panel__toolbar">
        <p className="ui-text-sm ui-muted">
          Real-time safety rules evaluate fracture metrics, Structural Health Index drops, and RUL limits.
        </p>
        <Checkbox
          label="Show unacknowledged only"
          checked={filterUnack}
          onChange={(event) => setFilterUnack(event.target.checked)}
        />
      </div>

      {displayedAlerts.length === 0 ? (
        <EmptyState
          icon={<IconCheckCircle size={24} />}
          title="All structural thresholds nominal"
          description="No unresolved alerts or safety interventions are currently pending."
          action={
            filterUnack ? (
              <Button size="sm" variant="secondary" onClick={() => setFilterUnack(false)}>
                Show all alerts
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="alerts-panel__list">
          {displayedAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className={`alerts-panel__item ${isCritical ? 'is-critical' : 'is-warning'} ${alert.is_acknowledged ? 'is-acknowledged' : ''}`}
              >
                <div className="alerts-panel__content">
                  <div className="alerts-panel__meta">
                    <Badge variant={isCritical ? 'danger' : 'warning'} size="sm">
                      {isCritical ? <IconAlertOctagon size={11} /> : <IconAlert size={11} />}
                      {alert.severity}
                    </Badge>
                    <span className="alerts-panel__type">{alert.type}</span>
                    {alert.is_acknowledged && (
                      <Badge variant="success" size="sm">
                        <IconCheck size={10} />
                        Acknowledged
                      </Badge>
                    )}
                  </div>
                  <div className="alerts-panel__title">{alert.title}</div>
                  <p className="alerts-panel__message">{alert.message}</p>
                </div>

                {!alert.is_acknowledged && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={loadingId === alert.id}
                    icon={<IconCheck size={12} />}
                    onClick={() => handleAck(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
