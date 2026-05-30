/**
 * Domus Design Tokens
 * Single source of truth for all design decisions.
 * All values follow the 8pt grid system.
 */

// ─── Colors ──────────────────────────────────────────────────────────────────

export const colors = {
  // Backgrounds
  alabaster: "#F9F9F8",
  surface: "#FFFFFF",
  darkSurface: "#2C2621",
  darkSurfaceAlt: "#1E1A17",

  // Text
  charcoal: "#2C2621",
  stone: "#8A7E74",
  muted: "#9CA3AF",
  onDark: "#F4F4F5",
  onDarkMuted: "#A1A1AA",

  // Brand
  indigo: "#8C7662",
  indigoDark: "#5A4A3A",
  indigoLight: "#FAF7F2",
  indigoMid: "#C2A585",

  // Accent
  gold: "#C2A585",
  goldLight: "#FDF6E8",

  // Semantic
  teal: "#A88E75",
  tealLight: "#FAF5EF",
  amber: "#D97706",
  amberLight: "#FEF3C7",
  error: "#DC2626",
  errorLight: "#FEF2F2",
  success: "#16A34A",
  successLight: "#F0FDF4",

  // Borders
  hairline: "#E8E8E6",
  hairlineDark: "#27272A",
} as const;

export type Color = (typeof colors)[keyof typeof colors];

// ─── Spacing (8pt grid) ───────────────────────────────────────────────────────

export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

// ─── Typography ───────────────────────────────────────────────────────────────

export const typography = {
  fonts: {
    headline: "var(--font-plus-jakarta)",
    body: "var(--font-inter)",
  },
  scale: {
    "display-2xl": { size: "96px", weight: "800", tracking: "-0.04em", lineHeight: "1.05" },
    "display-xl": { size: "80px", weight: "800", tracking: "-0.04em", lineHeight: "1.08" },
    "display-lg": { size: "64px", weight: "800", tracking: "-0.03em", lineHeight: "1.1" },
    "display-md": { size: "56px", weight: "700", tracking: "-0.03em", lineHeight: "1.12" },
    "display-sm": { size: "40px", weight: "700", tracking: "-0.02em", lineHeight: "1.2" },
    "heading-xl": { size: "32px", weight: "700", tracking: "-0.02em", lineHeight: "1.25" },
    "heading-lg": { size: "28px", weight: "700", tracking: "-0.01em", lineHeight: "1.3" },
    "heading-md": { size: "24px", weight: "600", tracking: "-0.01em", lineHeight: "1.35" },
    "heading-sm": { size: "20px", weight: "600", tracking: "0em", lineHeight: "1.4" },
    "heading-xs": { size: "18px", weight: "600", tracking: "0em", lineHeight: "1.45" },
    "body-lg": { size: "18px", weight: "400", tracking: "0em", lineHeight: "1.75" },
    "body-md": { size: "16px", weight: "400", tracking: "0em", lineHeight: "1.75" },
    "body-sm": { size: "14px", weight: "400", tracking: "0em", lineHeight: "1.6" },
    "body-xs": { size: "12px", weight: "400", tracking: "0em", lineHeight: "1.5" },
    "label-lg": { size: "14px", weight: "600", tracking: "0.06em", lineHeight: "1" },
    "label-md": { size: "12px", weight: "600", tracking: "0.08em", lineHeight: "1" },
    "label-sm": { size: "11px", weight: "600", tracking: "0.1em", lineHeight: "1" },
    "mono-md": { size: "14px", weight: "400", tracking: "0em", lineHeight: "1.6" },
    "mono-sm": { size: "12px", weight: "400", tracking: "0em", lineHeight: "1.5" },
  },
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  full: "9999px",
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────

export const shadows = {
  // Highly diffused — the Domus signature
  card: "0 10px 30px rgba(0, 0, 0, 0.05)",
  cardHover: "0 20px 50px rgba(0, 0, 0, 0.09)",
  cardLift: "0 24px 64px rgba(0, 0, 0, 0.12)",
  hero: "0 32px 80px rgba(0, 0, 0, 0.10)",
  button: "0 4px 14px rgba(91, 106, 240, 0.25)",
  buttonCharcoal: "0 4px 14px rgba(42, 42, 42, 0.20)",
  sidebar: "2px 0 16px rgba(0, 0, 0, 0.04)",
  modal: "0 48px 100px rgba(0, 0, 0, 0.18)",
  inset: "inset 0 2px 4px rgba(0, 0, 0, 0.04)",
  none: "none",
} as const;

// ─── Motion ──────────────────────────────────────────────────────────────────

export const motion = {
  easing: {
    spring: "cubic-bezier(0.16, 1, 0.3, 1)",
    smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
    enter: "cubic-bezier(0, 0, 0.2, 1)",
    exit: "cubic-bezier(0.4, 0, 1, 1)",
  },
  duration: {
    instant: "100ms",
    micro: "150ms",
    fast: "200ms",
    component: "300ms",
    page: "400ms",
    slow: "600ms",
  },
} as const;

// ─── Layout ──────────────────────────────────────────────────────────────────

export const layout = {
  maxWidth: "1280px",
  sidebarWidth: "240px",
  sidebarCollapsed: "64px",
  navHeight: "64px",
  sectionPaddingY: "96px",
  sectionPaddingYMobile: "64px",
  cardPadding: "32px",
  cardPaddingMobile: "24px",
} as const;

// ─── Z-Index ─────────────────────────────────────────────────────────────────

export const zIndex = {
  base: 0,
  raised: 10,
  dropdown: 100,
  sticky: 200,
  overlay: 300,
  modal: 400,
  toast: 500,
  tooltip: 600,
} as const;

// ─── Breakpoints ─────────────────────────────────────────────────────────────

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

// ─── Composite token type ─────────────────────────────────────────────────────

export type Tokens = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
  shadows: typeof shadows;
  motion: typeof motion;
  layout: typeof layout;
  zIndex: typeof zIndex;
  breakpoints: typeof breakpoints;
};

export const tokens: Tokens = {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  motion,
  layout,
  zIndex,
  breakpoints,
};

export default tokens;
