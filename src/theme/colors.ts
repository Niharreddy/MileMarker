/**
 * Raw brand palette. Nothing here is used directly by components — always
 * consume colors through `lightColors` / `darkColors` (or `useAppTheme()`),
 * never import `palette` outside this file. That indirection is what lets us
 * re-theme the whole app by editing values in one place.
 *
 * Warm, sunset-and-road-trip palette: terracotta as the primary (adventure,
 * warmth), a deep teal for success/accent moments (ocean, exploration), and
 * cream/sand neutrals instead of clinical grays — meant to read as "travel
 * journal," not "dashboard."
 */
const palette = {
  terracotta100: "#FBE3D4",
  terracotta400: "#E0703F",
  terracotta500: "#D97A56",
  terracotta600: "#C15A32",
  terracotta900: "#7A3418",

  teal400: "#4FBDAF",
  teal500: "#2A9D8F",

  amber500: "#E9A23B",
  coral500: "#C6432B",
  coral400: "#E2604A",

  sand0: "#FFFDF9",
  sand50: "#FFF8F1",
  sand100: "#F3E7D8",
  sand200: "#E8D9C5",
  sand300: "#C9B8A6",
  sand400: "#A3907C",
  sand600: "#7A6A5C",
  sand800: "#3A2E22",
  sand900: "#2B211B",

  espresso800: "#2A2118",
  espresso900: "#1E1814",
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
  primary: palette.terracotta500,
  onPrimary: palette.sand0,
  primaryContainer: palette.terracotta100,
  onPrimaryContainer: palette.terracotta900,

  background: palette.sand50,
  onBackground: palette.sand900,
  surface: palette.sand0,
  onSurface: palette.sand900,
  surfaceVariant: palette.sand100,
  onSurfaceVariant: palette.sand600,

  border: palette.sand200,
  textPrimary: palette.sand900,
  textSecondary: palette.sand600,
  textDisabled: palette.sand300,

  success: palette.teal500,
  warning: palette.amber500,
  error: palette.coral500,
  onError: palette.sand0,
};

export const darkColors: AppColorScheme = {
  primary: palette.terracotta400,
  onPrimary: palette.espresso900,
  primaryContainer: palette.terracotta900,
  onPrimaryContainer: palette.terracotta100,

  background: palette.espresso900,
  onBackground: palette.sand100,
  surface: palette.espresso800,
  onSurface: palette.sand100,
  surfaceVariant: palette.sand800,
  onSurfaceVariant: palette.sand300,

  border: palette.sand800,
  textPrimary: palette.sand100,
  textSecondary: palette.sand300,
  textDisabled: palette.sand600,

  success: palette.teal400,
  warning: palette.amber500,
  error: palette.coral400,
  onError: palette.espresso900,
};
