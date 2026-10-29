/**
 * App-level token access for components that still read tokens in JS.
 * All values resolve to the CSS custom properties defined in `ui/styles/tokens.css`,
 * so they automatically follow the active light/dark theme.
 */
export const DesignTokens = {
  colors: {
    canvas: 'var(--canvas)',
    surface: 'var(--surface)',
    surfaceAlt: 'var(--surface-alt)',
    surfaceRaised: 'var(--surface-raised)',
    surfaceHover: 'var(--surface-hover)',
    border: 'var(--border)',
    borderSubtle: 'var(--border-subtle)',
    borderStrong: 'var(--border-strong)',
    borderFocus: 'var(--border-focus)',
    textPrimary: 'var(--text-primary)',
    textSecondary: 'var(--text-secondary)',
    textMuted: 'var(--text-muted)',
    textInverse: 'var(--text-inverse)',
    primary: 'var(--accent-primary)',
    secondary: 'var(--accent-secondary)',
    accentCyan: 'var(--accent-cyan)',
    accentEmerald: 'var(--accent-emerald)',
    accentAmber: 'var(--accent-amber)',
    accentRed: 'var(--accent-red)',
    pastelRed: {
      bg: 'var(--pastel-red-bg)',
      text: 'var(--pastel-red-text)',
      border: 'var(--pastel-red-border)',
    },
    pastelGreen: {
      bg: 'var(--pastel-green-bg)',
      text: 'var(--pastel-green-text)',
      border: 'var(--pastel-green-border)',
    },
    pastelYellow: {
      bg: 'var(--pastel-yellow-bg)',
      text: 'var(--pastel-yellow-text)',
      border: 'var(--pastel-yellow-border)',
    },
    pastelBlue: {
      bg: 'var(--pastel-blue-bg)',
      text: 'var(--pastel-blue-text)',
      border: 'var(--pastel-blue-border)',
    },
    pastelOrange: {
      bg: 'var(--pastel-orange-bg)',
      text: 'var(--pastel-orange-text)',
      border: 'var(--pastel-orange-border)',
    },
    pastelPurple: {
      bg: 'var(--pastel-purple-bg)',
      text: 'var(--pastel-purple-text)',
      border: 'var(--pastel-purple-border)',
    },
  },
  typography: {
    sans: 'var(--font-sans)',
    display: 'var(--font-display)',
    serif: 'var(--font-serif)',
    mono: 'var(--font-mono)',
  },
  radius: {
    xs: 'var(--radius-xs)',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    pill: 'var(--radius-pill)',
  },
  shadow: {
    subtle: 'var(--shadow-subtle)',
    hover: 'var(--shadow-hover)',
    pop: 'var(--shadow-pop)',
    glow: 'var(--shadow-glow)',
  },
  space: {
    1: 'var(--space-1)',
    2: 'var(--space-2)',
    3: 'var(--space-3)',
    4: 'var(--space-4)',
    5: 'var(--space-5)',
    6: 'var(--space-6)',
    8: 'var(--space-8)',
  },
  motion: {
    easeOut: 'var(--ease-out)',
    easeSpring: 'var(--ease-spring)',
    fast: 'var(--duration-fast)',
    base: 'var(--duration-base)',
    slow: 'var(--duration-slow)',
  },
};
