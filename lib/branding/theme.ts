import type { CSSProperties } from "react";

type ThemeStyle = CSSProperties & Record<`--${string}`, string>;

const defaultTheme = {
  background: "#f8fafc",
  surface: "#eef5f8",
  foreground: "#0f172a",
  card: "#ffffff",
  muted: "#e2e8f0",
  mutedForeground: "#536171",
  primary: "#14a391",
  primaryForeground: "#f8ffff",
  border: "#cbd5e1"
};

function readEnv(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  return value || fallback;
}

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();

  return value || undefined;
}

function normalizeHex(value: string, fallback: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);

  if (!match) {
    return fallback;
  }

  const hex = match[1];

  if (hex.length === 3) {
    return `#${hex
      .split("")
      .map((char) => `${char}${char}`)
      .join("")}`.toLowerCase();
  }

  return `#${hex}`.toLowerCase();
}

function hexToRgb(hex: string) {
  const normalized = normalizeHex(hex, defaultTheme.primary).slice(1);

  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16)
  };
}

function hexToHslTriplet(hex: string) {
  const { r, g, b } = hexToRgb(hex);
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;

  if (max === red) {
    hue = ((green - blue) / delta) % 6;
  } else if (max === green) {
    hue = (blue - red) / delta + 2;
  } else {
    hue = (red - green) / delta + 4;
  }

  const normalizedHue = Math.round(hue * 60);
  const degrees = normalizedHue < 0 ? normalizedHue + 360 : normalizedHue;

  return `${degrees} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function themeColor(envName: string, fallback: string) {
  return normalizeHex(readEnv(envName, fallback), fallback);
}

export function getBranding() {
  const primary = themeColor("HACKD_THEME_PRIMARY", defaultTheme.primary);

  const theme = {
    background: themeColor("HACKD_THEME_BACKGROUND", defaultTheme.background),
    surface: themeColor("HACKD_THEME_SURFACE", defaultTheme.surface),
    foreground: themeColor("HACKD_THEME_FOREGROUND", defaultTheme.foreground),
    card: themeColor("HACKD_THEME_CARD", defaultTheme.card),
    muted: themeColor("HACKD_THEME_MUTED", defaultTheme.muted),
    mutedForeground: themeColor("HACKD_THEME_MUTED_FOREGROUND", defaultTheme.mutedForeground),
    primary,
    primaryForeground: themeColor("HACKD_THEME_PRIMARY_FOREGROUND", defaultTheme.primaryForeground),
    border: themeColor("HACKD_THEME_BORDER", defaultTheme.border)
  };
  const accentRgb = hexToRgb(primary);

  return {
    name: readEnv("HACKD_BRAND_NAME", "hackd"),
    tagline: readEnv("HACKD_BRAND_TAGLINE", "Containerized control plane for hands-on security training."),
    logoUrl: readOptionalEnv("HACKD_BRAND_LOGO_URL"),
    adminLabel: readEnv("HACKD_BRAND_ADMIN_LABEL", "Admin control plane"),
    learnerLabel: readEnv("HACKD_BRAND_LEARNER_LABEL", "Learner workspace"),
    themeStyle: {
      "--background": hexToHslTriplet(theme.background),
      "--surface": hexToHslTriplet(theme.surface),
      "--foreground": hexToHslTriplet(theme.foreground),
      "--card": hexToHslTriplet(theme.card),
      "--card-foreground": hexToHslTriplet(theme.foreground),
      "--muted": hexToHslTriplet(theme.muted),
      "--muted-foreground": hexToHslTriplet(theme.mutedForeground),
      "--primary": hexToHslTriplet(theme.primary),
      "--primary-foreground": hexToHslTriplet(theme.primaryForeground),
      "--border": hexToHslTriplet(theme.border),
      "--accent-rgb": `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`
    } as ThemeStyle
  };
}
