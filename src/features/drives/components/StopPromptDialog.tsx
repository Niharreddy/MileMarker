import React from "react";
import { StyleSheet } from "react-native";

import { AppButton, AppDialog, AppText } from "@/components";
import { spacing } from "@/theme";

import { useBackgroundDriveTracking } from "../hooks/useBackgroundDriveTracking";
import { useDriveStore } from "../store/driveStore";

/**
 * Shown after the active drive has sat stationary for a while, instead of
 * silently auto-stopping — that would otherwise chop a drive into pieces
 * every time you park at a viewpoint. "Keep Recording" (also what
 * dismissing the dialog does) just resets the stopped-timer, so it'll ask
 * again after another full stopped stretch.
 */
export function StopPromptDialog() {
  const visible = useDriveStore((state) => state.stopPromptVisible);
  const acknowledgeStopPrompt = useDriveStore((state) => state.acknowledgeStopPrompt);
  const keepRecordingAfterStop = useDriveStore((state) => state.keepRecordingAfterStop);
  const { stopDrive } = useBackgroundDriveTracking();

  const handleStop = () => {
    acknowledgeStopPrompt();
    stopDrive();
  };

  return (
    <AppDialog visible={visible} title="Still on this drive?" onClose={keepRecordingAfterStop}>
      <AppText color="secondary" style={styles.body}>
        You've been stopped for about 10 minutes. Stop tracking this drive, or keep it going?
      </AppText>
      <AppButton label="Stop Drive" onPress={handleStop} style={styles.button} />
      <AppButton label="Keep Recording" variant="outline" onPress={keepRecordingAfterStop} />
    </AppDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    marginBottom: spacing.lg,
  },
  button: {
    marginBottom: spacing.sm,
  },
});
