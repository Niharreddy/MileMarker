import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, formatMinutes } from "@/utils";

import type { Drive } from "../types";

export type DriveRecordingStatsProps = {
  drive: Drive;
};

/** Live elapsed time / distance / photo count for the drive currently being recorded. */
export function DriveRecordingStats({ drive }: DriveRecordingStatsProps) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const elapsedMinutes = Math.max(0, Math.floor((now - drive.startedAt) / 60_000));
  const distanceMeters = calculateRouteDistanceMeters(drive.points);

  return (
    <View style={[styles.container, { backgroundColor: theme.palette.surfaceVariant }]}>
      <Stat label="Elapsed" value={formatMinutes(elapsedMinutes)} />
      <Stat label="Distance" value={formatDistance(distanceMeters, unitPreference)} />
      <Stat label="Photos" value={String(drive.pins.length)} />
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
