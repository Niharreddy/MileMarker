import React from "react";
import { StyleSheet, View } from "react-native";

import { AppButton, MetaItem } from "@/components";
import { useTripStore } from "@/features/trips/store/tripStore";
import { spacing } from "@/theme";

import { useBackgroundDriveTracking } from "../hooks/useBackgroundDriveTracking";
import { useDriveStore } from "../store/driveStore";

/** The Home panel's single main action — Start Drive, or Stop Drive while recording — plus which Trip the drive will join. */
export function DriveControls() {
  const isRecording = useDriveStore((state) => state.activeDrive !== null);
  const hasPendingDrive = useDriveStore((state) => state.pendingDrive !== null);
  const activeTripName = useTripStore((state) => state.activeTrip?.name ?? null);
  const { startDrive, stopDrive } = useBackgroundDriveTracking();

  return (
    <View style={styles.container}>
      {activeTripName ? (
        <MetaItem
          icon="bag-suitcase-outline"
          label={isRecording ? `Part of trip: ${activeTripName}` : `Drives you start join trip: ${activeTripName}`}
          highlighted
        />
      ) : null}
      {isRecording ? (
        <AppButton label="Stop Drive" variant="danger" size="lg" icon="stop" onPress={stopDrive} />
      ) : (
        <AppButton label="Start Drive" size="lg" icon="play" disabled={hasPendingDrive} onPress={startDrive} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
});
