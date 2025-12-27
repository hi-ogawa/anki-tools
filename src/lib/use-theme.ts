import { useEffect } from "react";
import { useLocalStorage } from "./use-local-storage";

export type Theme = "light" | "dark" | "system";

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(
    "anki-browse-theme",
    "system",
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (themeName: "light" | "dark") => {
      root.classList.remove("light", "dark");
      root.classList.add(themeName);
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      applyTheme(systemTheme);

      const listener = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    applyTheme(theme);
  }, [theme]);

  return { theme, setTheme };
}
