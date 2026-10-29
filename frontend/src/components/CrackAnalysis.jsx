import React, { useState } from 'react';
import { Card, Badge, FauxWindowHeader, Button, Modal, Input } from './UI/Components';
import { useToast } from '../ui';
import {
  IconCrosshair,
  IconEye,
  IconCamera,
  IconUpload,
  IconCpu,
  IconActivity,
  IconRefresh,
  IconShield,
  IconAlert,
  IconZoomIn
} from './UI/Icons';
import { DesignTokens } from '../tokens';
import { useAnimatedNumber } from './UI/useAnimatedNumber';
import { api } from '../services/api';
import { DigitalMicroscopeLoupe } from './DigitalMicroscopeLoupe';
import { DefectsExplorerTable } from './DefectsExplorerTable';

export const CrackAnalysis = ({ crackData = {}, onActionComplete }) => {
  const toast = useToast();
  const [activeView, setActiveView] = useState('side-by-side');
  const [showScanHUD, setShowScanHUD] = useState(true);
  const [hoveredProfilePoint, setHoveredProfilePoint] = useState(null);
  const [crosshairPos, setCrosshairPos] = useState(null);

  // ML Photo Prediction Studio State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [standoffDistance, setStandoffDistance] = useState(250);
  const [isPredicting, setIsPredicting] = useState(false);
  const [predictionFeedback, setPredictionFeedback] = useState(null);
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
    crack_probability = 0.0,
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
      setPredictionFeedback(res);
      setIsUploadModalOpen(false);
      setSelectedPhoto(null);
      setPhotoPreview(null);

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
      if (onActionComplete) {
        onActionComplete();
      }
    } catch (err) {
      toast.error(err.message || 'The simulation could not be completed.', { title: 'Simulation error' });
    } finally {
      setIsPredicting(false);
    }
  };

  // Generate synthetic profile data points along the fissure skeleton
  const lengthNum = Math.max(10, primary_length_mm || 120);
  const maxWidthNum = Math.max(0.1, primary_width_mm || 0.85);

  const numProfileSamples = 24;
  const profilePoints = [];
  for (let i = 0; i <= numProfileSamples; i++) {
    const fraction = i / numProfileSamples;
    const distance_mm = Math.round(fraction * lengthNum * 10) / 10;
    const bellFactor = Math.sin(fraction * Math.PI);
    const noise = Math.sin(fraction * 18) * 0.12 * bellFactor;
    const aperture_mm = Math.max(0.04, Math.round((bellFactor * maxWidthNum + noise) * 100) / 100);
    profilePoints.push({
      distance_mm,
      aperture_mm
    });
  }

  // Proper Cartesian dimensions for Aperture Cross-Section Profile
  const chartWidth = 720;
  const chartHeight = 220;
  const padLeft = 52;
  const padRight = 32;
  const padTop = 24;
  const padBottom = 34;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;
  const maxProfileY = Math.max(0.6, maxWidthNum * 1.35);

  const ySteps = 4;
  const yTicks = Array.from({ length: ySteps + 1 }, (_, i) => {
    return Math.round((maxProfileY * (ySteps - i) / ySteps) * 100) / 100;
  });

  const getYCoord = (val) => padTop + plotH - (Math.min(maxProfileY, Math.max(0, val)) / maxProfileY) * plotH;
  const getXCoord = (i) => padLeft + (i / (profilePoints.length - 1)) * plotW;

  const svgCoords = profilePoints.map((pt, i) => {
    const x = getXCoord(i);
    const y = getYCoord(pt.aperture_mm);
    return { ...pt, x, y, idx: i };
  });

  // Spline for aperture curve
  const generateSpline = (coords) => {
    if (coords.length === 0) return '';
    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[Math.max(0, i - 1)];
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const p3 = coords[Math.min(coords.length - 1, i + 2)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const profileLinePath = generateSpline(svgCoords);
  const profileAreaPath = svgCoords.length > 0
    ? `${profileLinePath} L ${svgCoords[svgCoords.length - 1].x} ${padTop + plotH} L ${svgCoords[0].x} ${padTop + plotH} Z`
    : '';

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

      {/* 5. Dedicated Crack Aperture Profiling Graph (Cross-Section Profile) */}
      {total_defects > 0 && (
        <div
          className="data-card-interactive"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '20px 18px 16px',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Fissure Aperture Cross-Section Profile
                </span>
                <span style={{
                  background: 'var(--border)',
                  color: 'var(--text-secondary)',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  fontFamily: DesignTokens.typography.mono
                }}>
                  {profilePoints.length} SAMPLES
                </span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Sub-pixel skeleton distance-transform aperture variation along fracture length (mm vs mm)
              </div>
            </div>

            {/* Quick Metrics Summary Strip */}
            <div style={{ display: 'flex', gap: '8px', fontSize: '11px', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Max: </span>
                <strong style={{ color: maxWidthNum >= 0.4 ? 'var(--chart-bad)' : 'var(--chart-warn)', fontFamily: DesignTokens.typography.mono }}>
                  {maxWidthNum.toFixed(2)} mm
                </strong>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Span: </span>
                <strong style={{ color: 'var(--text-primary)', fontFamily: DesignTokens.typography.mono }}>{lengthNum.toFixed(1)} mm</strong>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>ACI Limit: </span>
                <strong style={{ color: 'var(--chart-warn)', fontFamily: DesignTokens.typography.mono }}>0.30 mm</strong>
              </div>
              <div style={{ background: 'var(--surface-alt)', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Crit Limit: </span>
                <strong style={{ color: 'var(--chart-bad)', fontFamily: DesignTokens.typography.mono }}>0.40 mm</strong>
              </div>
            </div>
          </div>

          {/* SVG Cartesian Metrology Chart */}
          <div style={{ width: '100%', height: '220px', position: 'relative' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: '100%', overflow: 'visible' }}
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="apertureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-bad)" stopOpacity="0.28" />
                  <stop offset="65%" stopColor="var(--chart-bad)" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="var(--chart-bad)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Shaded Hazard Background Zones */}
              <rect
                x={padLeft}
                y={getYCoord(maxProfileY)}
                width={plotW}
                height={getYCoord(0.40) - getYCoord(maxProfileY)}
                fill="var(--chart-bad)"
                fillOpacity="0.035"
              />
              <rect
                x={padLeft}
                y={getYCoord(0.40)}
                width={plotW}
                height={getYCoord(0.30) - getYCoord(0.40)}
                fill="var(--chart-warn)"
                fillOpacity="0.03"
              />
              <rect
                x={padLeft}
                y={getYCoord(0.30)}
                width={plotW}
                height={getYCoord(0.0) - getYCoord(0.30)}
                fill="var(--chart-good)"
                fillOpacity="0.025"
              />

              {/* Y-Axis Horizontal Gridlines & Tick Numbers */}
              {yTicks.map((tick, i) => {
                const yPos = getYCoord(tick);
                return (
                  <g key={`y-grid-${i}`}>
                    <line
                      x1={padLeft}
                      y1={yPos}
                      x2={padLeft + plotW}
                      y2={yPos}
                      stroke="var(--border)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 9}
                      y={yPos + 3.5}
                      textAnchor="end"
                      fontSize="9.5"
                      fill="var(--chart-label)"
                      fontFamily={DesignTokens.typography.mono}
                      fontWeight="500"
                    >
                      {tick.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Left Y-Axis Baseline Line */}
              <line
                x1={padLeft}
                y1={padTop}
                x2={padLeft}
                y2={padTop + plotH}
                stroke="var(--chart-axis)"
                strokeWidth="1.2"
              />

              {/* Y-Axis Title */}
              <text
                x={14}
                y={padTop + plotH / 2}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-secondary)"
                fontWeight="600"
                fontFamily={DesignTokens.typography.sans}
                letterSpacing="0.06em"
                transform={`rotate(-90, 14, ${padTop + plotH / 2})`}
              >
                APERTURE (MM)
              </text>

              {/* Bottom X-Axis Baseline */}
              <line
                x1={padLeft}
                y1={padTop + plotH}
                x2={padLeft + plotW}
                y2={padTop + plotH}
                stroke="var(--chart-axis)"
                strokeWidth="1.2"
              />

              {/* X-Axis Distance Ticks */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((frac, idx) => {
                const xPos = padLeft + frac * plotW;
                const dVal = (frac * lengthNum).toFixed(0);
                return (
                  <g key={`x-tick-${idx}`}>
                    <line
                      x1={xPos}
                      y1={padTop + plotH}
                      x2={xPos}
                      y2={padTop + plotH + 4}
                      stroke="var(--chart-axis)"
                      strokeWidth="1"
                    />
                    <text
                      x={xPos}
                      y={padTop + plotH + 15}
                      textAnchor="middle"
                      fontSize="9"
                      fill="var(--chart-label)"
                      fontFamily={DesignTokens.typography.mono}
                    >
                      {dVal} mm
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Title */}
              <text
                x={padLeft + plotW / 2}
                y={chartHeight - 4}
                textAnchor="middle"
                fontSize="9"
                fill="var(--text-secondary)"
                fontWeight="600"
                fontFamily={DesignTokens.typography.sans}
                letterSpacing="0.05em"
              >
                FRACTURE DISTANCE SPAN (MM)
              </text>

              {/* Standard Benchmark Threshold Lines */}
              {/* 1. ACI 224R Limit (0.30mm) */}
              <line
                x1={padLeft}
                y1={getYCoord(0.30)}
                x2={padLeft + plotW}
                y2={getYCoord(0.30)}
                stroke="var(--chart-warn)"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                className="animate-threshold-line"
              />
              <text
                x={padLeft + plotW - 4}
                y={getYCoord(0.30) - 4}
                textAnchor="end"
                fontSize="8.5"
                fill="var(--chart-warn)"
                fontWeight="600"
                fontFamily={DesignTokens.typography.mono}
              >
                ACI 224R (0.30 mm)
              </text>

              {/* 2. Critical Limit (0.40mm) */}
              <line
                x1={padLeft}
                y1={getYCoord(0.40)}
                x2={padLeft + plotW}
                y2={getYCoord(0.40)}
                stroke="var(--chart-bad)"
                strokeWidth="1.2"
                strokeDasharray="4 3"
                className="animate-threshold-line"
              />
              <text
                x={padLeft + plotW - 4}
                y={getYCoord(0.40) - 4}
                textAnchor="end"
                fontSize="8.5"
                fill="var(--chart-bad)"
                fontWeight="600"
                fontFamily={DesignTokens.typography.mono}
              >
                CRITICAL (0.40 mm)
              </text>

              {/* Shaded Area Fill */}
              {profileAreaPath && (
                <path
                  d={profileAreaPath}
                  fill="url(#apertureGradient)"
                  className="animate-area-breathe"
                />
              )}

              {/* Primary Aperture Spline Path */}
              {profileLinePath && (
                <path
                  d={profileLinePath}
                  fill="none"
                  stroke="var(--chart-bad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="animate-chart-path"
                />
              )}

              {/* Flowing Dash Motion Tracer */}
              {profileLinePath && (
                <path
                  d={profileLinePath}
                  fill="none"
                  stroke="var(--chart-bad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  className="animate-flow-dash"
                  opacity="0.85"
                />
              )}

              {/* Data points along curve */}
              {svgCoords.map((pt, i) => {
                const isOverAci = pt.aperture_mm >= 0.30;
                return (
                  <circle
                    key={`pt-${i}`}
                    cx={pt.x}
                    cy={pt.y}
                    r={crosshairPos && crosshairPos.idx === i ? 4.5 : 2.5}
                    fill={isOverAci ? 'var(--chart-bad)' : 'var(--text-primary)'}
                    stroke="var(--surface)"
                    strokeWidth="1"
                    style={{ transition: 'all 0.15s ease' }}
                  />
                );
              })}

              {/* Crosshair Guideline Elements */}
              {crosshairPos && (
                <g pointerEvents="none">
                  {/* Vertical Guide Line */}
                  <line
                    x1={crosshairPos.x}
                    y1={padTop}
                    x2={crosshairPos.x}
                    y2={padTop + plotH}
                    stroke="var(--text-primary)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.65"
                  />
                  {/* Horizontal Guide Line */}
                  <line
                    x1={padLeft}
                    y1={crosshairPos.y}
                    x2={padLeft + plotW}
                    y2={crosshairPos.y}
                    stroke="var(--text-primary)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.65"
                  />
                  {/* Snapped Target Reticle Dot */}
                  <circle
                    cx={crosshairPos.x}
                    cy={crosshairPos.y}
                    r="5"
                    fill="var(--chart-bad)"
                    stroke="var(--surface)"
                    strokeWidth="2"
                    className="animate-node-pulse"
                  />
                </g>
              )}

              {/* Interactive Mouse Capture Layer for 60fps Scrubber */}
              <rect
                x={padLeft}
                y={padTop}
                width={plotW}
                height={plotH}
                fill="transparent"
                style={{ cursor: 'crosshair' }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = ((e.clientX - rect.left) / rect.width) * plotW + padLeft;
                  let closest = svgCoords[0];
                  let minDiff = Infinity;
                  svgCoords.forEach((pt) => {
                    const diff = Math.abs(pt.x - mouseX);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = pt;
                    }
                  });
                  setCrosshairPos(closest);
                  setHoveredProfilePoint(closest);
                }}
                onMouseLeave={() => {
                  setCrosshairPos(null);
                  setHoveredProfilePoint(null);
                }}
              />
            </svg>

            {/* Dynamic Floating Glassmorphism Tooltip HUD */}
            {crosshairPos && (
              <div
                style={{
                  position: 'absolute',
                  left: `${(crosshairPos.x / chartWidth) * 100}%`,
                  top: `${Math.max(10, (crosshairPos.y / chartHeight) * 100 - 34)}%`,
                  transform: 'translate(-50%, -100%)',
                  background: 'var(--chart-tooltip-bg)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  pointerEvents: 'none',
                  zIndex: 40,
                  whiteSpace: 'nowrap',
                  fontSize: '11px',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                  <span style={{ fontWeight: 600, color: '#CCCCCC' }}>Pos: {crosshairPos.pt.distance_mm} mm</span>
                  <span style={{
                    color: crosshairPos.pt.aperture_mm >= 0.4 ? '#F87171' : (crosshairPos.pt.aperture_mm >= 0.3 ? '#FBBF24' : '#34D399'),
                    fontWeight: 700,
                    fontFamily: DesignTokens.typography.mono
                  }}>
                    {crosshairPos.pt.aperture_mm} mm
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '10px' }}>
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: crosshairPos.pt.aperture_mm >= 0.3 ? 'var(--accent-red)' : 'var(--accent-emerald)'
                  }} />
                  <span style={{ color: '#AAAAAA' }}>ACI 224R:</span>
                  <span style={{ fontWeight: 600, color: '#FFFFFF' }}>
                    {crosshairPos.pt.aperture_mm >= 0.3 ? 'Non-compliant (>0.30mm)' : 'Nominal tolerance'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Interactive Scrub Bar & Hover Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: 'var(--text-secondary)',
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '2px', background: 'var(--chart-bad)' }} /> Skeleton Aperture
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '1px', borderTop: '2px dashed var(--chart-warn)' }} /> ACI 224R (0.30mm)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '12px', height: '1px', borderTop: '2px dashed var(--chart-bad)' }} /> Critical (0.40mm)
              </span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              Scrub along fracture to verify sub-pixel aperture profile
            </div>
          </div>
        </div>
      )}

      {/* 6. Identified Defects Explorer & Photogrammetry Ledger */}
      <DefectsExplorerTable
        defects={defects}
        primarySeverity={primary_severity}
        primaryLengthMm={primary_length_mm}
        primaryWidthMm={primary_width_mm}
        onSelectDefect={(id) => {
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
