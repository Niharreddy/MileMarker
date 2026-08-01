/**
 * Raw brand palette. Nothing here is used directly by components — always
 * consume colors through `lightColors` / `darkColors` (or `useAppTheme()`),
 * never import `palette` outside this file. That indirection is what lets us
 * re-theme the whole app by editing values in one place.
 */
const palette = {
  blue50: "#EAF1FF",
  blue100: "#D1E3FF",
  blue400: "#3E7BFA",
  blue500: "#2563EB",
  blue600: "#1D4ED8",
  blue900: "#122A5C",

  slate0: "#FFFFFF",
  slate50: "#F8FAFC",
  slate100: "#F1F5F9",
  slate200: "#E2E8F0",
  slate300: "#CBD5E1",
  slate400: "#94A3B8",
  slate500: "#64748B",
  slate600: "#475569",
  slate700: "#334155",
  slate800: "#1E293B",
  slate900: "#0F172A",
  slate950: "#0B1120",

  green500: "#16A34A",
  amber500: "#D97706",
  red500: "#DC2626",
} as const;

export type AppColorScheme = {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;

  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;

  border: string;
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;

  success: string;
  warning: string;
  error: string;
  onError: string;
};

export const lightColors: AppColorScheme = {
  primary: palette.blue500,
  onPrimary: palette.slate0,
  primaryContainer: palette.blue50,
  onPrimaryContainer: palette.blue900,

  background: palette.slate50,
  onBackground: palette.slate900,
  surface: palette.slate0,
  onSurface: palette.slate900,
  surfaceVariant: palette.slate100,
  onSurfaceVariant: palette.slate600,

  border: palette.slate200,
  textPrimary: palette.slate900,
  textSecondary: palette.slate500,
  textDisabled: palette.slate300,

  success: palette.green500,
  warning: palette.amber500,
  error: palette.red500,
  onError: palette.slate0,
};

export const darkColors: AppColorScheme = {
  primary: palette.blue400,
  onPrimary: palette.slate950,
  primaryContainer: palette.blue900,
  onPrimaryContainer: palette.blue100,

  background: palette.slate950,
  onBackground: palette.slate100,
  surface: palette.slate900,
  onSurface: palette.slate100,
  surfaceVariant: palette.slate800,
  onSurfaceVariant: palette.slate400,

  border: palette.slate700,
  textPrimary: palette.slate100,
  textSecondary: palette.slate400,
  textDisabled: palette.slate600,

  success: palette.green500,
  warning: palette.amber500,
  error: palette.red500,
  onError: palette.slate950,
};
