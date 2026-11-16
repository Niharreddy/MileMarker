import React, { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, View } from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { AppButton, AppHeader, AppText, AppTextInput, ScreenContainer } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { startTripSchema, type StartTripFormValues } from "../schema";
import { useTripStore } from "../store/tripStore";

export type StartTripDialogProps = {
  visible: boolean;
  onClose: () => void;
};

function formatPickedDate(date: Date) {
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Shown when Start Trip is tapped — a trip always starts already named, unlike a Drive. The date range is optional and purely descriptive (see `Trip.dateLabel`). */
export function StartTripDialog({ visible, onClose }: StartTripDialogProps) {
  const theme = useAppTheme();
  const startTrip = useTripStore((state) => state.startTrip);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [activePicker, setActivePicker] = useState<"start" | "end" | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StartTripFormValues>({
    resolver: zodResolver(startTripSchema),
    defaultValues: { name: "" },
  });

  const resetDates = () => {
    setStartDate(null);
    setEndDate(null);
    setActivePicker(null);
  };

  const handleClose = () => {
    reset({ name: "" });
    resetDates();
    onClose();
  };

  const applyPickedDate = (picker: "start" | "end", event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type !== "set" || !selectedDate) return;
    if (picker === "start") setStartDate(selectedDate);
    else setEndDate(selectedDate);
  };

  // iOS only — Android uses the imperative dialog API below instead of mounting a component.
  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const picker = activePicker;
    setActivePicker(null);
    if (picker) applyPickedDate(picker, event, selectedDate);
  };

  /**
   * Android: open the native date dialog imperatively. Mounting the
   * `<DateTimePicker>` component inside an RN `Modal` on Android is fragile
   * (double `onChange` callbacks, dismiss-on-unmount races); the library
   * recommends `DateTimePickerAndroid.open` instead.
   */
  const openPicker = (picker: "start" | "end") => {
    const current = (picker === "start" ? startDate : endDate) ?? startDate ?? new Date();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: current,
        mode: "date",
        minimumDate: picker === "end" && startDate ? startDate : undefined,
        onChange: (event, selectedDate) => applyPickedDate(picker, event, selectedDate),
      });
      return;
    }
    setActivePicker(picker);
  };

  const handleStart = (values: StartTripFormValues) => {
    const dateLabel = startDate
      ? endDate
        ? `${formatPickedDate(startDate)} – ${formatPickedDate(endDate)}`
        : formatPickedDate(startDate)
      : "";
    startTrip({ name: values.name, dateLabel });
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

        <AppText variant="labelMedium" color="secondary" style={styles.dateLabel}>
          Dates (optional)
        </AppText>
        <View style={styles.dateRow}>
          <Pressable
            onPress={() => openPicker("start")}
            style={[styles.dateField, { borderColor: theme.palette.border }]}
          >
            <AppText color={startDate ? "primary" : "secondary"}>
              {startDate ? formatPickedDate(startDate) : "Start date"}
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => openPicker("end")}
            style={[styles.dateField, { borderColor: theme.palette.border }]}
          >
            <AppText color={endDate ? "primary" : "secondary"}>
              {endDate ? formatPickedDate(endDate) : "End date"}
            </AppText>
          </Pressable>
        </View>
        {startDate || endDate ? (
          <AppButton label="Clear dates" variant="text" onPress={resetDates} style={styles.clearButton} />
        ) : null}

        {Platform.OS !== "android" && activePicker ? (
          <DateTimePicker
            value={(activePicker === "start" ? startDate : endDate) ?? startDate ?? new Date()}
            mode="date"
            display="default"
            minimumDate={activePicker === "end" && startDate ? startDate : undefined}
            onChange={handleDateChange}
          />
        ) : null}

        <AppButton label="Start Trip" onPress={handleSubmit(handleStart)} style={styles.startButton} />
        <AppButton label="Cancel" variant="text" onPress={handleClose} />
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: {
    marginBottom: spacing.md,
  },
  dateLabel: {
    marginBottom: spacing.xs,
  },
  dateRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  dateField: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  clearButton: {
    alignSelf: "flex-start",
  },
  startButton: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
});
