import React, { useState } from 'react';
import {
  Alert,
  Badge,
  BarChart,
  Button,
  Card,
  Checkbox,
  DataTable,
  Divider,
  EmptyState,
  Input,
  Kbd,
  LevelMeter,
  LineChart,
  Metric,
  Modal,
  PageHeader,
  Progress,
  RadialGauge,
  Reveal,
  SectionHeader,
  SegmentedControl,
  Select,
  Skeleton,
  Sparkline,
  Stat,
  Switch,
  Tabs,
  Textarea,
  Tooltip,
  useTheme,
  useToast,
} from '../ui';
import {
  IconActivity,
  IconAlert,
  IconArrowLeft,
  IconBattery,
  IconCheck,
  IconClock,
  IconCompass,
  IconCpu,
  IconCrosshair,
  IconDroplet,
  IconFileText,
  IconGrid,
  IconLayers,
  IconMoon,
  IconRefresh,
  IconRover,
  IconShieldCheck,
  IconSliders,
  IconSun,
  IconThermometer,
  IconWifi,
} from '../components/UI/Icons';
import './UiKit.css';

const healthSeries = [
  { x: 'Cycle -4', y: 91.2, lower: 89.5, upper: 93.1 },
  { x: 'Cycle -3', y: 88.6, lower: 86.8, upper: 90.7 },
  { x: 'Cycle -2', y: 85.1, lower: 82.9, upper: 87.6 },
  { x: 'Cycle -1', y: 79.8, lower: 76.9, upper: 82.8 },
  { x: 'Current', y: 76.4, lower: 72.6, upper: 80.1 },
  { x: '+1 Yr', y: 71.9, lower: 67.2, upper: 76.8 },
  { x: '+2 Yr', y: 67.1, lower: 61.4, upper: 73.2 },
  { x: '+3 Yr', y: 61.8, lower: 55.1, upper: 68.9 },
];

const forecastSeries = [
  { x: 'Current', y: 76.4, lower: 74.6, upper: 78.2 },
  { x: '+1 Yr', y: 72.1, lower: 69.4, upper: 75.0 },
  { x: '+2 Yr', y: 67.6, lower: 64.0, upper: 71.5 },
  { x: '+3 Yr', y: 62.8, lower: 58.4, upper: 67.5 },
  { x: '+4 Yr', y: 57.7, lower: 52.6, upper: 63.1 },
  { x: '+5 Yr', y: 52.3, lower: 46.5, upper: 58.4 },
];

const defectRows = [
  { id: 1, code: 'CRK-001', severity: 'HIGH', length: 184.2, width: 1.42, confidence: 98.4, aci: false },
  { id: 2, code: 'CRK-002', severity: 'MODERATE', length: 92.8, width: 0.72, confidence: 96.1, aci: false },
  { id: 3, code: 'CRK-003', severity: 'LOW', length: 34.1, width: 0.28, confidence: 94.8, aci: true },
  { id: 4, code: 'CRK-004', severity: 'CRITICAL', length: 312.6, width: 4.8, confidence: 99.2, aci: false },
];

