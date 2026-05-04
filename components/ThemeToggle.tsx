"use client";

import { useCallback, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  // Listen for storage changes from other tabs
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot(): boolean {
  const stored = localStorage.getItem("theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerSnapshot(): boolean {
  return false;
}

export default function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Keep the DOM class in sync
  if (typeof document !== "undefined") {
    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }

  const applyTheme = useCallback((next: boolean) => {
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    // Trigger re-render by dispatching a storage event
    window.dispatchEvent(new Event("storage"));
  }, []);

  const toggle = useCallback(() => {
    const next = !dark;
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  }, [dark, applyTheme]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg border px-3 py-2 text-sm font-medium"
      style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
    >
      {dark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}
