import React from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";

import { AppButton, AppText } from "@/components";
import { useDriveStore } from "@/features/drives";
import { spacing, useAppTheme } from "@/theme";
import { formatStartedAt } from "@/utils";

import { useTripStore } from "../store/tripStore";
import type { Trip } from "../types";

export type AddToTripModalProps = {
  visible: boolean;
  driveId: string;
  onClose: () => void;
};

/** Lists past trips so a not-yet-bundled drive can be filed into one. */
export function AddToTripModal({ visible, driveId, onClose }: AddToTripModalProps) {
  const theme = useAppTheme();
  const pastTrips = useTripStore((state) => state.pastTrips);
  const addDriveToTrip = useDriveStore((state) => state.addDriveToTrip);

  const handleSelect = (trip: Trip) => {
    addDriveToTrip(driveId, trip.id);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: theme.palette.surface }]}>
          <AppText variant="titleMedium" style={styles.title}>
            Add to Trip
          </AppText>

          {pastTrips.length === 0 ? (
            <AppText color="secondary" style={styles.emptyText}>
              You don't have any trips yet — start one from the Trips tab.
            </AppText>
          ) : (
            <FlatList
              data={pastTrips}
              keyExtractor={(trip) => trip.id}
              style={styles.list}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleSelect(item)}
                  style={[styles.row, { borderBottomColor: theme.palette.border }]}
                >
                  <AppText variant="titleSmall">{item.name}</AppText>
                  <AppText color="secondary" variant="bodySmall">
                    {item.dateLabel.trim() ? `${item.dateLabel} · ` : ""}
                    {formatStartedAt(item.startedAt)}
                  </AppText>
                </Pressable>
              )}
            />
          )}

          <AppButton label="Cancel" variant="text" onPress={onClose} />
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
    maxHeight: "70%",
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.md,
  },
  emptyText: {
    marginBottom: spacing.md,
  },
  list: {
    flexGrow: 0,
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
  },
});
