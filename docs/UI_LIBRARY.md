# Agile UI — Component & Token Library

Agile UI is the in-repo interface library for the Autonomous Structural Health platform. It is intentionally **dependency-free**: plain React components, CSS custom properties, and CSS classes. No Tailwind, no CSS-in-JS runtime, no component package to install.

The library lives in `frontend/src/ui/` and is showcased at **`#/ui-kit`**.

---

## 1. Design principles

1. **Tokens over literals** — every surface, border, text tone, chart colour, radius, shadow, and motion value comes from a semantic token.
2. **Two themes, one API** — dark cockpit and light editorial themes share the same components.
3. **Engineering density** — compact controls, tabular numerals, monospaced telemetry, restrained motion.
4. **Accessible by default** — visible focus rings, semantic roles, labelled dialogs, live-region toasts, reduced-motion support.
5. **Backward compatible** — legacy imports from `components/UI/Components.jsx` continue to work through a facade.

---

## 2. File map

```
frontend/src/ui/
├── index.js                  # public barrel
├── styles/
│   ├── tokens.css            # primitive + semantic tokens, dark/light themes
│   ├── base.css              # reset, app shell, layout, responsive, motion
│   ├── components.css        # primitives and component states
│   ├── charts.css            # chart frames, axes, gauges, bars
│   └── index.css             # style entry point
├── components/
│   ├── Button.jsx            # Button, Spinner
│   ├── Card.jsx              # Card, CardHeader, CardBody, CardFooter
│   ├── Badge.jsx
│   ├── Field.jsx             # Input, Select, Textarea
│   ├── Toggle.jsx            # Checkbox, Switch
│   ├── Modal.jsx
│   ├── Tabs.jsx              # Tabs, SegmentedControl
│   ├── DataTable.jsx
│   ├── Progress.jsx
│   ├── Tooltip.jsx
│   ├── Skeleton.jsx          # Skeleton, SkeletonText
│   ├── EmptyState.jsx
│   ├── Stat.jsx
│   ├── SectionHeader.jsx     # SectionHeader, PageHeader
│   ├── Alert.jsx
│   └── Misc.jsx              # Kbd, Avatar, Divider, Chip, Metric
├── charts/
│   ├── path.js               # spline, area, band, tick helpers
│   ├── Sparkline.jsx
│   ├── LineChart.jsx
│   ├── BarChart.jsx
│   ├── RadialGauge.jsx
│   └── LevelMeter.jsx
├── theme/
│   ├── ThemeProvider.jsx     # provider component
│   └── ThemeContext.js       # context, storage key, useTheme
├── feedback/
│   ├── ToastProvider.jsx     # provider + toast viewport
│   └── ToastContext.js       # context, notify, useToast
└── utils/
    ├── cx.js
    └── useAnimatedNumber.js
```

---

## 3. Importing

```jsx
import {
  Button,
  Card,
  Badge,
  Input,
  Modal,
  Tabs,
  DataTable,
  LineChart,
  RadialGauge,
  useToast,
  useTheme,
} from '../ui';
```

From `frontend/src/components/UI/Components.jsx`, legacy imports still resolve:

```jsx
import { Card, Button, Badge, Modal, Input, FauxWindowHeader } from './UI/Components';
```

That file is now a compatibility facade over the new library.

---

## 4. Theme setup

`ThemeProvider` is mounted in `frontend/src/App.jsx`:

```jsx
<ThemeProvider>
  <ToastProvider>
    <AuthProvider>
      {/* routes */}
    </AuthProvider>
  </ToastProvider>
</ThemeProvider>
```

It:

- Reads `rover_ui_theme` from `localStorage`.
- Falls back to `prefers-color-scheme`.
- Sets `data-theme="dark" | "light"` on `<html>`.
- Sets `color-scheme` so native controls match.

```jsx
const { theme, setTheme, toggleTheme } = useTheme();
```

CSS is imported in this order so the library wins over legacy globals:

```js
import './index.css';
import './ui/styles/index.css';
```

---

## 5. Token layers

Tokens are defined in `styles/tokens.css` in three layers:

### Primitive

Raw palette values such as `--ui-slate-900`, `--ui-cyan-500`, `--ui-emerald-400`.

### Semantic

Theme-aware roles:

| Group | Examples |
| --- | --- |
| Canvas / surface | `--canvas`, `--canvas-elevated`, `--surface`, `--surface-alt`, `--surface-raised`, `--surface-hover` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse`, `--text-on-accent` |
| Borders | `--border`, `--border-subtle`, `--border-strong`, `--border-focus` |
| Accents | `--accent-primary`, `--accent-cyan`, `--accent-emerald`, `--accent-amber`, `--accent-red`, `--accent-violet` |
| Pastels | `--pastel-red-bg/text/border`, `--pastel-green-*`, `--pastel-yellow-*`, `--pastel-blue-*` |
| Charts | `--chart-accent`, `--chart-info`, `--chart-good`, `--chart-warn`, `--chart-bad`, `--chart-grid`, `--chart-axis`, `--chart-label`, `--chart-tooltip-bg` |
| Spacing | `--space-1` … `--space-12` |
| Radius | `--radius-xs`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-pill` |
| Typography | `--font-sans`, `--font-display`, `--font-mono`, `--text-2xs` … `--text-3xl` |
| Motion | `--duration-fast`, `--duration-base`, `--duration-slow`, `--ease-out`, `--ease-spring` |

