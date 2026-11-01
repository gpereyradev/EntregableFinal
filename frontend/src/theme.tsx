import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
type Preference = "system" | "light" | "dark";
const key = "nova-salud-theme";
function readPreference(): Preference {
  try {
    const value = localStorage.getItem(key);
    if (value === "dark" || value === "light") return value;
  } catch {}
  return "system";
}
const ThemeContext = createContext<{
  preference: Preference;
  setPreference: (p: Preference) => void;
}>({ preference: "system", setPreference: () => {} });
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreference] = useState<Preference>(readPreference);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme =
        preference === "system"
          ? media.matches
            ? "dark"
            : "light"
          : preference;
      document.documentElement.dataset.theme = theme;
      document.documentElement.style.colorScheme = theme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", theme === "dark" ? "#0d1724" : "#f5f8fc");
    };
    apply();
    try {
      localStorage.setItem(key, preference);
    } catch {}
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preference]);
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key === key) setPreference(readPreference());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <ThemeContext.Provider value={{ preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
export function ThemeSwitcher() {
  const { preference, setPreference } = useContext(ThemeContext);
  return (
    <div className="theme-switcher" role="group" aria-label="Apariencia">
      {(
        [
          { value: "light", label: "Tema claro", Icon: Sun },
          { value: "dark", label: "Tema oscuro", Icon: Moon },
          { value: "system", label: "Tema del sistema", Icon: Monitor },
        ] as const
      ).map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          title={label}
          aria-label={label}
          aria-pressed={preference === value}
          onClick={() => setPreference(value)}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
