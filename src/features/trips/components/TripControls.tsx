import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useBackgroundTripTracking } from "../hooks/useBackgroundTripTracking";
import { useTripStore } from "../store/tripStore";

/** Bottom bar on Home: Start/Stop Trip toggle + a link to the Trips tab. */
export function TripControls() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const isRecording = useTripStore((state) => state.activeTrip !== null);
  const hasPendingTrip = useTripStore((state) => state.pendingTrip !== null);
  const isBackgroundTrackingActive = useTripStore((state) => state.isBackgroundTrackingActive);
  const { startTrip, stopTrip } = useBackgroundTripTracking();

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: theme.palette.border, backgroundColor: theme.palette.surface },
      ]}
    >
      {isRecording ? (
        <AppText variant="labelMedium" color="secondary" style={styles.status}>
          {isBackgroundTrackingActive
            ? "Recording — keeps going in the background."
            : "Recording — keep the app open to keep tracking."}
        </AppText>
      ) : null}
      <View style={styles.row}>
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  status: {
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});
