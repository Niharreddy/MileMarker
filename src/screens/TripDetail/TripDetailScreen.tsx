import React, { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText, ScreenContainer } from "@/components";
import { getPinThumbnailUri, MediaViewerModal, RouteMap } from "@/features/map";
import {
  calculateTripDistanceMeters,
  formatDistance,
  formatTripDuration,
  formatTripStartedAt,
  useTripStore,
} from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";

type Props = NativeStackScreenProps<RootStackParamList, "TripDetail">;

export function TripDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const trip = useTripStore((state) =>
    state.pastTrips.find((candidate) => candidate.id === route.params.tripId)
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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
        {formatDistance(calculateTripDistanceMeters(trip.points), unitPreference)}
      </AppText>

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap currentLocation={null} pins={trip.pins} notes={trip.notes} routeCoordinates={trip.points} />
      </View>

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Review
      </AppText>
      <AppText color="secondary">{trip.review.trim() ? trip.review : "No notes for this trip."}</AppText>

      {trip.notes.length > 0 ? (
        <>
          <AppText variant="titleSmall" style={styles.sectionTitle}>
            Notes
          </AppText>
          {trip.notes.map((note) => (
            <View key={note.id} style={styles.noteRow}>
              <AppText color="secondary" variant="labelSmall">
                {formatTripStartedAt(note.createdAt)}
              </AppText>
              <AppText>{note.text}</AppText>
            </View>
          ))}
        </>
      ) : null}

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
          renderItem={({ item, index }) => (
            <Pressable style={styles.photoWrapper} onPress={() => setViewerIndex(index)}>
              <Image
                source={{ uri: getPinThumbnailUri(item) }}
                style={[styles.photo, { borderColor: theme.palette.border }]}
              />
              {item.mediaType === "video" ? (
                <View style={styles.videoBadge}>
                  <MaterialCommunityIcons name="play-circle" size={22} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
          )}
        />
      )}

      <MediaViewerModal pins={trip.pins} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
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
  noteRow: {
    marginBottom: spacing.sm,
  },
  photoWrapper: {
    marginRight: spacing.sm,
  },
  photo: {
    width: 96,
    height: 96,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  videoBadge: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