const severityVariant = {
  LOW: 'info',
  MODERATE: 'warning',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export function UiKit() {
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [tab, setTab] = useState('overview');
  const [density, setDensity] = useState('comfortable');
  const [modalOpen, setModalOpen] = useState(false);
  const [checked, setChecked] = useState(true);
  const [liveMode, setLiveMode] = useState(true);
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [notes, setNotes] = useState('');

  const filteredRows = defectRows.filter((row) => {
    const matchesQuery = !query || row.code.toLowerCase().includes(query.toLowerCase());
    const matchesSeverity = severity === 'all' || row.severity === severity;
    return matchesQuery && matchesSeverity;
  });

  return (
    <div className="ui-app uikit">
      <header className="uikit__topbar">
        <div className="uikit__topbar-inner">
          <a className="uikit__back" href="#/">
            <IconArrowLeft size={14} />
            <span>Back to dashboard</span>
          </a>
          <div className="uikit__topbar-actions">
            <Badge variant="accent" dot>Agile UI v1.0</Badge>
            <Tooltip label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
              <button type="button" className="ui-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'dark' ? <IconSun size={15} /> : <IconMoon size={15} />}
              </button>
            </Tooltip>
            <Button
              size="sm"
              variant="secondary"
              icon={<IconRefresh size={13} />}
              onClick={() => toast.success('Design tokens synchronized', { title: 'Agile UI' })}
            >
              Test toast
            </Button>
          </div>
        </div>
      </header>

      <main className="ui-main">
        <PageHeader
          className="ui-animate-rise"
          eyebrow={
            <>
              <span className="ui-live-dot" style={{ color: 'var(--accent-cyan)' }} />
              Design system · foundations · components · data viz
            </>
          }
          title="Agile UI"
          description="A token-driven interface library built for the Autonomous Structural Health platform. Every component is theme-aware, accessible, dependency-free, and composed from the same semantic layer."
          actions={
            <>
              <Button variant="outline" size="sm" icon={<IconGrid size={14} />} onClick={() => setTab('components')}>
                Explore components
              </Button>
              <Button variant="primary" size="sm" icon={<IconRover size={14} />} onClick={() => setModalOpen(true)}>
                Open dialog
              </Button>
            </>
          }
        />

        <Reveal delay={80}>
          <div className="uikit__hero-grid">
            <Card variant="accent" className="uikit__hero-card">
            <div className="uikit__hero-copy">
              <Badge variant="info" dot>Semantic tokens</Badge>
              <h2>One language for every surface.</h2>
              <p>
                Dark cockpit and light editorial themes share the same component API. Swap a token,
                not a component. Every chart, badge, control, and surface follows.
              </p>
              <div className="uikit__hero-actions">
                <Button variant="primary" icon={<IconCheck size={14} />} onClick={() => toast.success('Primary action fired')}>
                  Primary action
                </Button>
                <Button variant="secondary" icon={<IconSliders size={14} />} onClick={() => toast.info('Secondary action fired')}>
                  Secondary action
                </Button>
              </div>
            </div>
            <div className="uikit__hero-visual">
              <RadialGauge value={76.4} size={168} label="SHI" sublabel="OUT OF 100" />
              <div className="uikit__hero-visual-footer">
                <span>Live theme</span>
                <strong>{theme === 'dark' ? 'Dark cockpit' : 'Light editorial'}</strong>
              </div>
            </div>
          </Card>

          <div className="uikit__hero-side">
            <Stat
              label="Structural Health"
              value="76.4"
              unit="/ 100 SHI"
              tone="warning"
              icon={<IconActivity size={15} />}
              hint="Moderate classification · aperture penalty applied"
              footer={<><span>Baseline</span><strong>82.0 pts</strong></>}
            />
            <Stat
              label="Prognosis Horizon"
              value="14.5"
              unit="years"
              tone="info"
              icon={<IconClock size={15} />}
              hint="Remaining useful life under current degradation"
              footer={<><span>Risk</span><strong>Moderate</strong></>}
            />
          </div>
          </div>
        </Reveal>

        <Reveal>
          <SectionHeader
            eyebrow="01 · Foundations"
          title="Tokens, type, and spacing"
          description="Primitive values are composed into semantic tokens. Components never hardcode a color, radius, or duration."
        />

        <div className="uikit__foundation-grid">
          <Card title="Semantic color" subtitle="Surface, border, text, and accent roles">
            <div className="uikit__swatches">
              {[
                ['Canvas', 'var(--canvas)'],
                ['Surface', 'var(--surface)'],
                ['Surface alt', 'var(--surface-alt)'],
                ['Surface raised', 'var(--surface-raised)'],
                ['Border', 'var(--border)'],
                ['Text primary', 'var(--text-primary)'],
                ['Accent cyan', 'var(--accent-cyan)'],
                ['Accent teal', 'var(--accent-primary)'],
                ['Accent sky', 'var(--accent-secondary)'],
                ['Emerald', 'var(--accent-emerald)'],
                ['Amber', 'var(--accent-amber)'],
                ['Red', 'var(--accent-red)'],
              ].map(([name, value]) => (
                <div className="uikit__swatch" key={name}>
                  <span className="uikit__swatch-chip" style={{ background: value }} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Type scale" subtitle="Display, body, and telemetry mono">
            <div className="uikit__type-scale">
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.035em' }}>Display 34 / Structural health</div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em' }}>Heading 22 / Prognosis horizon</div>
              <div style={{ fontSize: 16, fontWeight: 650 }}>Title 16 / Live inspection console</div>
              <div style={{ fontSize: 13 }}>Body 13 / Multi-parameter normalized integrity model.</div>
              <div className="ui-mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Mono 12 / SHI 76.4 · RSSI -58 dBm · 2.50 px/mm</div>
            </div>
            <Divider />
            <div className="uikit__spacing-row">
              {[4, 8, 12, 16, 24, 32].map((size) => (
                <div key={size} className="uikit__spacing-item">
                  <span style={{ width: size, height: size }} />
                  <small>{size}</small>
                </div>
              ))}
            </div>
          </Card>
          </div>
        </Reveal>

        <SectionHeader
          eyebrow="02 · Actions"
          title="Buttons and badges"
          description="Five semantic variants, four sizes, loading and icon-only states. Badges carry status without stealing focus."
        />

        <Card title="Button matrix" subtitle="Variants, sizes, and interaction states">
          <div className="uikit__stack">
            <div className="uikit__row-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="cyan">Cyan</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
            <div className="uikit__row-wrap">
              <Button size="xs" variant="primary">Extra small</Button>
              <Button size="sm" variant="primary">Small</Button>
              <Button size="md" variant="primary">Medium</Button>
              <Button size="lg" variant="primary">Large</Button>
            </div>
            <div className="uikit__row-wrap">
              <Button loading>Loading</Button>
              <Button disabled>Disabled</Button>
              <Button variant="secondary" icon={<IconRefresh size={14} />}>With icon</Button>
              <Button variant="outline" icon={<IconFileText size={14} />} iconRight={<IconCheck size={14} />}>Both sides</Button>
              <Tooltip label="Icon-only action">
                <Button variant="secondary" iconOnly icon={<IconSliders size={15} />} aria-label="Settings" />
              </Tooltip>
            </div>
            <div className="uikit__row-wrap">
              <Badge variant="neutral">Neutral</Badge>
              <Badge variant="success" dot>Healthy</Badge>
              <Badge variant="warning" dot>Moderate</Badge>
              <Badge variant="danger" dot pulse>Critical</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="accent">Accent</Badge>
              <Badge variant="purple">Purple</Badge>
            </div>
          </div>
        </Card>

        <SectionHeader
          eyebrow="03 · Input"
          title="Forms and controls"
          description="Accessible labels, hint text, validation states, and a native-feeling switch."
        />

        <div className="uikit__two-col">
          <Card title="Field primitives" subtitle="Input, select, and textarea">
            <div className="uikit__stack">
              <Input label="Defect code" placeholder="CRK-001" value={query} onChange={(event) => setQuery(event.target.value)} hint="Search the defect register" />
              <Input label="Standoff distance" type="number" defaultValue={250} suffix="mm" helperText="Nominal calibration is 250 mm" />
              <Input label="Operator ID" defaultValue="inspector" error="This operator is not certified for this asset." />
              <Select label="Severity filter" value={severity} onChange={(event) => setSeverity(event.target.value)} options={[
                { value: 'all', label: 'All severities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MODERATE', label: 'Moderate' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' },
              ]} />
              <Textarea label="Inspection notes" placeholder="Describe the observed crack pattern..." value={notes} onChange={(event) => setNotes(event.target.value)} />
            </div>
          </Card>

          <Card title="Selection" subtitle="Checkbox, switch, and segmented control">
            <div className="uikit__stack">
              <Checkbox label="Include acknowledged alerts" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
              <Checkbox label="Auto-acknowledge low severity" />
              <Switch label="Live telemetry polling" checked={liveMode} onChange={(event) => setLiveMode(event.target.checked)} />
              <Switch label="Acoustic feedback" />
              <Divider />
              <div>
                <div className="uikit__label">Density</div>
                <SegmentedControl
                  value={density}
                  onChange={setDensity}
                  items={[
                    { id: 'compact', label: 'Compact' },
                    { id: 'comfortable', label: 'Comfortable' },
                    { id: 'spacious', label: 'Spacious' },
                  ]}
                />
              </div>
              <div>
                <div className="uikit__label">Module</div>
                <Tabs
                  value={tab}
                  onChange={setTab}
                  items={[
                    { id: 'overview', label: 'Overview', icon: <IconGrid size={13} /> },
                    { id: 'components', label: 'Components', icon: <IconLayers size={13} /> },
                    { id: 'alerts', label: 'Alerts', icon: <IconAlert size={13} />, badge: 3 },
                  ]}
                />
              </div>
              <div className="uikit__row-wrap">
                <Kbd>⌘</Kbd><Kbd>K</Kbd>
                <span className="ui-muted ui-text-xs">Command palette</span>
              </div>
            </div>
          </Card>
        </div>

        <SectionHeader
          eyebrow="04 · Surfaces"
          title="Cards, stats, and progress"
          description="Composable containers with a consistent header/body/footer rhythm. Metrics get their own stat and tile primitives."
        />

        <div className="uikit__stat-grid">
          <Stat label="Battery reserve" value="94.5" unit="%" tone="success" icon={<IconBattery size={15} />} hint="Nominal power cell" footer={<><span>RSSI</span><strong>-58 dBm</strong></>} />
          <Stat label="Crack metrology" value="1.42" unit="mm" tone="danger" icon={<IconCrosshair size={15} />} hint="Peak aperture · ACI limit 0.30 mm" footer={<><span>Severity</span><strong>High</strong></>} />
          <Stat label="RUL prognosis" value="14.5" unit="years" tone="info" icon={<IconClock size={15} />} hint="Until structural threshold" footer={<><span>Trend</span><strong>Increasing</strong></>} />
          <Stat label="Carrier signal" value="-58" unit="dBm" tone="default" icon={<IconWifi size={15} />} hint="Wi-Fi 802.11n · low latency" footer={<><span>Link</span><strong>Stable</strong></>} />
        </div>

        <div className="uikit__two-col">
          <Card title="Progress & meters" subtitle="Linear and discrete indicators">
            <div className="uikit__stack">
              <Progress label="Structural health index" value={76.4} valueText="76.4 / 100" variant="warning" />
              <Progress label="Crack penalty allocation" value={38} max={50} valueText="38 / 50 pts" variant="danger" />
              <Progress label="Data completeness" value={92} variant="success" size="sm" />
              <div className="uikit__row-wrap">
                <LevelMeter value={88} />
                <LevelMeter value={62} tone="warning" />
                <LevelMeter value={22} tone="danger" />
                <span className="ui-muted ui-text-xs">Signal strength</span>
              </div>
            </div>
          </Card>

          <Card title="Metric tiles" subtitle="Compact telemetry for dense consoles">
            <div className="uikit__metric-grid">
              <Metric label="Ambient temp" value="27.2" unit="°C" icon={<IconThermometer size={13} />} hint="Steady" />
              <Metric label="Humidity" value="58.0" unit="%" icon={<IconDroplet size={13} />} hint="Nominal" />
              <Metric label="Crawler tilt" value="1.4" unit="°" icon={<IconCompass size={13} />} hint="Level" />
              <Metric label="Vibration RMS" value="0.11" unit="g" icon={<IconActivity size={13} />} hint="Low" />
            </div>
          </Card>
        </div>

        <SectionHeader
          eyebrow="05 · Data"
          title="Tables and empty states"
          description="A responsive, border-collapsed table with numeric alignment and composable cell renderers."
        />

        <Card
          title="Defect register"
          subtitle="Filterable inspection records"
          actions={<Badge variant="neutral">{filteredRows.length} records</Badge>}
        >
          <DataTable
            dense={density === 'compact'}
            columns={[
              { key: 'code', header: 'Defect', render: (row) => <span className="ui-mono">{row.code}</span> },
              { key: 'severity', header: 'Severity', render: (row) => <Badge size="sm" variant={severityVariant[row.severity]}>{row.severity}</Badge> },
              { key: 'length', header: 'Length', align: 'right', numeric: true, render: (row) => `${row.length.toFixed(1)} mm` },
              { key: 'width', header: 'Aperture', align: 'right', numeric: true, render: (row) => `${row.width.toFixed(2)} mm` },
              { key: 'confidence', header: 'Confidence', align: 'right', numeric: true, render: (row) => `${row.confidence.toFixed(1)}%` },
              { key: 'aci', header: 'ACI 224R', render: (row) => <Badge size="sm" variant={row.aci ? 'success' : 'danger'}>{row.aci ? 'Pass' : 'Exceeded'}</Badge> },
            ]}
            data={filteredRows}
            empty="No defects match the current filters."
          />
          {filteredRows.length === 0 && (
            <EmptyState
              icon={<IconShieldCheck size={20} />}
              title="Register clear"
              description="Adjust the search or severity filter to bring records back into view."
              action={<Button size="sm" variant="secondary" onClick={() => { setQuery(''); setSeverity('all'); }}>Reset filters</Button>}
            />
          )}
        </Card>

        <SectionHeader
          eyebrow="06 · Feedback"
          title="Alerts, toasts, and skeletons"
          description="Status messaging for every urgency level, plus loading primitives that preserve layout."
        />

        <div className="uikit__two-col">
          <Card title="Inline alerts" subtitle="Persistent context for the current view">
            <div className="uikit__stack">
              <Alert variant="success" title="Inspection completed">4 defects registered and the SHI model has been updated.</Alert>
              <Alert variant="warning" title="Aperture threshold exceeded">Peak crack width is 1.42 mm, above the ACI 224R external limit.</Alert>
              <Alert variant="danger" title="Serviceability limit">Projected SHI crosses the critical horizon within 5 years.</Alert>
              <Alert variant="info" title="Telemetry stream online">Polling the rover at 3-second intervals.</Alert>
            </div>
          </Card>

          <Card title="Toasts & loading" subtitle="Transient feedback and skeletons">
            <div className="uikit__stack">
              <div className="uikit__row-wrap">
                <Button size="sm" variant="success" onClick={() => toast.success('Dossier certified and ready to download')}>Success</Button>
                <Button size="sm" variant="secondary" onClick={() => toast.info('Live telemetry synchronized')}>Info</Button>
                <Button size="sm" variant="secondary" onClick={() => toast.warning('Crack aperture above advisory limit')}>Warning</Button>
                <Button size="sm" variant="danger" onClick={() => toast.error('Rover link lost · reconnecting')}>Error</Button>
              </div>
              <Divider />
              <div className="uikit__stack" style={{ gap: 10 }}>
                <Skeleton width="42%" height={10} />
                <Skeleton width="100%" height={10} />
                <Skeleton width="76%" height={10} />
                <div className="uikit__row" style={{ gap: 10 }}>
                  <Skeleton width={34} height={34} circle />
                  <div style={{ flex: 1, display: 'grid', gap: 7 }}>
                    <Skeleton width="52%" height={9} />
                    <Skeleton width="84%" height={9} />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <SectionHeader
          eyebrow="07 · Visualization"
          title="Charts that follow the theme"
          description="Tokenized SVG chart primitives with crosshair inspection, confidence bands, thresholds, gauges, and sparklines."
        />

        <Card
          title="Structural health trajectory"
          subtitle="Historical and forecast series with ±95% confidence envelope"
          tag={<Badge variant="info">LineChart</Badge>}
        >
          <LineChart
            data={forecastSeries}
            height={250}
            yDomain={[0, 100]}
            yTicks={[0, 20, 40, 60, 80, 100]}
            band={{ lowerKey: 'lower', upperKey: 'upper', color: 'var(--chart-info)' }}
            thresholds={[
              { value: 80, label: '80 baseline', color: 'var(--chart-good)' },
              { value: 50, label: '50 serviceability', color: 'var(--chart-bad)' },
            ]}
            yLabel="SHI (PTS)"
            xLabel="PROGNOSIS HORIZON"
            valueSuffix=" SHI"
            ariaLabel="Structural health forecast"
          />
          <div className="uikit__row-wrap" style={{ marginTop: 12 }}>
            <Badge variant="success" dot>Healthy ≥ 80</Badge>
            <Badge variant="warning" dot>Moderate 50–79</Badge>
            <Badge variant="danger" dot>Critical &lt; 50</Badge>
            <span className="ui-muted ui-text-xs">Hover the plot to scrub values.</span>
          </div>
        </Card>

        <div className="uikit__chart-grid">
          <Card title="History" subtitle="Sparkline" tag={<Badge variant="neutral">Sparkline</Badge>}>
            <div className="uikit__sparkline-stack">
              <div>
                <div className="uikit__label">SHI progression</div>
                <Sparkline data={healthSeries.map((point) => point.y)} color="var(--chart-good)" height={44} />
              </div>
              <div>
                <div className="uikit__label">Aperture trend</div>
                <Sparkline data={[0.18, 0.24, 0.31, 0.42, 0.58, 0.71, 0.86, 1.02, 1.42]} color="var(--chart-bad)" height={44} />
              </div>
            </div>
          </Card>

          <Card title="Defect distribution" subtitle="Bar chart" tag={<Badge variant="neutral">BarChart</Badge>}>
            <BarChart
              data={[
                { label: 'Low', value: 12 },
                { label: 'Moderate', value: 8 },
                { label: 'High', value: 5 },
                { label: 'Critical', value: 2 },
              ]}
              height={150}
              formatValue={(value) => value}
              ariaLabel="Defect severity distribution"
            />
          </Card>

          <Card title="Health gauge" subtitle="Radial gauge" tag={<Badge variant="neutral">RadialGauge</Badge>}>
            <div className="uikit__gauge-row">
              <RadialGauge value={76.4} size={140} label="SHI" sublabel="MODERATE" />
              <RadialGauge value={94.5} size={112} tone="success" label="BATTERY" sublabel="RESERVE" />
            </div>
          </Card>
        </div>

        <SectionHeader
          eyebrow="08 · Overlays"
          title="Dialogs and tooltips"
          description="Portal-based modals with backdrop dismissal and Escape handling; tooltips that work on hover and focus."
        />

        <Card title="Overlay triggers" subtitle="Modal and tooltip behavior">
          <div className="uikit__row-wrap">
            <Button variant="primary" onClick={() => setModalOpen(true)}>Open inspection dialog</Button>
            <Tooltip label="Opens a certified PDF dossier" position="bottom">
              <Button variant="secondary" icon={<IconFileText size={14} />}>Hover me</Button>
            </Tooltip>
            <Tooltip label="Model version 2.4.0" position="right">
              <Button variant="outline" icon={<IconCpu size={14} />}>Tooltip right</Button>
            </Tooltip>
          </div>
        </Card>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Start autonomous inspection"
          description="Confirm the target facade and rover link before dispatch."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={() => { setModalOpen(false); toast.success('Inspection dispatched', { title: 'Rover ROVER-01' }); }}>
                Dispatch rover
              </Button>
            </>
          }
        >
          <div className="uikit__stack">
            <Select label="Target facade" defaultValue="north" options={[
              { value: 'north', label: 'WALL-NORTH-01 · North Bearing Facade' },
              { value: 'nw', label: 'WALL-NW-04 · Northwest Bearing Pier' },
            ]} />
            <Input label="Rover code" defaultValue="ROVER-01" />
            <Alert variant="info" title="Hardware-in-the-loop">
              The rover will capture frames at 250 mm standoff and stream them to the ML vision ensemble.
            </Alert>
          </div>
        </Modal>

        <footer className="uikit__footer">
          <div className="uikit__footer-brand">
            <span className="ui-nav__mark" style={{ width: 28, height: 28, borderRadius: 8 }}><IconRover size={15} /></span>
            <div>
              <strong>Agile UI</strong>
              <span>Token-driven component library for structural intelligence.</span>
            </div>
          </div>
          <div className="uikit__footer-meta">
            <Badge variant="neutral">React 19</Badge>
            <Badge variant="neutral">Zero runtime dependencies</Badge>
            <Badge variant="neutral">WCAG-aware</Badge>
          </div>
        </footer>
      </main>
    </div>
  );
}
