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
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const systemTheme = mediaQuery.matches ? "dark" : "light";
      root.classList.add(systemTheme);

      const listener = (e: MediaQueryListEvent) => {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      };

      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }

    root.classList.add(theme);
  }, [theme]);

  return { theme, setTheme };
}
