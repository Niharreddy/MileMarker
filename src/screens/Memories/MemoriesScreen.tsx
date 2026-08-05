import React, { useMemo } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, AppText, ScreenContainer } from "@/components";
import type { Pin } from "@/features/map";
import { useTripStore } from "@/features/trips";
import { spacing, useAppTheme } from "@/theme";

type Memory = {
  pin: Pin;
  tripId: string;
  tripName: string;
};

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;

/** Every photo pinned across all trips, flattened and sorted newest first. */
export function MemoriesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastTrips = useTripStore((state) => state.pastTrips);

  const memories = useMemo(() => {
    const flattened: Memory[] = [];
    for (const trip of pastTrips) {
      for (const pin of trip.pins) {
        flattened.push({ pin, tripId: trip.id, tripName: trip.name });
      }
    }
    return flattened.sort((a, b) => b.pin.createdAt - a.pin.createdAt);
  }, [pastTrips]);

  return (
    <ScreenContainer>
      <AppHeader title="Memories" />
      <FlatList
        data={memories}
        keyExtractor={(memory) => memory.pin.id}
        numColumns={GRID_COLUMNS}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <AppText color="secondary">
            Photos you pin during a trip will show up here.
          </AppText>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tile, { borderColor: theme.palette.border }]}
            onPress={() => navigation.navigate("TripDetail", { tripId: item.tripId })}
          >
            <Image source={{ uri: item.pin.uri }} style={styles.image} />
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: GRID_GAP,
  },
  tile: {
    flex: 1 / GRID_COLUMNS,
    aspectRatio: 1,
    marginBottom: GRID_GAP,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
