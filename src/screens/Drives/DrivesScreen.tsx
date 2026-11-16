import React, { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import {
  AppHeader,
  AppSearchBar,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  SegmentedControl,
  type SegmentedOption,
} from "@/components";
import { DriveCard, useDriveStore, type Drive } from "@/features/drives";
import { useTripStore } from "@/features/trips";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, groupByMonth } from "@/utils";

type SortOrder = "newest" | "oldest" | "longest";

const SORT_OPTIONS: readonly SegmentedOption<SortOrder>[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "longest", label: "Longest" },
];

/** Searchable, sortable list of completed drives. Recording happens on the Home tab; this only reads the result. */
export function DrivesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const pastTrips = useTripStore((state) => state.pastTrips);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

  // Computed once per drive list, then reused for the header total, the "longest" sort, and nothing else re-walks the points.
  const distanceById = useMemo(() => {
    const distances = new Map<string, number>();
    for (const drive of pastDrives) distances.set(drive.id, calculateRouteDistanceMeters(drive.points));
    return distances;
  }, [pastDrives]);

  const tripNameById = useMemo(() => {
    const names = new Map<string, string>();
    for (const trip of pastTrips) names.set(trip.id, trip.name);
    if (activeTrip) names.set(activeTrip.id, activeTrip.name);
    return names;
  }, [pastTrips, activeTrip]);

  const sections = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const matching = trimmed
      ? pastDrives.filter(
          (drive) =>
            drive.name.toLowerCase().includes(trimmed) ||
            drive.review.toLowerCase().includes(trimmed) ||
            (drive.tripId ? tripNameById.get(drive.tripId)?.toLowerCase().includes(trimmed) : false)
        )
      : pastDrives;

    if (sortOrder === "longest") {
      const sorted = [...matching].sort(
        (a, b) => (distanceById.get(b.id) ?? 0) - (distanceById.get(a.id) ?? 0)
      );
      return sorted.length > 0 ? [{ title: "Longest first", data: sorted }] : [];
    }

    const sorted = [...matching].sort((a, b) =>
      sortOrder === "newest" ? b.startedAt - a.startedAt : a.startedAt - b.startedAt
    );
    return groupByMonth(sorted, (drive: Drive) => drive.startedAt);
  }, [pastDrives, query, sortOrder, distanceById, tripNameById]);

  const totalDistanceMeters = useMemo(() => {
    let total = 0;
    for (const distance of distanceById.values()) total += distance;
    return total;
  }, [distanceById]);

  const subtitle =
    pastDrives.length === 0
      ? undefined
      : `${pastDrives.length} ${pastDrives.length === 1 ? "drive" : "drives"} · ${formatDistance(
          totalDistanceMeters,
          unitPreference
        )}`;

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <AppHeader
        title="Drives"
        subtitle={subtitle}
        right={
          pastDrives.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View your stats"
              onPress={() => navigation.navigate("Stats")}
              hitSlop={8}
              style={[styles.statsButton, { backgroundColor: theme.palette.primaryContainer }]}
            >
              <MaterialCommunityIcons name="chart-bar" size={22} color={theme.palette.onPrimaryContainer} />
            </Pressable>
          ) : null
        }
      />

      {pastDrives.length === 0 ? (
        <EmptyState
          icon="road-variant"
          title="No drives yet"
          message="Start recording from the Home tab and your drives will be collected here."
          actionLabel="Go to Home"
          onAction={() => navigation.navigate("Home")}
        />
      ) : (
        <>
          <AppSearchBar
            value={query}
            onChangeText={setQuery}
            placeholder="Search by name, notes, or trip"
            elevation={0}
            style={[styles.search, { backgroundColor: theme.palette.surfaceVariant }]}
          />
          <SegmentedControl options={SORT_OPTIONS} value={sortOrder} onChange={setSortOrder} />

          <SectionList
            sections={sections}
            keyExtractor={(drive) => drive.id}
            stickySectionHeadersEnabled={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderSectionHeader={({ section }) => <SectionHeader title={section.title} />}
            ListEmptyComponent={
              <EmptyState icon="magnify" title="No matches" message={`Nothing matches “${query.trim()}”.`} />
            }
            renderItem={({ item }) => (
              <DriveCard
                drive={item}
                tripName={item.tripId ? tripNameById.get(item.tripId) : undefined}
                onPress={() => navigation.navigate("Drive", { driveId: item.id })}
              />
            )}
          />
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  statsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  search: {
    marginBottom: spacing.sm,
  },
  listContent: {
    // Room for the cards’ shadows, which the list would otherwise clip at its edges.
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xl,
  },
});
