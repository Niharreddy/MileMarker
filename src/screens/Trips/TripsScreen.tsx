import React from "react";
import { FlatList, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, AppText, ScreenContainer } from "@/components";
import { useDriveStore } from "@/features/drives";
import { SaveTripDialog, TripControls, useTripStore, type Trip } from "@/features/trips";
import { spacing, useAppTheme } from "@/theme";
import { formatDuration, formatStartedAt } from "@/utils";

function TripRow({ trip, driveCount, onPress }: { trip: Trip; driveCount: number; onPress: () => void }) {
  const theme = useAppTheme();

  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: theme.palette.border }]}>
      <AppText variant="titleSmall">{trip.name}</AppText>
      <AppText color="secondary">
        {trip.dateLabel.trim() ? `${trip.dateLabel} · ` : ""}
        {formatStartedAt(trip.startedAt)} · {formatDuration(trip.startedAt, trip.endedAt)} · {driveCount}{" "}
        {driveCount === 1 ? "drive" : "drives"}
      </AppText>
    </Pressable>
  );
}

/** Bundles of drives: start/stop a Trip up top, browse past Trips below. */
export function TripsScreen() {
  const navigation = useNavigation();
  const pastTrips = useTripStore((state) => state.pastTrips);
  const pastDrives = useDriveStore((state) => state.pastDrives);

  return (
    <ScreenContainer>
      <AppHeader title="Trips" />
      <TripControls />
      <FlatList
        data={pastTrips}
        keyExtractor={(trip) => trip.id}
        ListEmptyComponent={
          <AppText color="secondary">
            No trips yet — start one above to bundle drives from this outing together.
          </AppText>
        }
        renderItem={({ item }) => (
          <TripRow
            trip={item}
            driveCount={pastDrives.filter((drive) => drive.tripId === item.id).length}
            onPress={() => navigation.navigate("Trip", { tripId: item.id })}
          />
        )}
      />
      <SaveTripDialog />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
  },
});
