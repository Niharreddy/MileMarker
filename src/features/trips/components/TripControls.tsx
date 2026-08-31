import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { v4 as uuid } from "uuid";

import { AppButton, AppText } from "@/components";
import { useDriveStore } from "@/features/drives";
import { useCurrentLocation, useLocationPermission } from "@/features/map";
import { spacing, useAppTheme } from "@/theme";

import { useTripStore } from "../store/tripStore";
import { AddTripCommentButton } from "./AddTripCommentButton";
import { StartTripDialog } from "./StartTripDialog";

/** Start/Stop Trip button + (while active) a Trip-comment button and a running drive count, anchored above the trips list. */
export function TripControls() {
  const theme = useAppTheme();
  const locationPermission = useLocationPermission();
  const { coordinates } = useCurrentLocation(locationPermission.isGranted);
  const [isStartDialogVisible, setIsStartDialogVisible] = useState(false);

  const activeTrip = useTripStore((state) => state.activeTrip);
  const hasPendingTrip = useTripStore((state) => state.pendingTrip !== null);
  const stopTrip = useTripStore((state) => state.stopTrip);
  const addNoteToActiveTrip = useTripStore((state) => state.addNoteToActiveTrip);

  const activeDrive = useDriveStore((state) => state.activeDrive);
  const pastDrives = useDriveStore((state) => state.pastDrives);

  const driveCount = activeTrip
    ? pastDrives.filter((drive) => drive.tripId === activeTrip.id).length +
      (activeDrive?.tripId === activeTrip.id ? 1 : 0)
    : 0;

  return (
    <View style={styles.container}>
      {activeTrip ? (
        <AppText variant="labelMedium" color="secondary" style={styles.status}>
          {activeTrip.name} — {driveCount} {driveCount === 1 ? "drive" : "drives"} so far.
        </AppText>
      ) : null}

      <View
        style={[
          styles.row,
          { backgroundColor: theme.palette.surface, shadowColor: theme.palette.textPrimary },
        ]}
      >
        <AppButton
          label={activeTrip ? "Stop Trip" : "Start Trip"}
          variant={activeTrip ? "outline" : "primary"}
          disabled={hasPendingTrip}
          onPress={activeTrip ? stopTrip : () => setIsStartDialogVisible(true)}
          style={styles.button}
        />
        {activeTrip ? (
          <AddTripCommentButton
            disabled={!coordinates}
            onSubmitComment={(text) => {
              if (!coordinates) return;
              addNoteToActiveTrip({ id: uuid(), text, coordinates, createdAt: Date.now() });
            }}
          />
        ) : null}
      </View>

      <StartTripDialog visible={isStartDialogVisible} onClose={() => setIsStartDialogVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  status: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: 16,
    padding: spacing.sm,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  button: {
    flex: 1,
  },
});
