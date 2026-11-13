import React, { useState } from 'react';
import { Crosshair, Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input, Label } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { CrackApertureProfileChart, DefectSeverityBarChart } from './charts/EngineeringCharts';
import { DigitalMicroscopeLoupe } from './DigitalMicroscopeLoupe';
import { DefectsExplorerTable } from './DefectsExplorerTable';
import { api } from '../services/api';
import { cn } from '../lib/utils';

const getSeverityVariant = (sev) => {
  if (sev === 'CRITICAL') return 'destructive';
  if (sev === 'HIGH' || sev === 'MODERATE') return 'warning';
  if (sev === 'LOW') return 'info';
  return 'success';
};

const VIEW_MODES = [
  { id: 'side-by-side', label: 'Side by Side' },
  { id: 'microscope', label: 'Microscope Loupe' },
  { id: 'processed', label: 'ML Annotation' },
  { id: 'heatmap', label: 'Heatmap' },
  { id: 'original', label: 'Raw Frame' },
];

export const CrackAnalysis = ({ crackData = {}, onActionComplete }) => {
  const [activeView, setActiveView] = useState('side-by-side');
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
    defects = [],
  } = crackData;

  const confValue = Math.round(
    defects.length > 0
      ? defects[0].confidence > 1
        ? defects[0].confidence
        : defects[0].confidence * 100
      : confidence_percentage
  );

  const handlePhotoSelect = (file) => {
    if (!file) return;
    setSelectedPhoto(file);
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target?.result || null);
    reader.readAsDataURL(file);
  };

  const handleRunMlPrediction = async (e) => {
    e.preventDefault();
    if (!selectedPhoto) {
      toast.warning('Select a concrete surface image before running prediction');
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
      toast.success(
        res?.crack_detected
          ? `Detected ${res.total_cracks || 1} fracture contour(s)`
          : 'Surface verified intact (no cracks detected)'
      );
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error(err.message || 'ML inference failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleQuickSpecimenTest = async (severity) => {
    try {
      setIsPredicting(true);
      await api.rover.simulateScan(severity);
      toast.success(`Specimen scan (${severity}) processed`);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      toast.error(err.message || 'Specimen simulation failed');
    } finally {
      setIsPredicting(false);
    }
  };

  const lengthNum = Math.max(10, Number(primary_length_mm) || 120);
  const maxWidthNum = Math.max(0.1, Number(primary_width_mm) || 0.85);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Crosshair className="h-4 w-4" />
              <span>Machine Learning Crack Metrology</span>
            </CardTitle>
            <CardDescription>
              Random Forest &amp; Gradient Boosting Ensemble · Sub-pixel Distance Transform (v{ml_model_version})
            </CardDescription>
          </div>
          <Badge variant={total_defects > 0 ? 'destructive' : 'success'}>
            {total_defects > 0 ? `${total_defects} Defects Detected` : 'Surface Clear'}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Action & Presets Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Standoff: <strong className="text-foreground">250 mm</strong></span>
              <span>·</span>
              <span>Scale: <strong className="text-foreground">2.50 px/mm</strong></span>
              <span>·</span>
              <span>ACI 224R Limit: <strong className="text-amber-500">0.30 mm</strong></span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                <Camera className="h-3.5 w-3.5" />
                <span>Upload Photo (ML)</span>
              </Button>

              <div className="inline-flex items-center gap-1 rounded-md border bg-background p-1">
                <span className="px-1.5 text-[11px] text-muted-foreground">Test Preset:</span>
                {['CRITICAL', 'HIGH', 'MODERATE', 'NONE'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    disabled={isPredicting}
                    onClick={() => handleQuickSpecimenTest(sev)}
                    className="rounded px-2 py-0.5 text-[11px] font-medium hover:bg-muted disabled:opacity-50 cursor-pointer"
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Primary Readout Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
              <div className="mt-1 text-sm font-semibold">
                {total_defects > 0 ? 'Fissure Found' : 'Intact'}
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary Length</div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">
                {Number(primary_length_mm).toFixed(1)} mm
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Max Aperture</div>
              <div
                className={cn(
                  'mt-1 font-mono text-base font-semibold tabular-nums',
                  maxWidthNum >= 0.4 ? 'text-red-500' : maxWidthNum >= 0.3 ? 'text-amber-500' : ''
                )}
              >
                {Number(primary_width_mm).toFixed(2)} mm
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Severity</div>
              <div className="mt-1">
                <Badge variant={getSeverityVariant(primary_severity)}>{primary_severity}</Badge>
              </div>
            </div>

            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confidence</div>
              <div className="mt-1 font-mono text-base font-semibold tabular-nums">{confValue}%</div>
            </div>

            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">ACI 224R</div>
              <div className="mt-1">
                <Badge variant={aci_224r_compliant ? 'success' : 'destructive'}>
                  {aci_224r_compliant ? 'Compliant' : '>0.30 mm'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Image View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex flex-wrap gap-1 rounded-md border bg-muted p-0.5">
              {VIEW_MODES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveView(v.id)}
                  className={cn(
                    'rounded-sm px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                    activeView === v.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image Canvas */}
          {!has_image ? (
            <div className="flex h-56 flex-col items-center justify-center rounded-md border border-dashed text-center">
              <div className="text-sm font-medium">No wall image captured yet</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Upload a concrete wall photo or trigger a test preset above.
              </div>
            </div>
          ) : activeView === 'microscope' ? (
            <DigitalMicroscopeLoupe
              imageUrl={processed_url || original_url}
              title={`Inspection Reticle · ${primary_length_mm}mm × ${primary_width_mm}mm`}
              pxPerMm={2.5}
            />
          ) : (
            <div className={cn('grid gap-4', activeView === 'side-by-side' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
              {(activeView === 'side-by-side' || activeView === 'original') && (
                <div className="overflow-hidden rounded-md border">
                  <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">Raw Sensor Frame</div>
                  <img src={original_url} alt="Raw Wall Surface" className="block h-72 w-full object-cover" />
                </div>
              )}

              {(activeView === 'side-by-side' || activeView === 'processed') && (
                <div className="overflow-hidden rounded-md border">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs font-medium">
                    <span>ML Annotation Overlay</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {primary_length_mm} × {primary_width_mm} mm
                    </span>
                  </div>
                  <img
                    src={processed_url || original_url}
                    alt="Processed Crack Annotation"
                    className="block h-72 w-full object-cover"
                  />
                </div>
              )}

              {activeView === 'heatmap' && (
                <div className="overflow-hidden rounded-md border">
                  <div className="border-b bg-muted/40 px-3 py-2 text-xs font-medium">
                    Frangi Ridge Energy Heatmap
                  </div>
                  <img
                    src={heatmap_url || processed_url || original_url}
                    alt="Thermal Fracture Heatmap"
                    className="block h-72 w-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Charts */}
          {total_defects > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Fissure Aperture Cross-Section</CardTitle>
                  <CardDescription>
                    Max {maxWidthNum.toFixed(2)} mm across {lengthNum.toFixed(1)} mm span
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CrackApertureProfileChart primaryLengthMm={primary_length_mm} primaryWidthMm={primary_width_mm} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Defect Severity Breakdown</CardTitle>
                  <CardDescription>{defects.length} detected fracture contours</CardDescription>
                </CardHeader>
                <CardContent>
                  <DefectSeverityBarChart defects={defects} />
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      <DefectsExplorerTable
        defects={defects}
        primarySeverity={primary_severity}
        primaryLengthMm={primary_length_mm}
        primaryWidthMm={primary_width_mm}
        onSelectDefect={() => setActiveView('microscope')}
      />

      {/* ML Upload Dialog */}
      <Dialog
        open={isUploadModalOpen}
        onOpenChange={(open) => {
          setIsUploadModalOpen(open);
          if (!open) {
            setSelectedPhoto(null);
            setPhotoPreview(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Analyze Concrete Surface Photo</DialogTitle>
            <DialogDescription>
              Upload a surface photograph to measure fracture width and length in millimeters.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRunMlPrediction} className="space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files?.[0]) handlePhotoSelect(e.dataTransfer.files[0]);
              }}
              onClick={() => document.getElementById('ml-file-input')?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-6 text-center transition-colors',
                dragOver ? 'border-primary bg-muted/50' : 'border-border hover:bg-muted/30'
              )}
            >
              {photoPreview ? (
                <div className="space-y-2">
                  <img src={photoPreview} alt="Preview" className="mx-auto max-h-40 rounded object-contain" />
                  <div className="text-xs font-medium">{selectedPhoto?.name}</div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                  <div className="text-xs font-medium">Drop a wall photo or click to browse</div>
                  <div className="text-[11px] text-muted-foreground">JPG / PNG high-resolution recommended</div>
                </div>
              )}
              <input
                id="ml-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handlePhotoSelect(e.target.files[0]);
                }}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ml-standoff">Sensor Standoff Distance (mm)</Label>
              <Input
                id="ml-standoff"
                type="number"
                value={standoffDistance}
                onChange={(e) => setStandoffDistance(Number(e.target.value))}
              />
              <p className="text-[11px] text-muted-foreground">Nominal calibration: 250 mm (2.50 px/mm)</p>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={isPredicting} disabled={!selectedPhoto}>
                Run Prediction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
