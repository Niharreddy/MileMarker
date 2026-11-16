import React from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { spacing, useAppTheme } from "@/theme";

import { AppText } from "../AppText";
import type { IconName } from "../StatRow";

export type MetaItemProps = {
  icon: IconName;
  label: string;
  /** Accent-colored instead of the default muted secondary — for the one item that should stand out. */
  highlighted?: boolean;
};

/** Small icon + text pair for a card's metadata line (distance, duration, photo count…). */
export function MetaItem({ icon, label, highlighted = false }: MetaItemProps) {
  const theme = useAppTheme();
  const color = highlighted ? theme.palette.primary : theme.palette.textSecondary;

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={14} color={color} />
      <AppText variant="labelMedium" style={{ color }} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs + 1,
    flexShrink: 1,
  },
});