### Legacy aliases

The token file also defines aliases used by older panels (`--border-subtle`, `--pastel-orange`, `--pastel-purple`, `--pastel-red`, `--primary`, etc.) so previously undefined variables now resolve in both themes.

---

## 6. Component reference

### Button

```jsx
<Button variant="primary" size="md" icon={<IconRefresh />} loading={syncing}>
  Sync
</Button>
```

- `variant`: `primary`, `secondary`, `outline`, `ghost`, `danger`, `success`
- `size`: `sm`, `md`, `lg`
- `loading`, `disabled`, `icon`, `iconRight`, `iconOnly`, `fullWidth`
- Forwards refs and native button props.

`Spinner` is exported for standalone loading states.

### Card

```jsx
<Card
  title="Structural Health"
  subtitle="Normalized index"
  tag={<Badge variant="success">Healthy</Badge>}
  actions={<Button size="sm" variant="ghost">Details</Button>}
>
  …
</Card>
```

- `title`, `subtitle`, `tag`, `actions`
- `variant`: `default`, `flat`, `elevated`, `glass`, `accent`
- `padding`: `none`, `sm`, `md`, `lg`
- `interactive`, `as`, `className`, `style`
- Composable `Card.Header`, `Card.Body`, `Card.Footer`.

### Badge

```jsx
<Badge variant="danger" size="sm" dot pulse>Critical</Badge>
```

Variants: `neutral`, `info`, `success`, `warning`, `danger`, `accent`.

### Input / Select / Textarea

```jsx
<Input
  label="Standoff distance"
  type="number"
  value={distance}
  onChange={(event) => setDistance(event.target.value)}
  hint="Millimetres from the wall surface"
  error={error}
  required
/>
```

- `label`, `hint`/`helperText`, `error`, `required`
- `icon`, `prefix`, `suffix` on Input
- `options` on Select (`string[]` or `{ value, label, disabled }[]`)
- `containerStyle` styles the field wrapper; `style` styles the native control.

### Checkbox / Switch

```jsx
<Checkbox label="Show unacknowledged only" checked={filter} onChange={…} />
<Switch label="Acoustic feedback" checked={sound} onChange={…} />
```

Both accept native checkbox props.

### Modal

```jsx
<Modal
  isOpen={open}
  onClose={() => setOpen(false)}
  title="Predict wall crack by photo"
  description="Upload a concrete surface image."
  footer={<Button onClick={save}>Run model</Button>}
  maxWidth="720px"
>
  …
</Modal>
```

Closes on Escape and optional backdrop click; locks body scroll; renders in a portal.

### Tabs / SegmentedControl

```jsx
<Tabs
  items={[{ id: 'inspection', label: 'Live Inspection', icon: <IconRover /> }]}
  value={activeTab}
  onChange={setActiveTab}
/>

<SegmentedControl
  label="Rate"
  value={pollingRate}
  onChange={setPollingRate}
  items={[{ id: 1000, label: '1s' }, { id: 0, label: 'Pause' }]}
/>
```

### DataTable

```jsx
<DataTable
  columns={[
    { key: 'id', header: 'ID', width: 64 },
    { key: 'width', header: 'Aperture', numeric: true, render: (row) => `${row.width} mm` },
  ]}
  data={defects}
  rowKey={(row) => row.id}
  onRowClick={selectDefect}
  empty="No defects detected."
  dense
/>
```

Column shape: `{ key, header, width, align, numeric, render }`.

### Progress

```jsx
<Progress value={82} max={100} tone="success" label="Structural Health Index" showValue />
```

### Tooltip

```jsx
<Tooltip label="Switch theme" position="bottom">
  <button className="ui-icon-btn">…</button>
</Tooltip>
```

Positions: `top`, `bottom`, `left`, `right`.

### Skeleton / SkeletonText

```jsx
<Skeleton width="60%" height={18} />
<SkeletonText lines={3} />
```

### EmptyState

```jsx
<EmptyState
  icon={<IconCheckCircle />}
  title="All thresholds nominal"
  description="No unresolved alerts are pending."
  action={<Button size="sm">Refresh</Button>}
/>
```

### Stat / Metric

```jsx
<Stat label="SHI" value="82.0" unit="/ 100" trend="+1.2" trendTone="success" />
<Metric label="Battery" value="95" unit="%" hint="Nominal power cell" />
```

### SectionHeader / PageHeader

```jsx
<PageHeader
  eyebrow="Autonomous crawler active"
  title="Structural Health & Crack Metrology"
  description="C35/40 concrete · 2.50 px/mm calibration"
  actions={<Button>Sync</Button>}
/>
```

### Alert

```jsx
<Alert variant="success" title="New inspection synced">
  SHI updated to 82.0 points.
</Alert>
```

