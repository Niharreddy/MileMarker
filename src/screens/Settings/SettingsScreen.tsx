import React from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppHeader, AppText, ScreenContainer } from "@/components";
import { useSettingsStore, type ThemePreference } from "@/store";
import { spacing } from "@/theme";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

/**
 * App preferences. Doubles as the Phase 1 proof-of-life for the state
 * layer: the theme toggle below reads/writes `settingsStore`, which is
 * persisted to MMKV, and the whole app re-themes immediately — confirming
 * Zustand, MMKV, and the theme system are wired together correctly.
 */
export function SettingsScreen() {
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <ScreenContainer>
      <AppHeader title="Settings" />

      <AppText variant="titleSmall" color="secondary" style={styles.sectionLabel}>
        Appearance
      </AppText>
      <View style={styles.optionRow}>
        {THEME_OPTIONS.map((option) => (
          <AppButton
            key={option.value}
            label={option.label}
            variant={themePreference === option.value ? "primary" : "outline"}
            onPress={() => setThemePreference(option.value)}
            style={styles.optionButton}
          />
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  sectionLabel: {
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
  },
});
