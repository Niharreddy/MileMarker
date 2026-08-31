import React from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useDriveStore } from "../store/driveStore";

/** Shown once auto-detect has started a drive on its own, confirming it's tracking. */
export function AutoStartDriveDialog() {
  const theme = useAppTheme();
  const visible = useDriveStore((state) => state.autoStartNoticeVisible);
  const dismiss = useDriveStore((state) => state.dismissAutoStartNotice);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
          <AppText variant="titleMedium" style={styles.title}>
            Drive detected
          </AppText>
          <AppText color="secondary" style={styles.body}>
            Looks like you're driving — Mile Marker started tracking this drive automatically.
          </AppText>
          <AppButton label="Got it" onPress={dismiss} />
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
});
