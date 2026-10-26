import type { Config } from "tailwindcss";

/**
 * ShopDesk design tokens.
 *
 * Color values below follow the approved colour-grade palette and resolve
 * through CSS variables so light and dark themes share one token name.
 *
 * Theme switching uses Tailwind's `class` strategy: add/remove `dark` on
 * <html> (see src/context/ThemeContext.tsx). Colors are wired to CSS
 * variables defined in src/index.css so both themes share one token name.
 */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        page: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-elevated": "var(--color-surface-elevated)",
        "surface-secondary": "rgb(var(--color-surface-secondary-rgb) / <alpha-value>)",
        sidebar: "var(--color-sidebar)",
        overlay: "var(--color-overlay)",

        // Brand / accent, including a readable foreground for solid controls.
        brand: {
          DEFAULT: "rgb(var(--color-brand-rgb) / <alpha-value>)",
          light: "rgb(var(--color-brand-light-rgb) / <alpha-value>)",
          foreground: "var(--color-brand-foreground)",
        },

        // Text
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",

        // Borders / dividers
        border: "var(--color-border)",

        // Restrained semantic status colors with theme-specific readable
        // foregrounds; info stays tied to the indigo brand accent.
        success: "rgb(var(--color-success-rgb) / <alpha-value>)",
        "success-foreground": "var(--color-success-foreground)",
        danger: "rgb(var(--color-danger-rgb) / <alpha-value>)",
        "danger-foreground": "var(--color-danger-foreground)",
        warning: "rgb(var(--color-warning-rgb) / <alpha-value>)",
        "warning-foreground": "var(--color-warning-foreground)",
        info: "rgb(var(--color-info-rgb) / <alpha-value>)",
        "info-foreground": "var(--color-info-foreground)",
        pending: "var(--color-pending)",
      },
      fontFamily: {
        // Visual style matches a geometric/grotesque sans (DM Sans is the
        // closest known match for this template family) — NOT verified from
        // image metadata, since a flattened screenshot carries no font
        // information. Falls back to system/Inter-style stacks.
        sans: [
          "DM Sans",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        // Approximate scale based on visual proportion of card/button
        // corners in the screenshots; not pixel-measured to the exact px.
        card: "20px",
        panel: "16px",
        control: "12px",
        pill: "9999px",
      },
      boxShadow: {
        // Soft, low-opacity bluish card shadow visible in the light-theme
        // screenshots. Estimated — not extractable precisely from a flat
        // PNG (shadows blend with the page background).
        card: "0 18px 40px -12px rgba(112, 144, 176, 0.18)",
        "card-dark": "0 18px 40px -12px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
