import type { ViewStyle } from "react-native";

type ShadowStyle = Pick<
  ViewStyle,
  "elevation" | "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius"
>;

/**
 * Elevation scale shared by every raised surface (cards, floating panels,
 * map controls). Each level sets both Android `elevation` and the iOS
 * shadow props, so a surface looks equally lifted on either platform.
 */
export const shadows: Record<"none" | "sm" | "md" | "lg", ShadowStyle> = {
  none: {},
  sm: {
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  md: {
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  lg: {
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
  },
};

export type Shadows = typeof shadows;
export type ShadowKey = keyof Shadows;
