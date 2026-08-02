import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useBackgroundTripTracking } from "../hooks/useBackgroundTripTracking";
import { useTripStore } from "../store/tripStore";

/** Floating Start/Stop Trip + Past Trips buttons, anchored under the map. */
export function TripControls() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const isRecording = useTripStore((state) => state.activeTrip !== null);
  const hasPendingTrip = useTripStore((state) => state.pendingTrip !== null);
  const isBackgroundTrackingActive = useTripStore((state) => state.isBackgroundTrackingActive);
  const { startTrip, stopTrip } = useBackgroundTripTracking();

  return (
    <View style={styles.container}>
      {isRecording ? (
        <AppText variant="labelMedium" color="secondary" style={styles.status}>
          {isBackgroundTrackingActive
            ? "Recording — keeps going in the background."
            : "Recording — keep the app open to keep tracking."}
        </AppText>
      ) : null}
      <View
        style={[
          styles.row,
          { backgroundColor: theme.palette.surface, shadowColor: theme.palette.textPrimary },
        ]}
      >
        <AppButton
          label={isRecording ? "Stop Trip" : "Start Trip"}
          variant={isRecording ? "outline" : "primary"}
          disabled={hasPendingTrip}
          onPress={isRecording ? stopTrip : startTrip}
          style={styles.button}
        />
        <AppButton
          label="Past Trips"
          variant="text"
          onPress={() => navigation.navigate("Trips")}
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.sm,
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
