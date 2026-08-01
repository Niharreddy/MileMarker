import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { spacing, useAppTheme } from "@/theme";

import { AppText } from "../AppText";

export type LoadingIndicatorProps = {
  label?: string;
  size?: "small" | "large";
  fullscreen?: boolean;
};

/**
 * Standard loading state — a themed spinner with an optional label. Use
 * `fullscreen` for whole-screen loading states (e.g. initial data fetch);
 * omit it for inline loading within a smaller area.
 */
export function LoadingIndicator({ label, size = "large", fullscreen = false }: LoadingIndicatorProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, fullscreen && styles.fullscreen]}>
      <ActivityIndicator size={size} color={theme.palette.primary} />
      {label ? (
        <AppText variant="bodyMedium" color="secondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  fullscreen: {
    flex: 1,
  },
  label: {
    marginTop: spacing.sm,
  },
});
