import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing, useAppTheme } from "@/theme";

import { AppText } from "../AppText";

export type AppHeaderProps = {
  title: string;
  right?: ReactNode;
};

/**
 * In-content screen header (title + optional right-aligned action slot).
 * Tab screens render this instead of a native React Navigation header
 * (`headerShown: false` in `BottomTabNavigator`) so header styling stays
 * consistent with the rest of the design system and isn't split across two
 * theming systems.
 */
export function AppHeader({ title, right }: AppHeaderProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.palette.border }]}>
      <AppText variant="titleLarge">{title}</AppText>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.md,
  },
});
