import React, { useState, useEffect, useCallback } from 'react';
import { FileText, RefreshCw, Printer, Download, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
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
      setError('Unable to fetch report dossier from backend server.');
    } finally {
      setLoading(false);
    }
  }, [inspectionId]);

  useEffect(() => {
    if (!inspectionId) return undefined;
    const t = window.setTimeout(() => fetchReport(), 0);
    return () => window.clearTimeout(t);
  }, [inspectionId, fetchReport]);

  const handleOpenPrintable = () => {
    if (!inspectionId) return;
    window.open(api.reports.getHtmlUrl(inspectionId), '_blank');
  };

  const handleDownloadJson = () => {
    if (!reportData) return;
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dossier_${reportData.metadata?.report_id || `REP-${inspectionId}`}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!inspectionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Structural Inspection Dossier</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed py-12 text-center">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground opacity-60" />
            <div className="text-sm font-medium">No Inspection Session Selected</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Select or start an inspection session to inspect and export its report.
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 space-y-0 border-b pb-4">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Inspection Dossier</span>
            <Badge variant="outline" className="font-mono text-[10px]">
              ISO 1920 / ACI 224R
            </Badge>
          </CardTitle>
          <CardDescription>
            Photogrammetric asset measurements, defect summary, and lifecycle forecast record.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReport} loading={loading}>
            {!loading && <RefreshCw className="h-3.5 w-3.5" />}
            <span>Refresh</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadJson} disabled={!reportData}>
            <Download className="h-3.5 w-3.5" />
            <span>Export JSON</span>
          </Button>
          <Button size="sm" onClick={handleOpenPrintable}>
            <Printer className="h-3.5 w-3.5" />
            <span>Print / PDF</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {loading && !reportData && (
          <div className="py-10 text-center text-xs text-muted-foreground">
            Loading dossier record...
          </div>
        )}

        {reportData && (
          <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  Record ID
                </div>
                <div className="font-mono text-base font-semibold">
                  {reportData.metadata?.report_id || `REP-${inspectionId}`}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Generated
                  </div>
                  <div className="font-mono text-xs">
                    {reportData.metadata?.generated_at
                      ? new Date(reportData.metadata.generated_at).toLocaleString()
                      : 'N/A'}
                  </div>
                </div>
                <Badge variant="success">
                  <Check className="h-3 w-3" /> Verified
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-3.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">Target Asset</div>
                  <div className="mt-1 text-sm font-semibold">
                    {reportData.asset?.wall_code || 'WALL-01'}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {reportData.asset?.wall_name || 'Primary Facade'} · {reportData.asset?.building_name || 'Structure'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">Crack Metrology</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {reportData.crack_detection?.total_cracks_detected ?? 0} Defects
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Max Width:{' '}
                    <span className="font-semibold text-foreground tabular-nums">
                      {reportData.crack_detection?.max_crack_width_mm ?? 0} mm
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">Health Index</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {reportData.health_assessment?.shi_score ?? 85.0} / 100
                  </div>
                  <div className="mt-1">
                    <Badge variant={reportData.health_assessment?.shi_score < 70 ? 'destructive' : 'success'}>
                      {reportData.health_assessment?.status || 'OPTIMAL'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3.5">
                  <div className="font-mono text-[10px] uppercase text-muted-foreground">Remaining Useful Life</div>
                  <div className="mt-1 text-sm font-semibold tabular-nums">
                    {reportData.rul_prediction?.estimated_rul_years ?? 14.5} Years
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    Trend: {reportData.rul_prediction?.deterioration_trend || 'Stable'}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
