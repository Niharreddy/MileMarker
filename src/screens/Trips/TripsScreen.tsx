import React, { useMemo } from "react";
import { FlatList, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, EmptyState, ScreenContainer, SectionHeader } from "@/components";
import { useDriveStore } from "@/features/drives";
import type { Pin } from "@/features/map";
import { SaveTripDialog, TripCard, TripControls, useTripStore } from "@/features/trips";
import { useSettingsStore } from "@/store";
import { spacing } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance } from "@/utils";

type TripSummary = {
  driveCount: number;
  distanceMeters: number;
  photoCount: number;
  coverPin?: Pin;
};

/** Bundles of drives: start/stop a Trip up top, browse past Trips below. */
export function TripsScreen() {
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pastTrips = useTripStore((state) => state.pastTrips);
  const pastDrives = useDriveStore((state) => state.pastDrives);

  // One pass over the drives up front, instead of re-filtering the whole list for every trip row.
  const summaryByTripId = useMemo(() => {
    const summaries = new Map<string, TripSummary>();
    for (const trip of pastTrips) {
      summaries.set(trip.id, {
        driveCount: 0,
        distanceMeters: 0,
        photoCount: trip.pins.length,
        coverPin: trip.pins[0],
      });
    }
    for (const drive of pastDrives) {
      const summary = drive.tripId ? summaries.get(drive.tripId) : undefined;
      if (!summary) continue;
      summary.driveCount += 1;
      summary.distanceMeters += calculateRouteDistanceMeters(drive.points);
      summary.photoCount += drive.pins.length;
      summary.coverPin ??= drive.pins[0];
    }
    return summaries;
  }, [pastTrips, pastDrives]);

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <AppHeader
        title="Trips"
        subtitle={pastTrips.length > 0 ? `${pastTrips.length} saved ${pastTrips.length === 1 ? "trip" : "trips"}` : undefined}
      />
      <FlatList
        data={pastTrips}
        keyExtractor={(trip) => trip.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <TripControls />
            {pastTrips.length > 0 ? <SectionHeader title="Past trips" /> : null}
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="bag-suitcase-outline"
            title="No trips yet"
            message="A trip bundles the drives from one outing — a weekend away, a road trip — into a single story."
          />
        }
        renderItem={({ item }) => {
          const summary = summaryByTripId.get(item.id);
          return (
            <TripCard
              trip={item}
              driveCount={summary?.driveCount ?? 0}
              distanceLabel={formatDistance(summary?.distanceMeters ?? 0, unitPreference)}
              photoCount={summary?.photoCount ?? 0}
              coverPin={summary?.coverPin}
              onPress={() => navigation.navigate("Trip", { tripId: item.id })}
            />
          );
        }}
      />
      <SaveTripDialog />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    // Room for the header card's shadow, which the list would otherwise clip at its edges.
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xl,
  },
});
