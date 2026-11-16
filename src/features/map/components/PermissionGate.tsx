import React from "react";
import { StyleSheet } from "react-native";

import { EmptyState, type IconName } from "@/components";

export type PermissionGateProps = {
  title: string;
  message: string;
  actionLabel: string;
  onRequestAccess: () => void;
  icon?: IconName;
};

/** Shown in place of the map/picker when a required permission hasn't been granted yet. */
export function PermissionGate({
  title,
  message,
  actionLabel,
  onRequestAccess,
  icon = "map-marker-off-outline",
}: PermissionGateProps) {
  return (
    <EmptyState
      icon={icon}
      title={title}
      message={message}
      actionLabel={actionLabel}
      onAction={onRequestAccess}
      style={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
});
