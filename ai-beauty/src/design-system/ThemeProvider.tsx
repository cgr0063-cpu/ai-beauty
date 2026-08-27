import React, { createContext, useContext, useMemo } from "react";
import { AccessibilityInfo } from "react-native";
import { AppTheme, themes, ThemeId } from "./themes";
import { useSettingsStore } from "@/state/settingsStore";

interface ThemeContextValue {
  theme: AppTheme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  reducedMotion: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useSettingsStore((s) => s.themeId);
  const setThemeId = useSettingsStore((s) => s.setThemeId);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReducedMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.(
      "reduceMotionChanged",
      setReducedMotion
    );
    return () => sub?.remove?.();
  }, []);

  const value = useMemo(
    () => ({ theme: themes[themeId], themeId, setThemeId, reducedMotion }),
    [themeId, setThemeId, reducedMotion]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useAppTheme must be used within ThemeProvider");
  return ctx;
}
