import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppText, MetaItem, StatRow } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance } from "@/utils";

import { useDriveStore } from "../store/driveStore";

/**
 * Lifetime totals across every completed drive: drive count, total distance,
 * and "memories" (photos attached + one per drive with a written review).
 * Always shown, even as zeros, for a new user. Tapping it opens the full
 * Stats screen once there is something to show there.
 */
export function LifetimeStats() {
  const navigation = useNavigation();
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
    <Pressable
      disabled={driveCount === 0}
      onPress={() => navigation.navigate("Stats")}
      accessibilityRole="button"
      accessibilityLabel="View your stats"
      style={styles.container}
    >
      <View style={styles.header}>
        <AppText variant="labelMedium" color="secondary">
          {driveCount === 0 ? "Your first drive is one tap away" : "Your journey so far"}
        </AppText>
        {driveCount > 0 ? <MetaItem icon="chart-bar" label="See stats" highlighted /> : null}
      </View>
      <StatRow
        items={[
          { icon: "road-variant", label: "Drives", value: String(driveCount) },
          { icon: "map-marker-distance", label: "Distance", value: formatDistance(totalDistanceMeters, unitPreference) },
          { icon: "image-multiple-outline", label: "Memories", value: String(memoryCount) },
        ]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
