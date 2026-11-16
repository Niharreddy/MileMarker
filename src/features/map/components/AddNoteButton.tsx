import React, { useState } from "react";
import { Modal, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { FAB } from "react-native-paper";

import { AppButton, AppTextInput } from "@/components";
import { spacing, useAppTheme } from "@/theme";

export type AddNoteButtonProps = {
  /** Disable when there's nothing meaningful to attach a note to (e.g. no active trip, no location yet). */
  disabled?: boolean;
  onSubmitNote: (text: string) => void;
  /** Overrides the default absolute placement — e.g. to stack it in a host-owned column of map controls. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Floating action button next to `AddPinButton`: opens a small text-entry
 * modal and hands the trimmed note back to the caller on save. Same
 * has-no-opinion-on-persistence split as the photo button — the trips
 * feature decides where the note ends up.
 */
export function AddNoteButton({ disabled = false, onSubmitNote, style }: AddNoteButtonProps) {
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
    onSubmitNote(trimmed);
    handleClose();
  };

  return (
    <>
      <FAB
        icon="comment-plus-outline"
        style={[styles.fab, { backgroundColor: theme.palette.success }, style]}
        color={theme.palette.onPrimary}
        disabled={disabled}
        onPress={() => setIsModalVisible(true)}
      />
      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={handleClose}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
            <AppTextInput
              label="What's happening here?"
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
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.lg + 64,
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
