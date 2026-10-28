/**
 * Design tokens as plain values, for code paths that can't read CSS
 * variables (e.g. Recharts series `stroke`/`fill` props).
 *
 * Keep this file in sync with src/index.css and tailwind.config.ts. These
 * values follow the approved colour-grade palette.
 */

export const colors = {
  light: {
    bg: "#F5F7FC",
    surface: "#FFFFFF",
    surfaceElevated: "#FFFFFF",
    surfaceSecondary: "#F5F7FC",
    sidebar: "#FFFFFF",
    overlay: "rgba(23, 43, 77, 0.3)",
    brand: "#4F46E5",
    brandLight: "#4338CA",
    brandForeground: "#FFFFFF",
    chartBar: "#3730A3",
    chartBarActive: "#312E81",
    chartBarStroke: "#312E81",
    chartAxis: "#475569",
    chartGrid: "#CBD5E1",
    chartTooltipBorder: "#CBD5E1",
    textPrimary: "#172B4D",
    textSecondary: "#68778D",
    textTertiary: "#68778D",
    border: "#E8EDF5",
    success: "#15803D",
    successForeground: "#FFFFFF",
    warning: "#B45309",
    warningForeground: "#78350F",
    danger: "#B91C1C",
    dangerForeground: "#FFFFFF",
    info: "#4F46E5",
    pending: "#B45309",
  },
  dark: {
    bg: "#111827",
    surface: "#1F2937",
    surfaceElevated: "#1F2937",
    surfaceSecondary: "#374151",
    sidebar: "#1F2937",
    overlay: "rgba(0, 0, 0, 0.58)",
    brand: "#818CF8",
    brandLight: "#A5B4FC",
    brandForeground: "#111827",
    chartBar: "#A5B4FC",
    chartBarActive: "#C7D2FE",
    chartBarStroke: "#C7D2FE",
    chartAxis: "#D1D5DB",
    chartGrid: "#4B5563",
    chartTooltipBorder: "#4B5563",
    textPrimary: "#F3F4F6",
    textSecondary: "#9CA3AF",
    textTertiary: "#9CA3AF",
    border: "#374151",
    success: "#4ADE80",
    successForeground: "#052E16",
    warning: "#FBBF24",
    warningForeground: "#FEF3C7",
    danger: "#F87171",
    dangerForeground: "#450A0A",
    info: "#818CF8",
    pending: "#FBBF24",
  },
  brand: {
    DEFAULT: "#4F46E5",
    light: "#818CF8",
    foreground: "#FFFFFF",
  },
  status: {
    success: "#15803D",
    danger: "#B91C1C",
    warning: "#B45309",
    info: "#4F46E5",
    pending: "#B45309",
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
