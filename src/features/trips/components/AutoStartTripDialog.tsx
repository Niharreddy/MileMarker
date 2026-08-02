import React from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { useTripStore } from "../store/tripStore";

/** Shown once auto-detect has started a trip on its own, confirming it's tracking. */
export function AutoStartTripDialog() {
  const theme = useAppTheme();
  const visible = useTripStore((state) => state.autoStartNoticeVisible);
  const dismiss = useTripStore((state) => state.dismissAutoStartNotice);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
          <AppText variant="titleMedium" style={styles.title}>
            Trip detected
          </AppText>
          <AppText color="secondary" style={styles.body}>
            Looks like you're driving — Mile Marker started tracking this trip automatically.
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
