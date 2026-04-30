import { useEffect, useState } from "react";

/**
 * Light/dark theme with a three-way preference: `light`, `dark`, or
 * `system`. `system` follows the OS preference live. The choice is
 * persisted in localStorage so it survives reloads.
 */

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "mmd-flowchart:theme";

function readPreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage can throw in private mode / sandboxed frames.
  }
  return "system";
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    readPreference() === "system" ? systemTheme() : (readPreference() as ResolvedTheme),
  );

  useEffect(() => {
    const next: ResolvedTheme =
      preference === "system" ? systemTheme() : preference;
    setResolved(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // ignore
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const t: ResolvedTheme = mq.matches ? "dark" : "light";
      setResolved(t);
      applyTheme(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  return {
    preference,
    resolved,
    /** Cycle light → dark → system → light. */
    cycle: () =>
      setPreference(
        preference === "light"
          ? "dark"
          : preference === "dark"
            ? "system"
            : "light",
      ),
    setPreference,
  };
}
