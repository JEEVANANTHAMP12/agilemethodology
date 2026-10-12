export const DesignTokens = {
  // Protocol: Premium Utilitarian Minimalism & Editorial UI
  colors: {
    // Warm Monochrome Canvas
    canvas: '#FBFBFA',          // Warm bone off-white
    surface: '#FFFFFF',         // Crisp document white
    surfaceAlt: '#F7F6F3',      // Subtle warm gray / unbleached paper
    surfaceHover: '#F4F3F0',    // Subtle hover state
    
    // Structural Dividers
    border: '#EAEAEA',          // 1px clean hairline border
    borderFocus: '#CCCCCC',     // Subtle focused hairline
    
    // Typographic Hierarchy (Never pure black)
    textPrimary: '#111111',     // Deep charcoal off-black
    textSecondary: '#787774',   // Muted editorial gray
    textMuted: '#9B9A97',       // Micro label gray
    
    // Spot Pastels (Desaturated & Wash-out, strictly for semantic badges & accents)
    pastelRed: {
      bg: '#FDEBEC',
      text: '#9F2F2D',
      border: '#F8D2D5'
    },
    pastelGreen: {
      bg: '#EDF3EC',
      text: '#346538',
      border: '#D7E5D6'
    },
    pastelYellow: {
      bg: '#FBF3DB',
      text: '#956400',
      border: '#F5E6BA'
    },
    pastelBlue: {
      bg: '#E1F3FE',
      text: '#1F6C9F',
      border: '#C7E7FD'
    },
  },
  typography: {
    sans: '"Geist Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Newsreader", "Playfair Display", "Instrument Serif", Georgia, serif',
    mono: '"Geist Mono", "SF Mono", "JetBrains Mono", "Courier New", monospace',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    pill: '9999px',
  },
  shadow: {
    subtle: '0 1px 3px rgba(0, 0, 0, 0.02)',
    hover: '0 2px 8px rgba(0, 0, 0, 0.04)',
  }
};
