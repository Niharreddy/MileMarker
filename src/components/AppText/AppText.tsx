import React from "react";
import { Text, type TextProps } from "react-native";

import { useAppTheme, type TypographyVariant } from "@/theme";

export type AppTextColor = "primary" | "secondary" | "disabled" | "error" | "inverse";

export type AppTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: AppTextColor;
};

const colorTokenMap: Record<AppTextColor, keyof ReturnType<typeof useAppTheme>["palette"]> = {
  primary: "textPrimary",
  secondary: "textSecondary",
  disabled: "textDisabled",
  error: "error",
  inverse: "onPrimary",
};

/**
 * The only component in the app that should read `theme.typography` /
 * `theme.palette` for text styling — every other screen/component renders
 * text through this, so a type-scale or color change is a one-file edit.
 */
export function AppText({ variant = "bodyMedium", color = "primary", style, ...rest }: AppTextProps) {
  const theme = useAppTheme();
  const colorValue = theme.palette[colorTokenMap[color]];

  return <Text style={[theme.typography[variant], { color: colorValue }, style]} {...rest} />;
}
