import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { spacing, useAppTheme } from "@/theme";

import { AppText } from "../AppText";

export type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export type StatItem = {
  label: string;
  value: string;
  icon?: IconName;
};

export type StatRowProps = {
  items: StatItem[];
  style?: StyleProp<ViewStyle>;
};

/** Evenly-spaced row of headline numbers (distance, duration, counts…), separated by hairline dividers. */
export function StatRow({ items, style }: StatRowProps) {
  const theme = useAppTheme();

  return (
    <View style={[styles.row, style]}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 ? <View style={[styles.divider, { backgroundColor: theme.palette.border }]} /> : null}
          <View style={styles.stat}>
            {item.icon ? (
              <MaterialCommunityIcons name={item.icon} size={18} color={theme.palette.primary} />
            ) : null}
            <AppText variant="titleMedium" numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </AppText>
            <AppText variant="labelSmall" color="secondary" numberOfLines={1}>
              {item.label}
            </AppText>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    marginVertical: spacing.xs,
  },
});
