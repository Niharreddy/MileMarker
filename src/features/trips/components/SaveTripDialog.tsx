import React, { useEffect } from "react";
import { Modal, StyleSheet } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AppButton, AppHeader, AppTextInput, ScreenContainer } from "@/components";
import { spacing } from "@/theme";

import { saveTripSchema, type SaveTripFormValues } from "../schema";
import { useTripStore } from "../store/tripStore";

/**
 * Shown whenever `tripStore.pendingTrip` is set (i.e. right after "Stop
 * Trip"). The trip is already named (captured at Start Trip) — this is a
 * chance to adjust the name and add/edit the description before it's filed
 * into past trips. "Discard" drops the bundle entirely — its member drives
 * are unaffected either way, since drives always live on their own.
 */
export function SaveTripDialog() {
  const pendingTrip = useTripStore((state) => state.pendingTrip);
  const saveTrip = useTripStore((state) => state.saveTrip);
  const discardPendingTrip = useTripStore((state) => state.discardPendingTrip);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaveTripFormValues>({
    resolver: zodResolver(saveTripSchema),
    defaultValues: { name: "", review: "" },
  });

  useEffect(() => {
    if (pendingTrip) {
      reset({ name: pendingTrip.name, review: pendingTrip.review });
    }
  }, [pendingTrip, reset]);

  if (!pendingTrip) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={() => {}}>
      <ScreenContainer>
        <AppHeader title="Save Trip" />

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <AppTextInput
              label="Trip name"
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
              label="Description (optional)"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={4}
              errorMessage={errors.review?.message}
              style={styles.field}
            />
          )}
        />

        <AppButton label="Save Trip" onPress={handleSubmit(saveTrip)} style={styles.field} />
        <AppButton label="Discard Trip" variant="text" onPress={discardPendingTrip} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
});
