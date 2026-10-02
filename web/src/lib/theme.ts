import type { Config } from "./utils/config";

/**
 * Applies the theme to the page. It's also saved as "color-mode" in browser storage,
 * where the script in app.html reads it to apply the theme before the page is drawn.
 */
export function applyTheme(theme: Config["theme"]) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme !== "dark");
  root.style.colorScheme = theme;

  try {
    localStorage.setItem("color-mode", theme);
  } catch {
    // storage is unavailable
  }
}
