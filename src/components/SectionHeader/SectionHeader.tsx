import React, { type ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { spacing } from "@/theme";

import { AppText } from "../AppText";

export type SectionHeaderProps = {
  title: string;
  /** Right-aligned slot, e.g. a count or an edit action. */
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Small uppercase label that introduces a group of content within a screen. */
export function SectionHeader({ title, right, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <AppText variant="labelMedium" color="secondary" style={styles.title}>
        {title.toUpperCase()}
      </AppText>
      {right ?? null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    letterSpacing: 1,
  },
});
