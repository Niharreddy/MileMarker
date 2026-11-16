import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme";

import { AppText } from "../AppText";

export type AppHeaderProps = {
  title: string;
  /** One-line summary under the title, e.g. "12 drives · 340 mi". */
  subtitle?: string;
  right?: ReactNode;
};

/**
 * In-content screen header (large title + optional subtitle and
 * right-aligned action slot). Tab screens render this instead of a native
 * React Navigation header (`headerShown: false` in `BottomTabNavigator`) so
 * header styling stays consistent with the rest of the design system and
 * isn't split across two theming systems.
 */
export function AppHeader({ title, subtitle, right }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.titles}>
        <AppText variant="headlineLarge" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText color="secondary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
});
