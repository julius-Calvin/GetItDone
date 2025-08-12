"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

// ThemeContext provides: theme ("light" | "dark" | "system"), setTheme(newTheme)
// Preference stored in localStorage key 'theme-pref'. 'system' tracks OS.
const ThemeContext = createContext({ theme: "system", setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");

  const applyTheme = useCallback((pref) => {
    const root = document.documentElement;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const resolved = pref === "system" ? (systemDark ? "dark" : "light") : pref;
    root.dataset.theme = resolved;
    root.classList.toggle("dark", resolved === "dark");
  }, []);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    if (next === "system") {
      localStorage.removeItem("theme-pref");
    } else {
      localStorage.setItem("theme-pref", next);
    }
    applyTheme(next);
  }, [applyTheme]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme-pref");
      const initial = stored || "system";
      setThemeState(initial);
      applyTheme(initial);
    } catch (e) {
      // ignore
    }
  }, [applyTheme]);

  useEffect(() => {
    if (theme !== "system") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [theme, applyTheme]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "theme-pref") {
        const value = e.newValue || "system";
        setThemeState(value);
        applyTheme(value);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [applyTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
