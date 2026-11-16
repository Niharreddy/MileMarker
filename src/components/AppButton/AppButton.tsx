import React from "react";
import { StyleSheet } from "react-native";
import { Button as PaperButton, type ButtonProps as PaperButtonProps } from "react-native-paper";

import { radii, useAppTheme } from "@/theme";

export type AppButtonVariant = "primary" | "secondary" | "outline" | "text" | "danger";
export type AppButtonSize = "md" | "lg";

export type AppButtonProps = Omit<PaperButtonProps, "mode" | "children"> & {
  variant?: AppButtonVariant;
  /** `lg` is the tall, full-emphasis size for a screen's single main action (Start Drive, Save…). */
  size?: AppButtonSize;
  label: string;
};

const variantToPaperMode: Record<AppButtonVariant, PaperButtonProps["mode"]> = {
  primary: "contained",
  secondary: "contained-tonal",
  outline: "outlined",
  text: "text",
  danger: "contained",
};

/**
 * Thin wrapper around Paper's Button so call sites use Mile Marker's own
 * variant vocabulary (primary/secondary/outline/text/danger) instead of
 * Paper's `mode` prop — keeps the design-system choice swappable without
 * touching every screen.
 */
export function AppButton({
  variant = "primary",
  size = "md",
  label,
  style,
  contentStyle,
  labelStyle,
  ...rest
}: AppButtonProps) {
  const theme = useAppTheme();
  const dangerColors =
    variant === "danger" ? { buttonColor: theme.palette.error, textColor: theme.palette.onError } : null;

  return (
    <PaperButton
      mode={variantToPaperMode[variant]}
      {...dangerColors}
      {...rest}
      style={[styles.button, style]}
      contentStyle={[size === "lg" && styles.largeContent, contentStyle]}
      labelStyle={[size === "lg" && styles.largeLabel, labelStyle]}
    >
      {label}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radii.full,
  },
  largeContent: {
    height: 52,
  },
  largeLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
