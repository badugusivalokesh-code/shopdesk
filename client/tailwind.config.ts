import type { Config } from "tailwindcss";

/**
 * ShopDesk design tokens.
 *
 * Color values below were sampled directly from the supplied Horizon UI
 * reference screenshots (pixel-color extraction via Pillow — see
 * shopdesk/DESIGN_TOKENS.md for the method and source crops), not copied
 * from assumed Figma values. Values noted as "estimated" were not sampled
 * with confidence and should be treated as a starting point only.
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
        "surface-secondary": "var(--color-surface-secondary)",
        sidebar: "var(--color-sidebar)",

        // Brand / accent (verified: #4318FF buttons & active states in both
        // themes; #7551FF lighter accent used for dark-mode active indicators)
        brand: {
          DEFAULT: "#4318FF",
          light: "#7551FF",
        },

        // Text
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
        "text-tertiary": "var(--color-text-tertiary)",

        // Borders / dividers
        border: "var(--color-border)",

        // Status (verified against Complex Table / Kanban badges,
        // consistent across both themes)
        success: "#01B574",
        danger: "#EE5D50",
        warning: "#FFCE20",
        info: "#3965FF",
        pending: "#FFB547",
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
