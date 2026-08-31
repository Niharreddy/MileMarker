import React from "react";
import { StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useBackgroundDriveTracking } from "../hooks/useBackgroundDriveTracking";
import { useDriveStore } from "../store/driveStore";

/** Floating Start/Stop Drive + Past Drives buttons, anchored under the map. */
export function DriveControls() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const isRecording = useDriveStore((state) => state.activeDrive !== null);
  const hasPendingDrive = useDriveStore((state) => state.pendingDrive !== null);
  const isBackgroundTrackingActive = useDriveStore((state) => state.isBackgroundTrackingActive);
  const { startDrive, stopDrive } = useBackgroundDriveTracking();

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
          label={isRecording ? "Stop Drive" : "Start Drive"}
          variant={isRecording ? "outline" : "primary"}
          disabled={hasPendingDrive}
          onPress={isRecording ? stopDrive : startDrive}
          style={styles.button}
        />
        <AppButton
          label="Past Drives"
          variant="text"
          onPress={() => navigation.navigate("Drives")}
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
