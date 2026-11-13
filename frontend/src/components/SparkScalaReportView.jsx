import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  Filter,
  Cpu,
  Calculator,
  Building2,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/table';
import { api } from '../services/api';

const gradeVariant = (grade) => {
  if (grade === 'Grade A') return 'success';
  if (grade === 'Grade B') return 'warning';
  return 'destructive';
};

export const SparkScalaReportView = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.scalaStream.getBatchAnalytics();
      setReport(data);
    } catch (e) {
      setError(e.message || 'Unable to load Spark & Scala batch analysis output');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => loadAnalytics(), 0);
    return () => window.clearTimeout(t);
  }, [loadAnalytics]);

  if (loading && !report) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-xs text-muted-foreground">
          Loading Apache Spark &amp; Scala 7-Stage Analysis Output...
        </CardContent>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Batch Analytics Output Unavailable</AlertTitle>
        <AlertDescription>
          {error || 'Run the Spark analyzer (`cd scala-spark-analytics && sbt run`) to generate the 7-stage report.'}
        </AlertDescription>
      </Alert>
    );
  }

  const s1 = report.datasetLoadingOutput;
  const s2 = report.datasetInspectionOutput;
  const s3 = report.dataPreprocessingOutput;
  const s4 = report.sparkDataProcessingOutput;
  const s5 = report.scalaBasedAnalysisOutput;
  const s6 = report.buildingHealthClassificationOutput;
  const s7 = report.finalResultGenerationOutput;

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
        <div className="space-y-0.5">
          <div className="text-sm font-semibold">Apache Spark {s4.sparkVersion} &amp; Scala {s5.scalaVersion} — 7-Stage Batch Report</div>
          <div className="font-mono text-[11px] text-muted-foreground">
            Generated: {new Date(s7.generatedAtIso).toLocaleString()} · Master: {s4.master}
          </div>
        </div>
        <Button variant="outline" size="sm" loading={loading} onClick={loadAnalytics}>
          {!loading && <RefreshCw className="h-3.5 w-3.5" />}
          <span>Reload Report</span>
        </Button>
      </div>

      {/* 1. Dataset Loading Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Database className="h-4 w-4 text-sky-500" />
              <span>1. Dataset Loading Output</span>
            </span>
            <Badge variant="outline" className="font-mono">{s1.loadTimeMs} ms</Badge>
          </CardTitle>
          <CardDescription>Spark DataFrameReader CSV ingestion with automatic schema inference.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[s1.inspectionsDataset, s1.defectsDataset].map((ds) => (
            <div key={ds.name} className="rounded-md border bg-muted/30 p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold">{ds.name}</span>
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {ds.rows.toLocaleString()} rows × {ds.columns} cols
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {ds.schema.slice(0, 10).map((f) => (
                  <Badge key={f.name} variant="outline" className="font-mono text-[10px]">
                    {f.name}: {f.dataType}
                  </Badge>
                ))}
                {ds.schema.length > 10 && (
                  <Badge variant="outline" className="font-mono text-[10px]">
                    +{ds.schema.length - 10} fields
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 2. Dataset Inspection Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-sky-500" />
              <span>2. Dataset Inspection Output</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(s2.severityDistribution || {}).map(([k, v]) => (
                <Badge key={k} variant={k === 'CRITICAL' ? 'destructive' : k === 'HIGH' ? 'warning' : 'info'} className="font-mono">
                  {k}: {v}
                </Badge>
              ))}
            </div>
          </CardTitle>
          <CardDescription>Column null audit and summary descriptive statistics across sensor and defect columns.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {s2.inspectionsNullAudit.filter((n) => n.nullCount > 0).map((n) => (
              <Badge key={n.column} variant="warning" className="font-mono">
                inspections.{n.column}: {n.nullCount} nulls
              </Badge>
            ))}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead>Min</TableHead>
                <TableHead>Max</TableHead>
                <TableHead>Mean</TableHead>
                <TableHead>StdDev</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s2.numericStats.map((st) => (
                <TableRow key={st.feature}>
                  <TableCell className="font-mono font-medium">{st.feature}</TableCell>
                  <TableCell className="font-mono tabular-nums">{st.min}</TableCell>
                  <TableCell className="font-mono tabular-nums">{st.max}</TableCell>
                  <TableCell className="font-mono tabular-nums">{st.mean}</TableCell>
                  <TableCell className="font-mono tabular-nums">{st.stddev}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 3. Data Preprocessing Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-sky-500" />
            <span>3. Data Preprocessing Output</span>
          </CardTitle>
          <CardDescription>Deduplication, missing value imputation, normalization, and threshold flagging.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Duplicates Dropped</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{s3.duplicatesRemoved}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Imputed SHI</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{s3.missingShiImputed}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Imputed RUL</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{s3.missingRulImputed}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Vib Outliers (&gt;0.4g)</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{s3.vibrationOutliersFlagged}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">ACI Violations</div>
              <div className="mt-1 font-mono text-lg font-semibold text-red-500 tabular-nums">{s3.aciNonCompliantDefects}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Clean Records</div>
              <div className="mt-1 font-mono text-lg font-semibold tabular-nums">{s3.cleanInspectionsCount} / {s3.cleanDefectsCount}</div>
            </div>
          </div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {s3.stepsApplied.map((step, i) => (
              <li key={i} className="font-mono text-[11px]">• {step}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* 4. Spark Data Processing Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-500" />
              <span>4. Spark Data Processing Output</span>
            </span>
            <div className="flex gap-2">
              <Badge variant="outline" className="font-mono">{s4.partitionsUsed} partitions</Badge>
              <Badge variant="secondary" className="font-mono">{s4.executionTimeMs} ms</Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Distributed Spark SQL group aggregations and partitioned rolling window calculations (ACI Compliance: {s4.aciComplianceRatePct}%).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Wall</TableHead>
                <TableHead>Inspections</TableHead>
                <TableHead>Defects</TableHead>
                <TableHead>Avg Width</TableHead>
                <TableHead>Max Width</TableHead>
                <TableHead>Window Roll Max</TableHead>
                <TableHead>Avg Vib</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s4.buildingAggregates.map((b) => (
                <TableRow key={b.buildingId}>
                  <TableCell className="font-medium">{b.buildingName}</TableCell>
                  <TableCell className="font-mono text-[11px]">{b.wallCode}</TableCell>
                  <TableCell className="font-mono tabular-nums">{b.inspectionCount}</TableCell>
                  <TableCell className="font-mono tabular-nums">{b.totalDefects}</TableCell>
                  <TableCell className="font-mono tabular-nums">{b.avgWidthMm} mm</TableCell>
                  <TableCell className="font-mono font-semibold tabular-nums">{b.maxWidthMm} mm</TableCell>
                  <TableCell className="font-mono tabular-nums">{b.rollingMaxWidthMm} mm</TableCell>
                  <TableCell className="font-mono tabular-nums">{b.avgVibrationG} g</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 5. Scala-Based Analysis Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calculator className="h-4 w-4 text-emerald-500" />
              <span>5. Scala-Based Analysis Output</span>
            </span>
            <div className="flex gap-2">
              <Badge variant="info" className="font-mono">
                Pearson r(Vib, Width) = {s5.vibrationCrackCorrelation}
              </Badge>
              <Badge variant="warning" className="font-mono">
                Risk Score: {s5.severityWeightedRiskScore}/100
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Pure immutable Scala {s5.scalaVersion} typed reductions, RMS norms, correlation, and percentile quantiles ({s5.recordsAnalyzed} inspections, {s5.defectRecordsAnalyzed} defects).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Mean</TableHead>
                <TableHead>RMS</TableHead>
                <TableHead>P50 (Median)</TableHead>
                <TableHead>P95</TableHead>
                <TableHead>P99</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s5.distributions.map((d) => (
                <TableRow key={d.metric}>
                  <TableCell className="font-medium">{d.metric}</TableCell>
                  <TableCell className="font-mono tabular-nums">{d.mean}</TableCell>
                  <TableCell className="font-mono tabular-nums">{d.rms}</TableCell>
                  <TableCell className="font-mono tabular-nums">{d.p50}</TableCell>
                  <TableCell className="font-mono tabular-nums">{d.p95}</TableCell>
                  <TableCell className="font-mono tabular-nums">{d.p99}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 6. Building Health Classification Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-red-500" />
              <span>6. Building Health Classification Output</span>
            </span>
            <div className="flex gap-1.5">
              {Object.entries(s6.gradeCounts || {}).map(([g, cnt]) => (
                <Badge key={g} variant={gradeVariant(g)} className="font-mono">
                  {g}: {cnt}
                </Badge>
              ))}
            </div>
          </CardTitle>
          <CardDescription>Scala pattern matching classification against ACI 224R aperture limits and SHI health grades.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Building</TableHead>
                <TableHead>Mean SHI</TableHead>
                <TableHead>RUL</TableHead>
                <TableHead>Max Crack</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Primary Risk Driver</TableHead>
                <TableHead>Recommended Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s6.classifications.map((c) => (
                <TableRow key={c.buildingId}>
                  <TableCell className="font-medium">{c.buildingName}</TableCell>
                  <TableCell className="font-mono tabular-nums">{c.meanShi}</TableCell>
                  <TableCell className="font-mono tabular-nums">{c.estimatedRulYears} yrs</TableCell>
                  <TableCell className="font-mono tabular-nums">{c.maxCrackWidthMm} mm</TableCell>
                  <TableCell>
                    <Badge variant={gradeVariant(c.grade)}>{c.grade} ({c.healthStatus})</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">{c.primaryRiskDriver}</TableCell>
                  <TableCell className="text-xs">{c.recommendedAction}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 7. Final Result Generation Output */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>7. Final Result Generation Output</span>
            </span>
            <Badge variant={s7.criticalBuildingsCount > 0 ? 'destructive' : 'success'}>
              {s7.overallFleetStatus}
            </Badge>
          </CardTitle>
          <CardDescription>Consolidated structural assessment outcome and engineering action priority.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Buildings Evaluated</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{s7.totalBuildingsEvaluated}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Fleet Mean SHI</div>
              <div className="mt-1 font-mono text-xl font-semibold tabular-nums">{s7.fleetAverageShi} / 100</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Minimum Fleet RUL</div>
              <div className="mt-1 font-mono text-xl font-semibold text-red-500 tabular-nums">{s7.fleetMinRulYears} yrs</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-[10px] uppercase text-muted-foreground">Priority Building</div>
              <div className="mt-1 text-sm font-semibold">{s7.priorityBuilding}</div>
            </div>
          </div>

          <Alert variant={s7.criticalBuildingsCount > 0 ? 'destructive' : 'success'}>
            <AlertTitle>Executive Summary</AlertTitle>
            <AlertDescription>{s7.executiveSummary}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

