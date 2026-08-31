import React, { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";

import { AppButton, AppTextInput } from "@/components";
import { spacing, useAppTheme } from "@/theme";

export type AddTripCommentButtonProps = {
  disabled?: boolean;
  onSubmitComment: (text: string) => void;
};

/**
 * Same text-entry-modal shape as `features/map`'s `AddNoteButton`, but as an
 * inline button rather than a FAB — the Trips tab has no map for a FAB to
 * float over, unlike Home where a drive's notes are added.
 */
export function AddTripCommentButton({ disabled = false, onSubmitComment }: AddTripCommentButtonProps) {
  const theme = useAppTheme();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [text, setText] = useState("");

  const handleClose = () => {
    setIsModalVisible(false);
    setText("");
  };

  const handleSave = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmitComment(trimmed);
    handleClose();
  };

  return (
    <>
      <AppButton
        label="Add Comment"
        variant="outline"
        disabled={disabled}
        onPress={() => setIsModalVisible(true)}
        style={styles.button}
      />
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
            <AppTextInput
              label="What's happening on this trip?"
              value={text}
              onChangeText={setText}
              multiline
              numberOfLines={4}
              autoFocus
              style={styles.field}
            />
            <AppButton label="Save Comment" onPress={handleSave} style={styles.field} />
            <AppButton label="Cancel" variant="text" onPress={handleClose} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
  },
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
  field: {
    marginBottom: spacing.md,
  },
});
