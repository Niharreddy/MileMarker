import React from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components";
import { spacing } from "@/theme";

export type PermissionGateProps = {
  title: string;
  message: string;
  actionLabel: string;
  onRequestAccess: () => void;
};

/** Shown in place of the map/picker when a required permission hasn't been granted yet. */
export function PermissionGate({ title, message, actionLabel, onRequestAccess }: PermissionGateProps) {
  return (
    <View style={styles.container}>
      <AppText variant="titleMedium" style={styles.title}>
        {title}
      </AppText>
      <AppText color="secondary" style={styles.message}>
        {message}
      </AppText>
      <AppButton label={actionLabel} onPress={onRequestAccess} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  message: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
});
