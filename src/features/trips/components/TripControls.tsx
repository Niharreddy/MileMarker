import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { v4 as uuid } from "uuid";

import { AppButton, AppText, Card } from "@/components";
import { useDriveStore } from "@/features/drives";
import { useCurrentLocation, useLocationPermission } from "@/features/map";
import { spacing, useAppTheme } from "@/theme";
import { formatDate } from "@/utils";

import { useTripStore } from "../store/tripStore";
import { AddTripCommentButton } from "./AddTripCommentButton";
import { StartTripDialog } from "./StartTripDialog";

/**
 * The card at the top of the Trips tab. Idle: a short explainer + Start
 * Trip. Active: the trip in progress with its running drive count, plus
 * Stop Trip and a Trip-comment button.
 */
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
    <Card elevation="md" style={styles.card}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: activeTrip ? theme.palette.primary : theme.palette.primaryContainer },
          ]}
        >
          <MaterialCommunityIcons
            name={activeTrip ? "bag-suitcase" : "bag-suitcase-outline"}
            size={22}
            color={activeTrip ? theme.palette.onPrimary : theme.palette.onPrimaryContainer}
          />
        </View>
        <View style={styles.titles}>
          {activeTrip ? (
            <>
              <AppText variant="labelSmall" style={{ color: theme.palette.primary }}>
                TRIP IN PROGRESS
              </AppText>
              <AppText variant="titleMedium" numberOfLines={1}>
                {activeTrip.name}
              </AppText>
              <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
                {driveCount} {driveCount === 1 ? "drive" : "drives"} so far · since{" "}
                {formatDate(activeTrip.startedAt)}
              </AppText>
            </>
          ) : (
            <>
              <AppText variant="titleMedium">Heading out?</AppText>
              <AppText variant="bodySmall" color="secondary">
                Start a trip and every drive you record until you stop it gets bundled together.
              </AppText>
            </>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {activeTrip ? (
          <>
            <AppButton label="Stop Trip" variant="outline" icon="stop" onPress={stopTrip} style={styles.button} />
            <AddTripCommentButton
              disabled={!coordinates}
              onSubmitComment={(text) => {
                if (!coordinates) return;
                addNoteToActiveTrip({ id: uuid(), text, coordinates, createdAt: Date.now() });
              }}
            />
          </>
        ) : (
          <AppButton
            label="Start Trip"
            icon="play"
            disabled={hasPendingTrip}
            onPress={() => setIsStartDialogVisible(true)}
            style={styles.button}
          />
        )}
      </View>

      <StartTripDialog visible={isStartDialogVisible} onClose={() => setIsStartDialogVisible(false)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
