import { useTheme } from "@/context/ThemeContext";

/**
 * Temporary Phase 1 placeholder.
 *
 * Exists only to prove the design-token pipeline (Tailwind + CSS variables
 * + theme toggle) renders correctly end-to-end. Replace with real routes
 * and pages in Phase 2 — this file is not a dashboard page.
 */
export default function SetupStatusPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-6">
      <div className="w-full max-w-md rounded-card bg-surface p-8 shadow-card dark:shadow-card-dark">
        <p className="text-sm font-medium text-text-tertiary">
          ShopDesk · Phase 1
        </p>
        <h1 className="mt-1 text-2xl font-bold text-text-primary">
          Project scaffold ready
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-text-secondary">
          React, Vite, TypeScript, Tailwind, React Router, and the design
          tokens extracted from the Horizon UI reference screenshots are
          wired up. Dashboard pages and data are built in Phase 2.
        </p>

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-6 rounded-control bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
        >
          Switch to {theme === "light" ? "dark" : "light"} theme
        </button>
      </div>
    </main>
  );
}
