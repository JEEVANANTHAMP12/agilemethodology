import React, { useState } from 'react';
import { Card, Badge, Button } from './UI/Components';
import { IconAlert, IconAlertOctagon, IconCheckCircle, IconCheck } from './UI/Icons';
import { DesignTokens } from '../tokens';
import { api } from '../services/api';

export const AlertsView = ({ alerts = [], onAlertAcknowledged }) => {
  const [filterUnack, setFilterUnack] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  const handleAck = async (alertId) => {
    try {
      setLoadingId(alertId);
      await api.alerts.acknowledge(alertId);
      if (onAlertAcknowledged) onAlertAcknowledged();
    } catch (e) {
      alert('Alert acknowledgement error: ' + e.message);
    } finally {
      setLoadingId(null);
    }
  };

  const displayedAlerts = filterUnack ? alerts.filter(a => !a.is_acknowledged) : alerts;

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconAlert size={16} color="#111111" />
          <span>Engineering Safety Notifications</span>
        </div>
      }
      subtitle="Structural threshold monitoring & intervention triggers"
      style={{ marginBottom: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: '#787774' }}>
          Real-time safety rules evaluate fracture metrics, SHI drops, and RUL limits
        </div>

        <label style={{ fontSize: '12px', color: '#787774', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={filterUnack}
            onChange={(e) => setFilterUnack(e.target.checked)}
            style={{ accentColor: '#111111' }}
          />
          Show Unacknowledged Only
        </label>
      </div>

      {displayedAlerts.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#787774', background: '#FBFBFA', border: '1px dashed #EAEAEA', borderRadius: '8px' }}>
          <IconCheckCircle size={26} color="#346538" style={{ margin: '0 auto 8px', display: 'block' }} />
          <div style={{ color: '#346538', fontSize: '14px', fontWeight: 600 }}>
            All Safety Thresholds Nominal
          </div>
          <div style={{ marginTop: '4px', fontSize: '12px' }}>
            No unresolved alerts or safety interventions currently pending.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {displayedAlerts.map((a) => {
            const isCrit = a.severity === 'CRITICAL';
            const { pastelRed, pastelYellow } = DesignTokens.colors;
            const currentStyle = isCrit ? pastelRed : pastelYellow;

            return (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px',
                  background: currentStyle.bg,
                  border: `1px solid ${currentStyle.border}`,
                  borderRadius: '8px',
                  gap: '14px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Badge
                      variant={isCrit ? 'danger' : 'warning'}
                      size="sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      {isCrit ? <IconAlertOctagon size={11} /> : <IconAlert size={11} />}
                      <span>{a.severity}</span>
                    </Badge>
                    <span style={{ fontSize: '11px', color: '#787774', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {a.type}
                    </span>
                    {a.is_acknowledged && (
                      <Badge
                        variant="success"
                        size="sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <IconCheck size={10} />
                        <span>Acknowledged</span>
                      </Badge>
                    )}
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111' }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#555555', marginTop: '2px', lineHeight: '1.5' }}>
                    {a.message}
                  </div>
                </div>

                {!a.is_acknowledged && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={loadingId === a.id}
                    onClick={() => handleAck(a.id)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                  >
                    <IconCheck size={12} />
                    <span>Acknowledge</span>
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
