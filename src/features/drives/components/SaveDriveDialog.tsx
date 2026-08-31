import React, { useEffect } from "react";
import { Modal, StyleSheet } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AppButton, AppHeader, AppTextInput, ScreenContainer } from "@/components";
import { spacing } from "@/theme";
import { formatStartedAt } from "@/utils";

import { saveDriveSchema, type SaveDriveFormValues } from "../schema";
import { useDriveStore } from "../store/driveStore";

/**
 * Shown whenever `driveStore.pendingDrive` is set (i.e. right after "Stop
 * Drive"). Requires a name before the drive can be filed into past drives;
 * review/notes are optional. "Discard" drops the recording entirely.
 */
export function SaveDriveDialog() {
  const pendingDrive = useDriveStore((state) => state.pendingDrive);
  const saveDrive = useDriveStore((state) => state.saveDrive);
  const discardPendingDrive = useDriveStore((state) => state.discardPendingDrive);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaveDriveFormValues>({
    resolver: zodResolver(saveDriveSchema),
    defaultValues: { name: "", review: "" },
  });

  useEffect(() => {
    if (pendingDrive) {
      reset({ name: `Drive on ${formatStartedAt(pendingDrive.startedAt)}`, review: "" });
    }
  }, [pendingDrive, reset]);

  if (!pendingDrive) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={() => {}}>
      <ScreenContainer>
        <AppHeader title="Save Drive" />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <AppTextInput
              label="Drive name"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.name?.message}
              style={styles.field}
            />
          )}
        />

        <Controller
          control={control}
          name="review"
          render={({ field }) => (
            <AppTextInput
              label="Notes / review (optional)"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              errorMessage={errors.review?.message}
              style={styles.field}
            />
          )}
        />

        <AppButton label="Save Drive" onPress={handleSubmit(saveDrive)} style={styles.field} />
        <AppButton label="Discard Drive" variant="text" onPress={discardPendingDrive} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
});
