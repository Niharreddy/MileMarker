import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { spacing, useAppTheme } from "@/theme";

import { AppButton } from "../AppButton";
import { AppText } from "../AppText";
import type { IconName } from "../StatRow";

export type EmptyStateProps = {
  icon: IconName;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Centered icon + title + message (+ optional action) for lists and screens with nothing to show yet. */
export function EmptyState({ icon, title, message, actionLabel, onAction, style }: EmptyStateProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.palette.primaryContainer }]}>
        <MaterialCommunityIcons name={icon} size={32} color={theme.palette.onPrimaryContainer} />
      </View>
      <AppText variant="titleMedium" style={styles.centered}>
        {title}
      </AppText>
      {message ? (
        <AppText color="secondary" style={styles.centered}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <AppButton label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  centered: {
    textAlign: "center",
  },
  action: {
    marginTop: spacing.md,
  },
});
