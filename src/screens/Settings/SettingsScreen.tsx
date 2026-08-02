import React from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, AppHeader, AppText, ScreenContainer } from "@/components";
import { useSettingsStore, type ThemePreference, type UnitPreference } from "@/store";
import { spacing } from "@/theme";

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const UNIT_OPTIONS: { value: UnitPreference; label: string }[] = [
  { value: "metric", label: "Kilometers" },
  { value: "imperial", label: "Miles" },
];

const AUTO_DETECT_OPTIONS: { value: boolean; label: string }[] = [
  { value: true, label: "On" },
  { value: false, label: "Off" },
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
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const setUnitPreference = useSettingsStore((state) => state.setUnitPreference);
  const autoDetectDrivingEnabled = useSettingsStore((state) => state.autoDetectDrivingEnabled);
  const setAutoDetectDrivingEnabled = useSettingsStore((state) => state.setAutoDetectDrivingEnabled);

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

      <AppText variant="titleSmall" color="secondary" style={[styles.sectionLabel, styles.sectionSpacing]}>
        Distance units
      </AppText>
      <View style={styles.optionRow}>
        {UNIT_OPTIONS.map((option) => (
          <AppButton
            key={option.value}
            label={option.label}
            variant={unitPreference === option.value ? "primary" : "outline"}
            onPress={() => setUnitPreference(option.value)}
            style={styles.optionButton}
          />
        ))}
      </View>

      <AppText variant="titleSmall" color="secondary" style={[styles.sectionLabel, styles.sectionSpacing]}>
        Auto-detect driving
      </AppText>
      <AppText color="secondary" style={styles.helperText}>
        Automatically start recording when Mile Marker notices you're driving — works even if the app is
        closed. Only kicks in for sustained driving speed, not walking.
      </AppText>
      <View style={styles.optionRow}>
        {AUTO_DETECT_OPTIONS.map((option) => (
          <AppButton
            key={String(option.value)}
            label={option.label}
            variant={autoDetectDrivingEnabled === option.value ? "primary" : "outline"}
            onPress={() => setAutoDetectDrivingEnabled(option.value)}
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
  sectionSpacing: {
    marginTop: spacing.lg,
  },
  helperText: {
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
