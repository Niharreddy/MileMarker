import React from "react";
import { StyleSheet } from "react-native";

import { AppButton, AppDialog, AppText } from "@/components";
import { spacing } from "@/theme";

import { useDriveStore } from "../store/driveStore";

/** Shown once auto-detect has started a drive on its own, confirming it's tracking. */
export function AutoStartDriveDialog() {
  const visible = useDriveStore((state) => state.autoStartNoticeVisible);
  const dismiss = useDriveStore((state) => state.dismissAutoStartNotice);

  return (
    <AppDialog visible={visible} title="Drive detected" onClose={dismiss}>
      <AppText color="secondary" style={styles.body}>
        Looks like you're driving — Mile Marker started tracking this drive automatically.
      </AppText>
      <AppButton label="Got it" onPress={dismiss} />
    </AppDialog>
  );
}

const styles = StyleSheet.create({
  body: {
    marginBottom: spacing.lg,
  },
});
