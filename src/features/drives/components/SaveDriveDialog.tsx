import React, { useEffect } from "react";
import { Alert, Modal, StyleSheet } from "react-native";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AppButton, AppHeader, AppTextInput, Card, ScreenContainer, StatRow } from "@/components";
import { useSettingsStore } from "@/store";
import { spacing } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, formatDuration, formatStartedAt } from "@/utils";

import { saveDriveSchema, type SaveDriveFormValues } from "../schema";
import { useDriveStore } from "../store/driveStore";

/**
 * Shown whenever `driveStore.pendingDrive` is set (i.e. right after "Stop
 * Drive"). Requires a name before the drive can be filed into past drives;
 * review/notes are optional. "Discard" drops the recording entirely, after
 * a confirmation — it can't be undone.
 */
export function SaveDriveDialog() {
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pendingDrive = useDriveStore((state) => state.pendingDrive);
  const saveDrive = useDriveStore((state) => state.saveDrive);
  const discardPendingDrive = useDriveStore((state) => state.discardPendingDrive);
  const pendingDriveId = pendingDrive?.id;

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SaveDriveFormValues>({
    resolver: zodResolver(saveDriveSchema),
    defaultValues: { name: "", review: "" },
  });

  // Keyed on the id, not the object: auto-matched photos replace `pendingDrive`
  // a moment after the dialog opens, and that mustn't wipe what's been typed.
  useEffect(() => {
    const drive = useDriveStore.getState().pendingDrive;
    if (drive) reset({ name: `Drive on ${formatStartedAt(drive.startedAt)}`, review: "" });
  }, [pendingDriveId, reset]);

  if (!pendingDrive) return null;

  const confirmDiscard = () => {
    Alert.alert("Discard this drive?", "The route, photos, and notes from this recording will be permanently deleted.", [
      { text: "Keep", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: discardPendingDrive },
    ]);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={() => {}}>
      <ScreenContainer scrollable>
        <AppHeader title="Save Drive" subtitle="Nice drive — give it a name to remember it by." />

        <Card style={styles.field}>
          <StatRow
            items={[
              {
                icon: "map-marker-distance",
                label: "Distance",
                value: formatDistance(calculateRouteDistanceMeters(pendingDrive.points), unitPreference),
              },
              {
                icon: "clock-outline",
                label: "Duration",
                value: formatDuration(pendingDrive.startedAt, pendingDrive.endedAt),
              },
              { icon: "image-outline", label: "Photos", value: String(pendingDrive.pins.length) },
            ]}
          />
        </Card>

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

        <AppButton
          label="Save Drive"
          size="lg"
          icon="check"
          onPress={handleSubmit(saveDrive)}
          style={styles.field}
        />
        <AppButton label="Discard Drive" variant="text" onPress={confirmDiscard} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
});
