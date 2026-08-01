import { Platform, type TextStyle } from "react-native";

/**
 * Type scale, named after Material Design 3 so it lines up 1:1 with
 * react-native-paper's own variant names — `<AppText variant="titleLarge">`
 * and `<Text variant="titleLarge">` (Paper) render identically.
 */
export type TypographyVariant =
  | "displayLarge"
  | "displayMedium"
  | "headlineLarge"
  | "headlineMedium"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall";

const fontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: "System",
});

type TypographyStyle = Pick<
  TextStyle,
  "fontSize" | "lineHeight" | "fontWeight" | "letterSpacing" | "fontFamily"
>;

export const typography: Record<TypographyVariant, TypographyStyle> = {
  displayLarge: { fontFamily, fontSize: 40, lineHeight: 48, fontWeight: "700", letterSpacing: 0 },
  displayMedium: { fontFamily, fontSize: 32, lineHeight: 40, fontWeight: "700", letterSpacing: 0 },
  headlineLarge: { fontFamily, fontSize: 28, lineHeight: 36, fontWeight: "600", letterSpacing: 0 },
  headlineMedium: { fontFamily, fontSize: 24, lineHeight: 32, fontWeight: "600", letterSpacing: 0 },
  titleLarge: { fontFamily, fontSize: 20, lineHeight: 28, fontWeight: "600", letterSpacing: 0 },
  titleMedium: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: "600", letterSpacing: 0.15 },
  titleSmall: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0.1 },
  bodyLarge: { fontFamily, fontSize: 16, lineHeight: 24, fontWeight: "400", letterSpacing: 0.15 },
  bodyMedium: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "400", letterSpacing: 0.25 },
  bodySmall: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: "400", letterSpacing: 0.4 },
  labelLarge: { fontFamily, fontSize: 14, lineHeight: 20, fontWeight: "600", letterSpacing: 0.1 },
  labelMedium: { fontFamily, fontSize: 12, lineHeight: 16, fontWeight: "600", letterSpacing: 0.5 },
  labelSmall: { fontFamily, fontSize: 11, lineHeight: 16, fontWeight: "600", letterSpacing: 0.5 },
};
