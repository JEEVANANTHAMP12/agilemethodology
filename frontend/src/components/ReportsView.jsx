import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from './UI/Components';
import { IconFileText, IconRefresh, IconPrinter } from './UI/Icons';
import { api } from '../services/api';

export const ReportsView = ({ inspectionId }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    if (!inspectionId) return;
    try {
      setLoading(true);
      const data = await api.reports.getJson(inspectionId);
      setReportData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inspectionId) {
      fetchReport();
    }
  }, [inspectionId]);

  const handleOpenPrintable = () => {
    if (!inspectionId) return;
    const url = api.reports.getHtmlUrl(inspectionId);
    window.open(url, '_blank');
  };

  if (!inspectionId) {
    return (
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <IconFileText size={16} color="#111111" />
            <span>Structural Inspection Dossier</span>
          </div>
        }
      >
        <div style={{ textAlign: 'center', padding: '32px', color: '#787774' }}>
          Select an active or completed inspection session to inspect certified reports.
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <IconFileText size={16} color="#111111" />
          <span>Certified Inspection Dossier</span>
        </div>
      }
      subtitle="Complete structural asset photogrammetric & degradation record"
      style={{ marginBottom: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '13px', color: '#787774' }}>
          Includes defect metrology, SHI calculation factors, and predictive life forecast
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchReport}
            loading={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconRefresh size={13} />
            <span>Sync Data</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenPrintable}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
          >
            <IconPrinter size={13} />
            <span>Print / Export PDF Dossier</span>
          </Button>
        </div>
      </div>

      {reportData && (
        <div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', borderRadius: '8px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EAEAEA', paddingBottom: '12px', marginBottom: '14px' }}>
            <div>
              <span style={{ fontSize: '11px', color: '#787774', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Report ID:</span>{' '}
              <strong style={{ fontSize: '14px', color: '#111111' }}>{reportData.metadata.report_id}</strong>
            </div>
            <Badge variant="info" size="sm">
              Generated: {new Date(reportData.metadata.generated_at).toLocaleDateString()}
            </Badge>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            fontSize: '13px'
          }}>
            <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: '#787774', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Target Asset</div>
              <div style={{ fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                {reportData.asset.wall_code} ({reportData.asset.wall_name})
              </div>
              <div style={{ fontSize: '12px', color: '#787774', marginTop: '2px' }}>
                {reportData.asset.building_name}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: '#787774', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Crack Summary</div>
              <div style={{ fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                {reportData.crack_detection.total_cracks_detected} Fissures Detected
              </div>
              <div style={{ fontSize: '12px', color: '#787774', marginTop: '2px' }}>
                Max Aperture: {reportData.crack_detection.max_crack_width_mm} mm
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: '#787774', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Health Index</div>
              <div style={{ fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                SHI: {reportData.health_assessment.shi_score} / 100
              </div>
              <div style={{ fontSize: '12px', color: '#787774', marginTop: '2px' }}>
                Status: {reportData.health_assessment.status}
              </div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #EAEAEA', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: '#787774', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Lifespan Prognosis</div>
              <div style={{ fontWeight: 600, color: '#111111', marginTop: '2px' }}>
                {reportData.rul_prediction.estimated_rul_years} Years Projected
              </div>
              <div style={{ fontSize: '12px', color: '#787774', marginTop: '2px' }}>
                Trend: {reportData.rul_prediction.deterioration_trend}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
