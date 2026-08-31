import React from "react";
import { Modal, StyleSheet } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AppButton, AppHeader, AppTextInput, ScreenContainer } from "@/components";
import { spacing } from "@/theme";

import { startTripSchema, type StartTripFormValues } from "../schema";
import { useTripStore } from "../store/tripStore";

export type StartTripDialogProps = {
  visible: boolean;
  onClose: () => void;
};

/** Shown when Start Trip is tapped — a trip always starts already named, unlike a Drive. */
export function StartTripDialog({ visible, onClose }: StartTripDialogProps) {
  const startTrip = useTripStore((state) => state.startTrip);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StartTripFormValues>({
    resolver: zodResolver(startTripSchema),
    defaultValues: { name: "", dateLabel: "" },
  });

  const handleClose = () => {
    reset({ name: "", dateLabel: "" });
    onClose();
  };

  const handleStart = (values: StartTripFormValues) => {
    startTrip(values);
    handleClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <ScreenContainer>
        <AppHeader title="Start Trip" />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <AppTextInput
              label="Trip name"
              value={field.value}
              onChangeText={field.onChange}
              autoFocus
              errorMessage={errors.name?.message}
              style={styles.field}
            />
          )}
        />

        <Controller
          control={control}
          name="dateLabel"
          render={({ field }) => (
            <AppTextInput
              label="Dates (optional)"
              placeholder="e.g. Aug 28 – Sept 2"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={errors.dateLabel?.message}
              style={styles.field}
            />
          )}
        />

        <AppButton label="Start Trip" onPress={handleSubmit(handleStart)} style={styles.field} />
        <AppButton label="Cancel" variant="text" onPress={handleClose} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
});
