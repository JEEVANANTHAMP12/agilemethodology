import React, { useState } from 'react';
import { Card, Badge, FauxWindowHeader, Button, Modal, Input } from './UI/Components';
import { useToast, CrackApertureProfileChart, DefectSeverityBarChart } from '../ui';
import {
  Crosshair as IconCrosshair,
  Camera as IconCamera,
  Upload as IconUpload
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';
import { api } from '../services/api';
import { DigitalMicroscopeLoupe } from './DigitalMicroscopeLoupe';
import { DefectsExplorerTable } from './DefectsExplorerTable';

export const CrackAnalysis = ({ crackData = {}, onActionComplete }) => {
  const toast = useToast();
  const [activeView, setActiveView] = useState('side-by-side');
  const [showScanHUD, setShowScanHUD] = useState(true);

  // ML Photo Prediction Studio State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [standoffDistance, setStandoffDistance] = useState(250);
  const [isPredicting, setIsPredicting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const {
    has_image = false,
    original_url,
    processed_url,
    heatmap_url,
    total_defects = 0,
    primary_severity = 'NONE',
    primary_length_mm = 0.0,
    primary_width_mm = 0.0,
    confidence_percentage = 96.5,
    aci_224r_compliant = true,
    ml_model_version = '2.4.0-Ensemble-GB-RF',
    defects = []
  } = crackData;

  const animatedLength = useAnimatedNumber(primary_length_mm, 900, 1);
  const animatedWidth = useAnimatedNumber(primary_width_mm, 900, 2);
  const animatedConfidence = useAnimatedNumber(
    defects.length > 0 ? (defects[0].confidence > 1 ? defects[0].confidence : defects[0].confidence * 100) : confidence_percentage,
    900,
    0
  );

  const getSeverityBadgeVariant = (sev) => {
    if (sev === 'CRITICAL') return 'danger';
    if (sev === 'HIGH') return 'warning';
    if (sev === 'MODERATE') return 'warning';
    if (sev === 'LOW') return 'info';
    return 'success';
  };

  // Handle Photo Selection
  const handlePhotoSelect = (file) => {
    if (!file) return;
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  // Run Direct ML Prediction
  const handleRunMlPrediction = async (e) => {
    if (e) e.preventDefault();
    if (!selectedPhoto) {
      toast.warning('Please select or drop a wall photo before running prediction.', { title: 'No photo selected' });
      return;
    }

    try {
      setIsPredicting(true);
      const fd = new FormData();
      fd.append('file', selectedPhoto);
      fd.append('distance_to_wall_mm', standoffDistance);

      const res = await api.images.predictCrack(fd);
      setIsUploadModalOpen(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);

      if (res && (!res.crack_detected || res.total_cracks === 0)) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }

      // Trigger immediate real-time dashboard synchronization
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      toast.error(err.message || 'Error executing ML pipeline', { title: 'ML prediction failed' });
    } finally {
      setIsPredicting(false);
    }
  };

  // Quick One-Click Synthetic Specimen ML Test
  const handleQuickSpecimenTest = async (severity) => {
    try {
      setIsPredicting(true);
      await api.rover.simulateScan(severity);
      if (severity === 'NONE') {
        confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      }
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      toast.error(err.message || 'The simulation could not be completed.', { title: 'Simulation error' });
    } finally {
      setIsPredicting(false);
    }
  };

  const lengthNum = Math.max(10, primary_length_mm || 120);
  const maxWidthNum = Math.max(0.1, primary_width_mm || 0.85);

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconCrosshair size={18} color="var(--text-primary)" />
          <span>Machine Learning Wall Crack Metrology</span>
        </div>
      }
      subtitle="Supervised Random Forest & Gradient Boosting Ensemble · Sub-pixel Distance Transform"
      tag={
        <Badge variant={total_defects > 0 ? 'danger' : 'success'}>
          {total_defects > 0 ? `${total_defects} Cracks Identified` : 'Surface Clear'}
        </Badge>
      }
      style={{ marginBottom: '24px' }}
    >
      {/* 1. ML Photo Predictor Studio Action Bar */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--accent-cyan)',
              animation: 'pulseBeacon 2s infinite'
            }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ML Crack Vision Model: <span style={{ fontFamily: DesignTokens.typography.mono, color: 'var(--accent-primary)' }}>v{ml_model_version}</span>
            </span>
            <span style={{
              background: 'var(--pastel-green-bg)',
              color: 'var(--pastel-green-text)',
              border: '1px solid var(--pastel-green-border)',
              padding: '2px 7px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 600
            }}>
              REAL-TIME READY
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Predicts fracture existence, severity, physical aperture in mm, and ACI 224R compliance from wall photos.
          </div>
        </div>

        {/* Action Triggers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsUploadModalOpen(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconCamera size={13} />
            <span>Upload Wall Photo (ML)</span>
          </Button>

          {/* Quick-test specimen presets */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginRight: '2px' }}>Specimens:</span>
            {[
              { label: 'Critical', sev: 'CRITICAL', color: 'var(--chart-bad)' },
              { label: 'High', sev: 'HIGH', color: 'var(--chart-warn)' },
              { label: 'Moderate', sev: 'MODERATE', color: 'var(--chart-info)' },
              { label: 'Clean', sev: 'NONE', color: 'var(--chart-good)' }
            ].map(item => (
              <button
                key={item.sev}
                type="button"
                disabled={isPredicting}
                onClick={() => handleQuickSpecimenTest(item.sev)}
                style={{
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  background: 'var(--surface-alt)',
                  color: item.color,
                  border: '1px solid var(--border)',
                  cursor: isPredicting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Top Toolbar: Laser HUD & Multi-View Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Standoff Stance: <strong style={{ color: 'var(--text-primary)' }}>250 mm</strong></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>Spatial Calibration: <strong style={{ color: 'var(--text-primary)' }}>2.50 px/mm</strong></span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span>ACI 224R External Limit: <strong style={{ color: 'var(--chart-warn)' }}>0.30 mm</strong></span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setShowScanHUD(!showScanHUD)}
            style={{
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: '4px',
              background: showScanHUD ? 'var(--pastel-blue-bg)' : 'var(--surface-alt)',
              color: showScanHUD ? 'var(--chart-info)' : 'var(--text-secondary)',
              border: `1px solid ${showScanHUD ? 'var(--pastel-blue-border)' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: showScanHUD ? 'var(--accent-cyan)' : 'var(--text-muted)',
              boxShadow: showScanHUD ? '0 0 6px var(--accent-cyan)' : 'none'
            }} />
            Laser HUD: {showScanHUD ? 'ON' : 'OFF'}
          </button>

          <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-alt)', padding: '3px', borderRadius: '6px' }}>
            {[
              { id: 'microscope', label: 'Microscope Loupe' },
              { id: 'side-by-side', label: 'Side by Side' },
              { id: 'processed', label: 'ML Annotation' },
              { id: 'heatmap', label: 'Thermal Heatmap' },
              { id: 'original', label: 'Raw Frame' }
            ].map((v) => (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 600,
                  borderRadius: '4px',
                  background: activeView === v.id ? 'var(--surface)' : 'transparent',
                  color: activeView === v.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                  boxShadow: activeView === v.id ? '0 1px 3px rgba(0,0,0,0.04)' : 'none',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Primary Metrics Banner with Animated Counters */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</div>
          <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
            {total_defects > 0 ? 'Fissure Identified' : 'Intact Surface'}
          </div>
        </div>

        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Primary Length</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {animatedLength} mm
          </div>
        </div>

        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Max Aperture</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: maxWidthNum >= 0.4 ? 'var(--chart-bad)' : (maxWidthNum >= 0.3 ? 'var(--chart-warn)' : 'var(--text-primary)'), marginTop: '4px' }}>
            {animatedWidth} mm
          </div>
        </div>

        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Severity Class</div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={getSeverityBadgeVariant(primary_severity)} size="sm">
              {primary_severity}
            </Badge>
          </div>
        </div>

        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ML Confidence</div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {animatedConfidence}%
          </div>
        </div>

        <div className="data-card-interactive" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>ACI 224R Compliance</div>
          <div style={{ marginTop: '6px' }}>
            <Badge variant={aci_224r_compliant ? 'success' : 'danger'} size="sm">
              {aci_224r_compliant ? 'Compliant (<=0.30mm)' : 'Non-Compliant (>0.30mm)'}
            </Badge>
          </div>
        </div>
      </div>

      {/* 4. Frame Comparison Windows with Optical Laser Scan HUD */}
      {!has_image ? (
        <div style={{
          height: '240px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: '8px',
          color: 'var(--text-secondary)',
          fontSize: '13px',
          marginBottom: '20px'
        }}>
          <div>No wall image captured yet.</div>
          <div style={{ marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Upload a photo or click a specimen preset above to predict wall cracks in real-time.
          </div>
        </div>
      ) : (
        <div>
          {/* View: High-Precision Digital Microscope & Reticle */}
          {activeView === 'microscope' && (
            <div style={{ marginBottom: '20px' }}>
              <DigitalMicroscopeLoupe
                imageUrl={processed_url || original_url}
                title={`Digital Microscope Inspection Reticle · ${primary_length_mm}mm × ${primary_width_mm}mm Fissure`}
                pxPerMm={2.5}
                defects={defects}
              />
            </div>
          )}

          {activeView !== 'microscope' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: activeView === 'side-by-side' ? '1fr 1fr' : '1fr',
              gap: '16px',
              marginBottom: '20px'
            }}>
          {/* View 1: Raw Sensor Frame */}
          {(activeView === 'side-by-side' || activeView === 'original') && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}>
              <FauxWindowHeader title="Raw Sensor Photo (Wall Surface)" />
              <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
                <img
                  src={original_url}
                  alt="Raw Wall Surface"
                  style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          )}

          {/* View 2: Processed ML Annotation Overlay */}
          {(activeView === 'side-by-side' || activeView === 'processed') && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}>
              <FauxWindowHeader title={`ML Fracture Annotation (${primary_length_mm} mm x ${primary_width_mm} mm)`} />
              <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
                <img
                  src={processed_url || original_url}
                  alt="Processed Crack Detection Annotation"
                  style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
                />

                {/* Animated Optical Laser Scanning HUD */}
                {showScanHUD && (
                  <>
                    <div className="scan-laser-line" />
                    <div className="scan-hud-grid" />
                    <div style={{ position: 'absolute', top: 10, left: 10, width: 14, height: 14, borderLeft: '2px solid var(--accent-cyan)', borderTop: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 14, height: 14, borderRight: '2px solid var(--accent-cyan)', borderTop: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 10, left: 10, width: 14, height: 14, borderLeft: '2px solid var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: 10, right: 10, width: 14, height: 14, borderRight: '2px solid var(--accent-cyan)', borderBottom: '2px solid var(--accent-cyan)', pointerEvents: 'none' }} />
                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      background: 'rgba(17, 17, 17, 0.78)',
                      backdropFilter: 'blur(4px)',
                      color: 'var(--accent-cyan)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontFamily: DesignTokens.typography.mono,
                      fontWeight: 600,
                      letterSpacing: '0.05em',
                      pointerEvents: 'none'
                    }}>
                      ML ENSEMBLE CLASSIFIER &middot; 2.50 PX/MM
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* View 3: Thermal Probability Heatmap */}
          {activeView === 'heatmap' && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--surface)', position: 'relative' }}>
              <FauxWindowHeader title="ML Fracture Probability Heatmap (Frangi Tubularity / Ridge Energy)" />
              <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
                <img
                  src={heatmap_url || processed_url || original_url}
                  alt="Thermal Fracture Heatmap"
                  style={{ width: '100%', height: '280px', objectFit: 'cover', display: 'block' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 12,
                  background: 'rgba(17, 17, 17, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#FFFFFF',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>Probability Scale:</span>
                  <div style={{
                    width: '60px',
                    height: '8px',
                    borderRadius: '2px',
                    background: 'linear-gradient(90deg, #0000FF, #00FFFF, #00FF00, #FFFF00, #FF0000)'
                  }} />
                  <span style={{ fontFamily: DesignTokens.typography.mono }}>0 &rarr; 100%</span>
                </div>
              </div>
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* 5. Modern Crack Metrology & Aperture Profiling Analytics */}
      {total_defects > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          {/* Left: Fissure Aperture Cross-Section Profile */}
          <div
            className="data-card-interactive"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '18px 16px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Fissure Aperture Cross-Section Profile
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Distance-transform aperture variation vs ACI 224R limits (0.30mm & 0.40mm)
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
                <span style={{ background: 'var(--surface-alt)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: DesignTokens.typography.mono }}>
                  Max: {maxWidthNum.toFixed(2)} mm
                </span>
                <span style={{ background: 'var(--surface-alt)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)', fontFamily: DesignTokens.typography.mono }}>
                  Span: {lengthNum.toFixed(1)} mm
                </span>
              </div>
            </div>

            <CrackApertureProfileChart
              primaryLengthMm={primary_length_mm}
              primaryWidthMm={primary_width_mm}
              height={220}
            />
          </div>

          {/* Right: Detected Crack Severity Distribution */}
          <div
            className="data-card-interactive"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              padding: '18px 16px',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Crack Severity Distribution
                </span>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  Defect count classified by engineering risk category
                </div>
              </div>
              <Badge variant={primary_severity === 'CRITICAL' ? 'danger' : primary_severity === 'HIGH' ? 'warning' : 'info'}>
                {defects.length} Fissures
              </Badge>
            </div>

            <DefectSeverityBarChart
              defects={defects}
              height={220}
            />
          </div>
        </div>
      )}

      {/* 6. Identified Defects Explorer & Photogrammetry Ledger */}
      <DefectsExplorerTable
        defects={defects}
        primarySeverity={primary_severity}
        primaryLengthMm={primary_length_mm}
        primaryWidthMm={primary_width_mm}
        onSelectDefect={() => {
          setActiveView('microscope');
        }}
      />

      {/* 7. ML Photo Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => {
          setIsUploadModalOpen(false);
          setSelectedPhoto(null);
          setPhotoPreview(null);
        }}
        title="Predict Wall Crack by Photo (ML Model)"
      >
        <form onSubmit={handleRunMlPrediction}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
            Upload or drop a photo of a concrete wall surface. The Machine Learning model extracts Frangi ridge tubularity, LBP texture, and gradient entropy to detect fractures and compute aperture in mm.
          </p>

          {/* Drag & Drop File Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handlePhotoSelect(e.dataTransfer.files[0]);
              }
            }}
            style={{
              border: `2px dashed ${dragOver ? 'var(--text-primary)' : 'var(--border)'}`,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              background: dragOver ? 'var(--surface-alt)' : 'var(--surface)',
              marginBottom: '16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onClick={() => document.getElementById('ml-file-input').click()}
          >
            {photoPreview ? (
              <div>
                <img
                  src={photoPreview}
                  alt="Selected Preview"
                  style={{
                    maxHeight: '160px',
                    borderRadius: '6px',
                    margin: '0 auto 10px',
                    display: 'block',
                    objectFit: 'contain'
                  }}
                />
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {selectedPhoto?.name}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Click or drop another file to replace
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px'
                }}>
                  <IconUpload size={18} color="var(--text-primary)" />
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Drag &amp; drop wall photo here, or browse
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Supports JPG, JPEG, PNG (high-resolution concrete surfaces recommended)
                </div>
              </div>
            )}
            <input
              id="ml-file-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handlePhotoSelect(e.target.files[0]);
                }
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <Input
              label="Sensor Standoff Distance (mm)"
              type="number"
              value={standoffDistance}
              onChange={(e) => setStandoffDistance(Number(e.target.value))}
              helperText="Nominal calibration is 250 mm (2.50 pixels/mm)"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button
              variant="ghost"
              onClick={() => {
                setIsUploadModalOpen(false);
                setSelectedPhoto(null);
                setPhotoPreview(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isPredicting}
              disabled={!selectedPhoto}
            >
              Run ML Model Prediction
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
};
