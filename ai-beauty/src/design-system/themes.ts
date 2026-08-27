/**
 * AI Beauty design system — theme tokens.
 * Four selectable "UI personalities" sharing one brand identity/spacing/type scale.
 * Users switch themes from Profile → Appearance. Persisted in settingsStore.
 */

export type ThemeId = "signature" | "midnight" | "minimalLight" | "roseSoft";

export interface AppTheme {
  id: ThemeId;
  name: string; // translation key resolved in UI, kept here as display fallback
  isDark: boolean;
  colors: {
    background: string;
    backgroundElevated: string;
    card: string;
    cardAlt: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentAlt: string;
    accentGradient: [string, string];
    success: string;
    warning: string;
    danger: string;
    chipBackground: string;
    chipBackgroundActive: string;
    tabBarBackground: string;
    overlay: string;
  };
  radius: { sm: number; md: number; lg: number; xl: number; pill: number };
  spacing: (n: number) => number;
  typography: {
    fontFamily: string;
    display: number;
    title: number;
    subtitle: number;
    body: number;
    caption: number;
  };
}

const baseRadius = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };
const baseSpacing = (n: number) => n * 4;
const baseTypography = {
  fontFamily: "System",
  display: 30,
  title: 22,
  subtitle: 17,
  body: 15,
  caption: 12,
};

export const signatureTheme: AppTheme = {
  id: "signature",
  name: "Signature",
  isDark: true,
  colors: {
    background: "#150912",
    backgroundElevated: "#1E0E1B",
    card: "#2A1224",
    cardAlt: "#331730",
    border: "#4A2440",
    textPrimary: "#F7EEF4",
    textSecondary: "#D9BFD1",
    textMuted: "#9C7E96",
    accent: "#E85FA0",
    accentAlt: "#B57BE8",
    accentGradient: ["#B57BE8", "#E85FA0"],
    success: "#5FD9A0",
    warning: "#F2B34C",
    danger: "#F26B6B",
    chipBackground: "#331730",
    chipBackgroundActive: "#E85FA0",
    tabBarBackground: "#1A0B17",
    overlay: "rgba(21,9,18,0.72)",
  },
  radius: baseRadius,
  spacing: baseSpacing,
  typography: baseTypography,
};

export const midnightTheme: AppTheme = {
  id: "midnight",
  name: "Midnight",
  isDark: true,
  colors: {
    background: "#0D0F13",
    backgroundElevated: "#14171D",
    card: "#1B1F27",
    cardAlt: "#232833",
    border: "#313743",
    textPrimary: "#EDEFF3",
    textSecondary: "#B8BECB",
    textMuted: "#787F8F",
    accent: "#6F8CFF",
    accentAlt: "#8C6FEF",
    accentGradient: ["#6F8CFF", "#8C6FEF"],
    success: "#4CD9A5",
    warning: "#F2B34C",
    danger: "#F2686B",
    chipBackground: "#232833",
    chipBackgroundActive: "#6F8CFF",
    tabBarBackground: "#101318",
    overlay: "rgba(13,15,19,0.72)",
  },
  radius: baseRadius,
  spacing: baseSpacing,
  typography: baseTypography,
};

export const minimalLightTheme: AppTheme = {
  id: "minimalLight",
  name: "Minimal Light",
  isDark: false,
  colors: {
    background: "#FBF9F7",
    backgroundElevated: "#FFFFFF",
    card: "#FFFFFF",
    cardAlt: "#F3EFEB",
    border: "#E7E1DA",
    textPrimary: "#241E1B",
    textSecondary: "#5B534D",
    textMuted: "#9C948C",
    accent: "#B8557A",
    accentAlt: "#8F6FB8",
    accentGradient: ["#B8557A", "#8F6FB8"],
    success: "#3F9E72",
    warning: "#C98A2E",
    danger: "#C1504F",
    chipBackground: "#F3EFEB",
    chipBackgroundActive: "#B8557A",
    tabBarBackground: "#FFFFFF",
    overlay: "rgba(36,30,27,0.45)",
  },
  radius: baseRadius,
  spacing: baseSpacing,
  typography: baseTypography,
};

export const roseSoftTheme: AppTheme = {
  id: "roseSoft",
  name: "Rose Soft",
  isDark: false,
  colors: {
    background: "#FCF2F0",
    backgroundElevated: "#FFF8F6",
    card: "#FFFFFF",
    cardAlt: "#FBE6E2",
    border: "#F3D3CC",
    textPrimary: "#3A2420",
    textSecondary: "#6E4C45",
    textMuted: "#A5837B",
    accent: "#E0768A",
    accentAlt: "#E8A15C",
    accentGradient: ["#E8A15C", "#E0768A"],
    success: "#4CA37E",
    warning: "#D6903B",
    danger: "#CC5C58",
    chipBackground: "#FBE6E2",
    chipBackgroundActive: "#E0768A",
    tabBarBackground: "#FFF8F6",
    overlay: "rgba(58,36,32,0.45)",
  },
  radius: baseRadius,
  spacing: baseSpacing,
  typography: baseTypography,
};

export const themes: Record<ThemeId, AppTheme> = {
  signature: signatureTheme,
  midnight: midnightTheme,
  minimalLight: minimalLightTheme,
  roseSoft: roseSoftTheme,
};

export const DEFAULT_THEME: ThemeId = "signature";
