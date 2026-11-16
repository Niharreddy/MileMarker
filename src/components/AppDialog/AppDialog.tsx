import React, { type PropsWithChildren } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet } from "react-native";

import { radii, spacing, useAppTheme } from "@/theme";

import { AppText } from "../AppText";

export type AppDialogProps = PropsWithChildren<{
  visible: boolean;
  title?: string;
  /** Called for the hardware back button and for a tap on the dimmed backdrop. */
  onClose: () => void;
}>;

/** Centered card over a dimmed backdrop — the shell for small confirm/edit dialogs. Stays above the keyboard. */
export function AppDialog({ visible, title, onClose, children }: AppDialogProps) {
  const theme = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          {/* Swallows taps so pressing inside the card doesn't dismiss the dialog. */}
          <Pressable
            style={[styles.card, theme.shadows.lg, { backgroundColor: theme.palette.surface }]}
            onPress={() => {}}
          >
            {title ? (
              <AppText variant="titleLarge" style={styles.title}>
                {title}
              </AppText>
            ) : null}
            {children}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  card: {
    width: "100%",
    maxWidth: 480,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
});
