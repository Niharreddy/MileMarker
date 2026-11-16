import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { AppText, StatRow } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, formatElapsed } from "@/utils";

import { useDriveStore } from "../store/driveStore";
import type { Drive } from "../types";

export type DriveRecordingStatsProps = {
  drive: Drive;
};

/** Live "Recording" banner + elapsed time / distance / photo / note counts for the drive currently being recorded. */
export function DriveRecordingStats({ drive }: DriveRecordingStatsProps) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const isBackgroundTrackingActive = useDriveStore((state) => state.isBackgroundTrackingActive);
  const [now, setNow] = useState(() => Date.now());
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const distanceMeters = calculateRouteDistanceMeters(drive.points);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Animated.View style={[styles.dot, { backgroundColor: theme.palette.error, opacity: pulse }]} />
        <AppText variant="labelLarge" style={{ color: theme.palette.error }}>
          Recording
        </AppText>
        <AppText variant="labelSmall" color="secondary" style={styles.hint} numberOfLines={1}>
          {isBackgroundTrackingActive ? "Keeps going in the background" : "Keep the app open to keep tracking"}
        </AppText>
      </View>
      <StatRow
        items={[
          { icon: "timer-outline", label: "Elapsed", value: formatElapsed(now - drive.startedAt) },
          { icon: "map-marker-distance", label: "Distance", value: formatDistance(distanceMeters, unitPreference) },
          { icon: "image-outline", label: "Photos", value: String(drive.pins.length) },
          { icon: "comment-text-outline", label: "Notes", value: String(drive.notes.length) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hint: {
    flex: 1,
    textAlign: "right",
  },
});
