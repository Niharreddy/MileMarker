import React from "react";
import { Button as PaperButton, type ButtonProps as PaperButtonProps } from "react-native-paper";

export type AppButtonVariant = "primary" | "secondary" | "outline" | "text";

export type AppButtonProps = Omit<PaperButtonProps, "mode" | "children"> & {
  variant?: AppButtonVariant;
  label: string;
};

const variantToPaperMode: Record<AppButtonVariant, PaperButtonProps["mode"]> = {
  primary: "contained",
  secondary: "contained-tonal",
  outline: "outlined",
  text: "text",
};

/**
 * Thin wrapper around Paper's Button so call sites use Mile Marker's own
 * variant vocabulary (primary/secondary/outline/text) instead of Paper's
 * `mode` prop — keeps the design-system choice swappable without touching
 * every screen.
 */
export function AppButton({ variant = "primary", label, ...rest }: AppButtonProps) {
  return (
    <PaperButton mode={variantToPaperMode[variant]} {...rest}>
      {label}
    </PaperButton>
  );
}
