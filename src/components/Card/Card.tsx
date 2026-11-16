import React, { type PropsWithChildren } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { radii, spacing, useAppTheme, type ShadowKey } from "@/theme";

export type CardProps = PropsWithChildren<{
  onPress?: () => void;
  /** Shadow level. Flat cards (`none`) get a hairline border instead, so they still read as a surface. */
  elevation?: ShadowKey;
  padded?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

/**
 * The app's standard raised surface — list rows, stat panels, settings
 * groups, floating map panels. Pressable when given `onPress`.
 */
export function Card({ children, onPress, elevation = "sm", padded = true, style }: CardProps) {
  const theme = useAppTheme();

  const cardStyle = [
    styles.card,
    theme.shadows[elevation],
    { backgroundColor: theme.palette.surface, borderColor: theme.palette.border },
    padded && styles.padded,
    style,
  ];

  if (!onPress) return <View style={cardStyle}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.palette.surfaceVariant }}
      style={({ pressed }) => [cardStyle, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  padded: {
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.85,
  },
});
