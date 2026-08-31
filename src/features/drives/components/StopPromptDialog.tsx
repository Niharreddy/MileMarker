import React from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useBackgroundDriveTracking } from "../hooks/useBackgroundDriveTracking";
import { useDriveStore } from "../store/driveStore";

/**
 * Shown after the active drive has sat stationary for a while, instead of
 * silently auto-stopping — that would otherwise chop a drive into pieces
 * every time you park at a viewpoint. "Keep Recording" just resets the
 * stopped-timer, so it'll ask again after another full stopped stretch.
 */
export function StopPromptDialog() {
  const theme = useAppTheme();
  const visible = useDriveStore((state) => state.stopPromptVisible);
  const acknowledgeStopPrompt = useDriveStore((state) => state.acknowledgeStopPrompt);
  const keepRecordingAfterStop = useDriveStore((state) => state.keepRecordingAfterStop);
  const { stopDrive } = useBackgroundDriveTracking();

  if (!visible) return null;

  const handleStop = () => {
    acknowledgeStopPrompt();
    stopDrive();
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={keepRecordingAfterStop}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
          <AppText variant="titleMedium" style={styles.title}>
            Still on this drive?
          </AppText>
          <AppText color="secondary" style={styles.body}>
            You've been stopped for about 10 minutes. Stop tracking this drive, or keep it going?
          </AppText>
          <AppButton label="Stop Drive" onPress={handleStop} style={styles.button} />
          <AppButton label="Keep Recording" variant="outline" onPress={keepRecordingAfterStop} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  card: {
    width: "100%",
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.xs,
  },
  body: {
    marginBottom: spacing.lg,
  },
  button: {
    marginBottom: spacing.sm,
  },
});