Variants: `info`, `success`, `warning`, `danger`.

### Misc

- `Kbd` — keyboard hints.
- `Avatar` — initials or image.
- `Divider` — horizontal rule.
- `Chip` — compact filter/tag control.
- `Metric` — label/value tile.

---

## 7. Charts

### Sparkline

```jsx
<Sparkline data={[82, 81, 80, 79, 78]} width={120} height={32} tone="warning" />
```

### LineChart

```jsx
<LineChart
  data={trend.map((point) => ({ x: point.date, y: point.shi_score }))}
  height={240}
  yDomain={[40, 100]}
  thresholds={[{ value: 50, label: 'Critical', color: 'var(--chart-bad)' }]}
  formatX={(value) => value}
  formatValue={(value) => value.toFixed(0)}
  area
  showDots
  ariaLabel="SHI history"
/>
```

Supports multi-series (`series`), confidence bands (`band={{ lowerKey, upperKey, color }}`), thresholds, legends, labels, and hover tooltips.

### BarChart

```jsx
<BarChart
  data={[{ label: 'Crack', value: 10.5 }, { label: 'Age', value: 4.2 }]}
  height={160}
  formatValue={(value) => `${value} pts`}
/>
```

### RadialGauge

```jsx
<RadialGauge
  value={82}
  max={100}
  size={168}
  thickness={10}
  tone="success"
  label="SHI"
  sublabel="Healthy"
  showTicks
/>
```

Tones: `success`, `warning`, `danger`, `info`, `accent`. Auto-tone is applied when no tone is provided.

### LevelMeter

```jsx
<LevelMeter value={66} bars={3} tone="warning" />
```

Used for compact discrete level indicators.

---

## 8. Feedback and providers

### ToastProvider / useToast

```jsx
const toast = useToast();

toast.success('Alert acknowledged', { title: 'Safety register updated' });
toast.error(err.message, { title: 'Acknowledgement failed' });
toast.warning('Select a photo first.');
toast.info('Polling paused.');
```

- Maximum of four visible toasts.
- Auto-dismiss after 4.5 s by default.
- `notify.success/error/warning/info` is available outside React (event-based).

### ThemeProvider / useTheme

```jsx
const { theme, setTheme, toggleTheme } = useTheme();
```

---

## 9. Utility APIs

```js
import { cx, clamp, formatNumber, useAnimatedNumber } from '../ui';

cx('ui-btn', active && 'is-active'); // joins truthy class names
clamp(120, 0, 100);                  // 100
formatNumber(1234.5, 1);             // "1,234.5"
```

`useAnimatedNumber(value, duration, decimals)` returns a formatted string and respects `prefers-reduced-motion`.

---

## 10. Styling conventions

- Component classes use the `ui-` prefix.
- State classes use `is-*` (`is-active`, `is-invalid`, `is-open`).
- Modifiers use `ui-block--modifier` (`ui-btn--primary`, `ui-card--elevated`).
- Layout helpers: `ui-grid`, `ui-grid--auto`, `ui-stack`, `ui-row`, `ui-toolbar`, `ui-muted`, `ui-text-sm`, `ui-hide`, `ui-hide-sm`.
- Never hardcode a colour in a feature component. Use a semantic token or a chart token.
- Prefer library primitives over new inline styles. Inline styles are acceptable only for dynamic geometry or one-off data visualisation.

---

## 11. Accessibility and motion

- Buttons expose `aria-busy` while loading and are disabled during the request.
- Modal uses `role="dialog"`, `aria-modal`, Escape handling, and a labelled close button.
- Toasts use `role="status"` and `aria-live="polite"`.
- Charts expose `role="img"` with descriptive `aria-label`s.
- `:focus-visible` rings are defined globally.
- `prefers-reduced-motion` reduces animations and transitions.

---

## 12. Showcase

The UI Kit page at `frontend/src/pages/UiKit.jsx` demonstrates:

- Semantic token swatches
- Buttons, badges, form controls, toggles
- Cards, stats, progress, tables, alerts
- Sparkline, line chart, bar chart, radial gauge, level meter
- Modal and toast interactions
- Theme switching

Open it with:

```text
http://localhost:5173/#/ui-kit
```

---

## 13. Migration guide

### Replace a legacy card

Before:

```jsx
<Card title="Telemetry" subtitle="Rover" tag={<Badge variant="success">Live</Badge>}>
  <div style={{ padding: 16 }}>…</div>
</Card>
```

After:

```jsx
<Card title="Telemetry" subtitle="Rover" tag={<Badge variant="success" dot>Live</Badge>}>
  <div className="ui-stack">…</div>
</Card>
```

The compatibility facade means this migration can be incremental. New code should import from `../ui` directly.

### Replace a hardcoded colour

Before:

```jsx
<div style={{ background: '#FBFBFA', border: '1px solid #EAEAEA', color: '#111111' }}>
```

After:

```jsx
<div style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
```

### Replace a blocking alert

Before:

```js
alert('Alert acknowledgement error: ' + error.message);
```

After:

```js
const toast = useToast();
toast.error(error.message, { title: 'Acknowledgement failed' });
```
