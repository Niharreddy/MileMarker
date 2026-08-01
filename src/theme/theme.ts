import {
  MD3DarkTheme,
  MD3LightTheme,
  adaptNavigationTheme,
  useTheme as usePaperTheme,
  type MD3Theme,
} from "react-native-paper";
import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";

import { darkColors, lightColors } from "./colors";
import { radii } from "./radii";
import { spacing } from "./spacing";
import { typography } from "./typography";

/**
 * Maps our semantic color tokens onto react-native-paper's MD3 color slots,
 * so every Paper component (Button, Card, AppBar, ...) themes itself
 * automatically without per-component overrides.
 */
function buildPaperTheme(base: MD3Theme, colors: typeof lightColors): MD3Theme {
  return {
    ...base,
    roundness: radii.md,
    colors: {
      ...base.colors,
      primary: colors.primary,
      onPrimary: colors.onPrimary,
      primaryContainer: colors.primaryContainer,
      onPrimaryContainer: colors.onPrimaryContainer,
      background: colors.background,
      onBackground: colors.onBackground,
      surface: colors.surface,
      onSurface: colors.onSurface,
      surfaceVariant: colors.surfaceVariant,
      onSurfaceVariant: colors.onSurfaceVariant,
      outline: colors.border,
      error: colors.error,
      onError: colors.onError,
    },
  };
}

const paperLightTheme = buildPaperTheme(MD3LightTheme, lightColors);
const paperDarkTheme = buildPaperTheme(MD3DarkTheme, darkColors);

const { LightTheme: navigationLightTheme, DarkTheme: navigationDarkTheme } =
  adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
    materialLight: paperLightTheme,
    materialDark: paperDarkTheme,
  }) as { LightTheme: NavigationTheme; DarkTheme: NavigationTheme };

export { navigationLightTheme, navigationDarkTheme };

/**
 * The single theme shape the whole app consumes: react-native-paper's MD3
 * theme, extended with our own spacing/typography/radii/semantic-color
 * tokens. Access it via `useAppTheme()`, never by importing colors.ts /
 * spacing.ts directly in a component.
 */
function buildAppTheme(paperTheme: MD3Theme, colors: typeof lightColors, dark: boolean) {
  return {
    ...paperTheme,
    dark,
    spacing,
    radii,
    typography,
    palette: colors,
  };
}

export const lightTheme = buildAppTheme(paperLightTheme, lightColors, false);
export const darkTheme = buildAppTheme(paperDarkTheme, darkColors, true);

export type AppTheme = typeof lightTheme;

export const useAppTheme = () => usePaperTheme<AppTheme>();
