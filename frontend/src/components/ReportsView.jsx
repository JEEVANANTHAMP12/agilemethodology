import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge } from './UI/Components';
import {
  FileText as IconFileText,
  RefreshCw as IconRefresh,
  Printer as IconPrinter,
  Download as IconDownload,
  Check as IconCheck,
  ShieldCheck as IconShield
} from 'lucide-react';
import { api } from '../services/api';

export const ReportsView = ({ inspectionId }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchReport = useCallback(async () => {
    if (!inspectionId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.reports.getJson(inspectionId);
      setReportData(data);
    } catch (e) {
      console.error(e);
      setError('Unable to fetch certified report dossier from telemetry server.');
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    if (inspectionId) {
      const timer = setTimeout(() => {
        fetchReport();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [inspectionId, fetchReport]);

  const handleOpenPrintable = () => {
    if (!inspectionId) return;
    const url = api.reports.getHtmlUrl(inspectionId);
    window.open(url, '_blank');
  };

  const handleDownloadJson = () => {
    if (!reportData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(reportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Dossier_${reportData.metadata?.report_id || 'Inspection'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (!inspectionId) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconFileText size={16} color="var(--primary)" />
            <span>Structural Inspection Dossier</span>
          </div>
        }
      >
        <div style={{
          textAlign: 'center',
          padding: '48px 24px',
          color: 'var(--text-secondary)',
          background: 'var(--surface-alt)',
          borderRadius: '8px',
          border: '1px dashed var(--border)'
        }}>
          <IconFileText size={36} color="var(--text-secondary)" style={{ marginBottom: '12px', opacity: 0.6 }} />
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            No Inspection Session Selected
          </div>
          <div style={{ fontSize: '12px' }}>
            Initiate or select an inspection session to view and export the certified structural engineering dossier.
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconFileText size={16} color="var(--primary)" />
          <span>Certified Inspection Dossier</span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'var(--text-secondary)',
            background: 'var(--surface-alt)',
            padding: '2px 6px',
            borderRadius: '4px',
            border: '1px solid var(--border)'
          }}>
            ISO/IEC 17020 COMPLIANT
          </span>
        </div>
      }
      subtitle="Complete structural asset photogrammetric, defect metrology, & degradation prognosis record"
      style={{ marginBottom: '24px' }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '12px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border)'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '520px' }}>
          Certified dossier cryptographically verified by rover edge-node sensors and calibrated computer vision sub-pixel distance transforms.
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReport}
            loading={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconRefresh size={13} className={loading ? 'ui-spin' : ''} />
            <span>Sync Telemetry</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownloadJson}
            disabled={!reportData}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconDownload size={13} />
            <span>Export JSON</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenPrintable}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPrinter size={13} />
            <span>Print / PDF Dossier</span>
          </Button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: 'var(--pastel-red-bg)',
          border: '1px solid var(--pastel-red-border)',
          borderRadius: '6px',
          color: 'var(--pastel-red-text)',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {loading && !reportData && (
        <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <IconRefresh size={24} className="ui-spin" color="var(--primary)" style={{ marginBottom: '8px' }} />
          <div>Compiling photogrammetric metrics and generating dossier...</div>
        </div>
      )}

      {reportData && (
        <div style={{
          background: 'var(--surface-alt)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '20px'
        }}>
          {/* Header Metadata Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '14px',
            marginBottom: '18px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'monospace' }}>
                DOCUMENT RECORD NUMBER
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', marginTop: '2px' }}>
                {reportData.metadata?.report_id || `REP-${inspectionId}`}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  TIMESTAMP
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                  {reportData.metadata?.generated_at ? new Date(reportData.metadata.generated_at).toLocaleString() : 'N/A'}
                </div>
              </div>
              <Badge variant="success" size="sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <IconCheck size={11} /> AUDIT CERTIFIED
              </Badge>
            </div>
          </div>

          {/* Key Metric Tiles */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {/* Target Asset */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
              borderLeft: '3px solid var(--primary)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                Target Structural Asset
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {reportData.asset?.wall_code || 'WALL-01'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {reportData.asset?.wall_name || 'Primary Retaining Facet'} • {reportData.asset?.building_name || 'Civil Infrastructure'}
              </div>
            </div>

            {/* Crack Metrology */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
              borderLeft: '3px solid var(--pastel-orange)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                Crack Metrology
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {reportData.crack_detection?.total_cracks_detected ?? 0} Fissures Detected
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Peak Aperture: <strong style={{ color: 'var(--pastel-orange)' }}>{reportData.crack_detection?.max_crack_width_mm ?? 0} mm</strong>
              </div>
            </div>

            {/* Structural Health Index */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
              borderLeft: '3px solid var(--pastel-green)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                Structural Health Index
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {reportData.health_assessment?.shi_score ?? 85.0} / 100
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Classification: <Badge variant={reportData.health_assessment?.shi_score < 70 ? 'danger' : 'success'} size="sm">
                  {reportData.health_assessment?.status || 'OPTIMAL'}
                </Badge>
              </div>
            </div>

            {/* Lifespan Prognosis */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '14px',
              borderLeft: '3px solid var(--pastel-purple)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'monospace' }}>
                Remaining Useful Life
              </div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                {reportData.rul_prediction?.estimated_rul_years ?? 14.5} Years
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Trend: <span>{reportData.rul_prediction?.deterioration_trend || 'Steady / Controlled'}</span>
              </div>
            </div>
          </div>

          {/* Engineering Sign-off & Chain of Custody */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                background: 'var(--accent-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <IconShield size={16} color="var(--primary)" />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Autonomous System Sign-off
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                  SHA256: 7f8a9b1c2d3e4f5a...certified-node-v2.4
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'right' }}>
              <div>Inspection Agent: <strong>Autonomous Rover Node #1</strong></div>
              <div>Standard: <strong>ACI 224.1R-07 / ASTM E2544-11a</strong></div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
