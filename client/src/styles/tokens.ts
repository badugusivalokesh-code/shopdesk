/**
 * Design tokens as plain values, for code paths that can't read CSS
 * variables (e.g. Recharts series `stroke`/`fill` props).
 *
 * Keep this file in sync with src/index.css and tailwind.config.ts.
 * Source: pixel-sampled from the supplied Horizon UI screenshots — see
 * shopdesk/DESIGN_TOKENS.md.
 */

export const colors = {
  light: {
    bg: "#F4F7FE",
    surface: "#FFFFFF",
    surfaceSecondary: "#F4F7FE",
    sidebar: "#FFFFFF",
    textPrimary: "#2B3674",
    textSecondary: "#707EAE",
    textTertiary: "#A3AED0",
    border: "#E4E8F4",
  },
  dark: {
    bg: "#0B1437",
    surface: "#111C44",
    surfaceSecondary: "#1B254B",
    sidebar: "#111C44",
    textPrimary: "#FFFFFF",
    textSecondary: "#A3AED0",
    textTertiary: "#707EAE",
    /** Estimated — see shopdesk/DESIGN_TOKENS.md */
    border: "rgba(255, 255, 255, 0.08)",
  },
  brand: {
    DEFAULT: "#4318FF",
    light: "#7551FF",
  },
  status: {
    success: "#01B574",
    danger: "#EE5D50",
    warning: "#FFCE20",
    info: "#3965FF",
    pending: "#FFB547",
  },
} as const;

export const radii = {
  control: "12px",
  panel: "16px",
  card: "20px",
  pill: "9999px",
} as const;

export const shadows = {
  card: "0 18px 40px -12px rgba(112, 144, 176, 0.18)",
  cardDark: "0 18px 40px -12px rgba(0, 0, 0, 0.35)",
} as const;
