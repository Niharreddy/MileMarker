import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { spacing } from "@/theme";

import { AppButton } from "../AppButton";
import { AppDialog } from "../AppDialog";
import { AppTextInput } from "../AppTextInput";

const MAX_REVIEW_LENGTH = 500;

export type EditDetailsDialogProps = {
  visible: boolean;
  title: string;
  nameLabel: string;
  reviewLabel: string;
  initialName: string;
  initialReview: string;
  onSave: (details: { name: string; review: string }) => void;
  onClose: () => void;
};

/** Edits the name + free-text description of something already saved (a drive or a trip). */
export function EditDetailsDialog({
  visible,
  title,
  nameLabel,
  reviewLabel,
  initialName,
  initialReview,
  onSave,
  onClose,
}: EditDetailsDialogProps) {
  const [name, setName] = useState(initialName);
  const [review, setReview] = useState(initialReview);
  const [showErrors, setShowErrors] = useState(false);

  // Re-seed from the saved values each time the dialog opens, discarding any abandoned draft.
  useEffect(() => {
    if (!visible) return;
    setName(initialName);
    setReview(initialReview);
    setShowErrors(false);
  }, [visible, initialName, initialReview]);

  const nameError = name.trim() ? undefined : "A name is required";
  const reviewError =
    review.trim().length > MAX_REVIEW_LENGTH ? `Keep it under ${MAX_REVIEW_LENGTH} characters` : undefined;

  const handleSave = () => {
    if (nameError || reviewError) {
      setShowErrors(true);
      return;
    }
    onSave({ name: name.trim(), review: review.trim() });
    onClose();
  };

  return (
    <AppDialog visible={visible} title={title} onClose={onClose}>
      <View style={styles.field}>
        <AppTextInput
          label={nameLabel}
          value={name}
          onChangeText={setName}
          errorMessage={showErrors ? nameError : undefined}
        />
      </View>
      <View style={styles.field}>
        <AppTextInput
          label={reviewLabel}
          value={review}
          onChangeText={setReview}
          multiline
          numberOfLines={4}
          errorMessage={showErrors ? reviewError : undefined}
        />
      </View>
      <View style={styles.actions}>
        <AppButton label="Cancel" variant="text" onPress={onClose} />
        <AppButton label="Save" onPress={handleSave} />
      </View>
    </AppDialog>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },
});
