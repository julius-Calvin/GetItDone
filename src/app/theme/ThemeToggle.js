"use client";

import { useTheme } from "./ThemeProvider";
import { useCallback } from "react";

// Cycles theme: light -> dark -> system -> light
export default function ThemeToggle({ className = "" }) {
  const { theme, setTheme } = useTheme();

  const cycle = useCallback(() => {
    const order = ["light", "dark", "system"];
    const idx = order.indexOf(theme);
    const next = order[(idx + 1) % order.length];
    setTheme(next);
  }, [theme, setTheme]);

  const labelMap = {
    light: "Light mode (current) – click for Dark",
    dark: "Dark mode (current) – click for System",
    system: "System mode (current) – click for Light",
  };

  const icon = theme === "dark" ? "🌙" : theme === "light" ? "☀️" : "🖥️";

  return (
    <button
      type="button"
      aria-label={labelMap[theme]}
      title={labelMap[theme]}
      onClick={cycle}
      className={`group inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-600 bg-white/70 dark:bg-neutral-800/70 hover:bg-white dark:hover:bg-neutral-700 px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow transition-colors backdrop-blur ${className}`}
    >
      <span className="text-lg leading-none select-none">{icon}</span>
      <span className="hidden sm:inline capitalize">{theme}</span>
    </button>
  );
}
