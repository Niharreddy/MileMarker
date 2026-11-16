import React, { useMemo, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Switch } from "react-native-paper";

import {
  AppButton,
  AppHeader,
  AppText,
  Card,
  ScreenContainer,
  SectionHeader,
  SegmentedControl,
  StatRow,
  type IconName,
  type SegmentedOption,
} from "@/components";
import { exportAllData, importDataFromFile, useDriveStore } from "@/features/drives";
import { useTripStore } from "@/features/trips";
import { useSettingsStore, type ThemePreference, type UnitPreference } from "@/store";
import { spacing, useAppTheme } from "@/theme";

import appConfig from "../../../app.json";

const THEME_OPTIONS: readonly SegmentedOption<ThemePreference>[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const UNIT_OPTIONS: readonly SegmentedOption<UnitPreference>[] = [
  { value: "metric", label: "Kilometers" },
  { value: "imperial", label: "Miles" },
];

function SettingLabel({ icon, title, description }: { icon: IconName; title: string; description?: string }) {
  const theme = useAppTheme();

  return (
    <View style={styles.labelRow}>
      <MaterialCommunityIcons name={icon} size={20} color={theme.palette.primary} style={styles.labelIcon} />
      <View style={styles.labelText}>
        <AppText variant="titleSmall">{title}</AppText>
        {description ? (
          <AppText variant="bodySmall" color="secondary">
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

/** App preferences (theme, units, auto-detect), data export/import, and a little "about". */
export function SettingsScreen() {
  const theme = useAppTheme();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const setUnitPreference = useSettingsStore((state) => state.setUnitPreference);
  const autoDetectDrivingEnabled = useSettingsStore((state) => state.autoDetectDrivingEnabled);
  const setAutoDetectDrivingEnabled = useSettingsStore((state) => state.setAutoDetectDrivingEnabled);
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const pastTrips = useTripStore((state) => state.pastTrips);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const mediaCount = useMemo(
    () =>
      pastDrives.reduce((total, drive) => total + drive.pins.length, 0) +
      pastTrips.reduce((total, trip) => total + trip.pins.length, 0),
    [pastDrives, pastTrips]
  );

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportAllData();
    } catch (err) {
      Alert.alert("Export failed", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      const { importedCount } = await importDataFromFile();
      if (importedCount > 0) {
        Alert.alert("Import complete", `Added ${importedCount} drive${importedCount === 1 ? "" : "s"}.`);
      }
    } catch (err) {
      Alert.alert("Import failed", err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ScreenContainer scrollable edges={["top", "left", "right"]}>
      <AppHeader title="Settings" />

      <SectionHeader title="Appearance" style={styles.firstSection} />
      <Card style={styles.card}>
        <SettingLabel icon="theme-light-dark" title="Theme" />
        <SegmentedControl options={THEME_OPTIONS} value={themePreference} onChange={setThemePreference} />
      </Card>

      <SectionHeader title="Driving" />
      <Card style={styles.card}>
        <SettingLabel icon="map-marker-distance" title="Distance units" />
        <SegmentedControl options={UNIT_OPTIONS} value={unitPreference} onChange={setUnitPreference} />

        <View style={[styles.divider, { backgroundColor: theme.palette.border }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <SettingLabel
              icon="car-connected"
              title="Auto-detect driving"
              description="Start recording automatically when Mile Marker notices you're driving — even if the app is closed. Only kicks in at sustained driving speed, not walking."
            />
          </View>
          <Switch value={autoDetectDrivingEnabled} onValueChange={setAutoDetectDrivingEnabled} />
        </View>
      </Card>

      <SectionHeader title="Your data" />
      <Card style={styles.card}>
        <StatRow
          items={[
            { label: pastDrives.length === 1 ? "Drive" : "Drives", value: String(pastDrives.length) },
            { label: pastTrips.length === 1 ? "Trip" : "Trips", value: String(pastTrips.length) },
            { label: "Photos & videos", value: String(mediaCount) },
          ]}
        />

        <View style={[styles.divider, { backgroundColor: theme.palette.border }]} />

        <SettingLabel
          icon="database-export-outline"
          title="Back up & restore"
          description="Export every drive — routes, photos, and notes — to a single file you can keep safe or move to another device, or import one back in."
        />
        <View style={styles.buttonRow}>
          <AppButton
            label="Export"
            variant="outline"
            icon="export-variant"
            loading={isExporting}
            disabled={isExporting || pastDrives.length === 0}
            onPress={handleExport}
            style={styles.flexButton}
          />
          <AppButton
            label="Import"
            variant="outline"
            icon="import"
            loading={isImporting}
            disabled={isImporting}
            onPress={handleImport}
            style={styles.flexButton}
          />
        </View>
      </Card>

      <SectionHeader title="About" />
      <Card style={styles.card}>
        <SettingLabel
          icon="shield-lock-outline"
          title="Private by design"
          description="Everything you record stays on this device. No account, no cloud, no tracking."
        />
        <AppText variant="bodySmall" color="secondary">
          {appConfig.expo.name} · version {appConfig.expo.version}
        </AppText>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  firstSection: {
    marginTop: 0,
  },
  card: {
    gap: spacing.md,
  },
  labelRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  labelIcon: {
    marginTop: 1,
  },
  labelText: {
    flex: 1,
    gap: spacing.xxs,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  switchLabel: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  flexButton: {
    flex: 1,
  },
});
