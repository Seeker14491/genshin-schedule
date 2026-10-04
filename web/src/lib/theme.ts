import type { Config } from "./utils/config";

/**
 * Applies the theme to the page. While the theme is "system", the page follows the system's color scheme, until the
 * returned function is called. The theme is also saved as "color-mode" in browser storage, where the script in
 * app.html reads it to apply the theme before the page is drawn.
 */
export function applyTheme(theme: Config["theme"]) {
  try {
    localStorage.setItem("color-mode", theme);
  } catch {
    // storage is unavailable
  }

  if (theme !== "system") {
    applyColorScheme(theme);
    return;
  }

  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const update = () => applyColorScheme(query.matches ? "dark" : "light");

  update();
  query.addEventListener("change", update);
  return () => query.removeEventListener("change", update);
}

function applyColorScheme(scheme: "light" | "dark") {
  const root = document.documentElement;

  root.classList.toggle("dark", scheme === "dark");
  root.classList.toggle("light", scheme === "light");
  root.style.colorScheme = scheme;
}
