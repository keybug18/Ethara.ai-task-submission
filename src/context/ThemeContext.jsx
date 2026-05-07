import { createContext, useContext, useEffect, useState } from "react";

const ThemeCtx = createContext(null);
export const useTheme = () => useContext(ThemeCtx);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("tf_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("tf_theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}
