import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";

import { calculateTripDistanceMeters, formatDistance } from "../distance";
import { formatMinutes } from "../formatters";
import type { Trip } from "../types";

export type TripRecordingStatsProps = {
  trip: Trip;
};

/** Live elapsed time / distance / photo count for the trip currently being recorded. */
export function TripRecordingStats({ trip }: TripRecordingStatsProps) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMinutes = Math.max(0, Math.floor((now - trip.startedAt) / 60_000));
  const distanceMeters = calculateTripDistanceMeters(trip.points);

  return (
    <View style={[styles.container, { backgroundColor: theme.palette.surfaceVariant }]}>
      <Stat label="Elapsed" value={formatMinutes(elapsedMinutes)} />
      <Stat label="Distance" value={formatDistance(distanceMeters, unitPreference)} />
      <Stat label="Photos" value={String(trip.pins.length)} />
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
    marginTop: spacing.md,
  },
  stat: {
    alignItems: "center",
  },
});
