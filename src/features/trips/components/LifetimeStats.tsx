import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";

import { calculateTripDistanceMeters, formatDistance } from "../distance";
import { useTripStore } from "../store/tripStore";

/**
 * Lifetime totals across every completed trip: trip count, total distance,
 * and "memories" (photos attached + one per trip with a written review).
 * Always shown, even as zeros, for a new user.
 */
export function LifetimeStats() {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pastTrips = useTripStore((state) => state.pastTrips);

  const { tripCount, totalDistanceMeters, memoryCount } = useMemo(() => {
    let totalDistanceMeters = 0;
    let memoryCount = 0;
    for (const trip of pastTrips) {
      totalDistanceMeters += calculateTripDistanceMeters(trip.points);
      memoryCount += trip.pins.length + (trip.review.trim() ? 1 : 0);
    }
    return { tripCount: pastTrips.length, totalDistanceMeters, memoryCount };
  }, [pastTrips]);

  return (
    <View style={[styles.container, { backgroundColor: theme.palette.surfaceVariant }]}>
      <Stat label="Trips" value={String(tripCount)} />
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
