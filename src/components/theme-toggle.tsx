"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "ms-jobs-theme";

type Theme = "light" | "dark";

function getThemeSnapshot(): Theme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function subscribe(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function applyTheme(next: Theme): void {
  document.documentElement.classList.toggle("dark", next === "dark");
  window.localStorage.setItem(STORAGE_KEY, next);
}

export function ThemeToggle() {
  // Server render and the first client render both use the server snapshot,
  // so hydration never mismatches. After hydration the store re-reads the
  // <html> class that the pre-paint script already set, and the icon settles
  // with no console noise and no setState inside an effect.
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
