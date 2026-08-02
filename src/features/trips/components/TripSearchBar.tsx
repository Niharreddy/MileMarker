import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppSearchBar, AppText } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { formatTripStartedAt } from "../formatters";
import { useTripStore } from "../store/tripStore";

const MAX_RESULTS = 5;

/** Search-by-name over past trips; tapping a result opens TripDetail. */
export function TripSearchBar() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastTrips = useTripStore((state) => state.pastTrips);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    return pastTrips.filter((trip) => trip.name.toLowerCase().includes(trimmed)).slice(0, MAX_RESULTS);
  }, [query, pastTrips]);

  const handleSelect = (tripId: string) => {
    setQuery("");
    navigation.navigate("TripDetail", { tripId });
  };

  return (
    <View style={styles.container}>
      <AppSearchBar value={query} onChangeText={setQuery} placeholder="Search your trips" />

      {query.trim().length > 0 ? (
        <View
          style={[
            styles.results,
            { backgroundColor: theme.palette.surface, borderColor: theme.palette.border },
          ]}
        >
          {results.length === 0 ? (
            <AppText color="secondary" style={styles.resultRow}>
              No trips match “{query.trim()}”.
            </AppText>
          ) : (
            results.map((trip) => (
              <Pressable key={trip.id} onPress={() => handleSelect(trip.id)} style={styles.resultRow}>
                <AppText variant="titleSmall">{trip.name}</AppText>
                <AppText color="secondary" variant="bodySmall">
                  {formatTripStartedAt(trip.startedAt)}
                </AppText>
              </Pressable>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
  },
  results: {
    marginTop: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    overflow: "hidden",
  },
  resultRow: {
    padding: spacing.sm,
  },
});
