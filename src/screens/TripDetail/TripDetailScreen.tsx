import React from "react";
import { FlatList, Image, StyleSheet, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText, ScreenContainer } from "@/components";
import { RouteMap } from "@/features/map";
import {
  calculateTripDistanceMeters,
  formatDistance,
  formatTripDuration,
  formatTripStartedAt,
  useTripStore,
} from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { spacing, useAppTheme } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "TripDetail">;

export function TripDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const trip = useTripStore((state) =>
    state.pastTrips.find((candidate) => candidate.id === route.params.tripId)
  );

  if (!trip) {
    return (
      <ScreenContainer>
        <AppText color="secondary">This trip could not be found.</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <AppText variant="titleLarge">{trip.name}</AppText>
      <AppText color="secondary" style={styles.meta}>
        {formatTripStartedAt(trip.startedAt)} · {formatTripDuration(trip.startedAt, trip.endedAt)} ·{" "}
        {formatDistance(calculateTripDistanceMeters(trip.points))}
      </AppText>

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap currentLocation={null} pins={trip.pins} routeCoordinates={trip.points} />
      </View>

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Review
      </AppText>
      <AppText color="secondary">{trip.review.trim() ? trip.review : "No notes for this trip."}</AppText>

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Photos
      </AppText>
      {trip.pins.length === 0 ? (
        <AppText color="secondary">No photos attached to this trip.</AppText>
      ) : (
        <FlatList
          horizontal
          data={trip.pins}
          keyExtractor={(pin) => pin.id}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <Image source={{ uri: item.uri }} style={[styles.photo, { borderColor: theme.palette.border }]} />
          )}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: {
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 260,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginRight: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
