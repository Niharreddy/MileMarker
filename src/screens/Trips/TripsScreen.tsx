import React from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, AppText, ScreenContainer } from "@/components";
import {
  calculateTripDistanceMeters,
  formatDistance,
  formatTripDuration,
  formatTripStartedAt,
  useTripStore,
  type Trip,
} from "@/features/trips";
import { spacing, useAppTheme } from "@/theme";

function TripRow({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const theme = useAppTheme();
  const distance = formatDistance(calculateTripDistanceMeters(trip.points));

  return (
    <Pressable onPress={onPress} style={[styles.row, { borderBottomColor: theme.palette.border }]}>
      <AppText variant="titleSmall">{trip.name}</AppText>
      <AppText color="secondary">
        {formatTripStartedAt(trip.startedAt)} · {formatTripDuration(trip.startedAt, trip.endedAt)} ·{" "}
        {distance} · {trip.pins.length} {trip.pins.length === 1 ? "photo" : "photos"}
      </AppText>
    </Pressable>
  );
}

/** List of completed trips. Recording happens on the Home tab; this only reads the result. */
export function TripsScreen() {
  const navigation = useNavigation();
  const pastTrips = useTripStore((state) => state.pastTrips);

  return (
    <ScreenContainer>
      <AppHeader title="Trips" />
      <FlatList
        data={pastTrips}
        keyExtractor={(trip) => trip.id}
        ListEmptyComponent={
          <AppText color="secondary">No trips recorded yet — start one from the Home tab.</AppText>
        }
        renderItem={({ item }) => (
          <TripRow trip={item} onPress={() => navigation.navigate("TripDetail", { tripId: item.id })} />
        )}
      />
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
