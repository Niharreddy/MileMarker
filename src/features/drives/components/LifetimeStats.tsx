import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance } from "@/utils";

import { useDriveStore } from "../store/driveStore";

/**
 * Lifetime totals across every completed drive: drive count, total distance,
 * and "memories" (photos attached + one per drive with a written review).
 * Always shown, even as zeros, for a new user.
 */
export function LifetimeStats() {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pastDrives = useDriveStore((state) => state.pastDrives);

  const { driveCount, totalDistanceMeters, memoryCount } = useMemo(() => {
    let totalDistanceMeters = 0;
    let memoryCount = 0;
    for (const drive of pastDrives) {
      totalDistanceMeters += calculateRouteDistanceMeters(drive.points);
      memoryCount += drive.pins.length + (drive.review.trim() ? 1 : 0);
    }
    return { driveCount: pastDrives.length, totalDistanceMeters, memoryCount };
  }, [pastDrives]);

  return (
    <View style={[styles.container, { backgroundColor: theme.palette.surfaceVariant }]}>
      <Stat label="Drives" value={String(driveCount)} />
      <Stat label="Distance" value={formatDistance(totalDistanceMeters, unitPreference)} />
      <Stat label="Memories" value={String(memoryCount)} />
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="titleMedium">{value}</AppText>
      <AppText variant="labelSmall" color="secondary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 12,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  stat: {
    alignItems: "center",
  },
});
