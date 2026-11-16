import React, { type PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";

import { spacing, useAppTheme } from "@/theme";

export type ScreenContainerProps = PropsWithChildren<{
  scrollable?: boolean;
  edges?: readonly Edge[];
  style?: StyleProp<ViewStyle>;
}>;

/**
 * Standard screen root: safe-area handling + themed background + consistent
 * horizontal padding. Every top-level screen should render this instead of
 * a bare `View`, so safe-area and background-color behavior stays uniform.
 */
export function ScreenContainer({
  children,
  scrollable = false,
  edges = ["top", "bottom", "left", "right"],
  style,
}: ScreenContainerProps) {
  const theme = useAppTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.safeArea, { backgroundColor: theme.palette.background }]}
    >
      {scrollable ? (
        // `flexGrow` (not `flex: 1`) on the content container: `flex: 1` pins
        // it to the viewport height, which clips anything taller instead of
        // letting it scroll.
        <ScrollView
          contentContainerStyle={[styles.scrollContent, style]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
});
