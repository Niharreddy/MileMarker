import React, { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppText, ScreenContainer } from "@/components";
import { useDriveStore } from "@/features/drives";
import { getPinThumbnailUri, MediaViewerModal, RouteMap } from "@/features/map";
import { useTripStore } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useSettingsStore } from "@/store";
import { spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDistance, formatDuration, formatStartedAt } from "@/utils";

type Props = NativeStackScreenProps<RootStackParamList, "Drive">;

export function DriveDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const drive = useDriveStore((state) =>
    state.pastDrives.find((candidate) => candidate.id === route.params.driveId)
  );
  const trip = useTripStore((state) =>
    drive?.tripId ? state.pastTrips.find((candidate) => candidate.id === drive.tripId) : undefined
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  if (!drive) {
    return (
      <ScreenContainer>
        <AppText color="secondary">This drive could not be found.</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <AppText variant="titleLarge">{drive.name}</AppText>
      <AppText color="secondary" style={styles.meta}>
        {formatStartedAt(drive.startedAt)} · {formatDuration(drive.startedAt, drive.endedAt)} ·{" "}
        {formatDistance(calculateRouteDistanceMeters(drive.points), unitPreference)}
      </AppText>

      {trip ? (
        <Pressable onPress={() => navigation.navigate("Trip", { tripId: trip.id })} style={styles.tripBadgeRow}>
          <MaterialCommunityIcons name="bag-suitcase-outline" size={16} color={theme.palette.primary} />
          <AppText variant="labelMedium" style={{ color: theme.palette.primary }}>
            Part of trip: {trip.name}
          </AppText>
        </Pressable>
      ) : null}

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap currentLocation={null} pins={drive.pins} notes={drive.notes} routeCoordinates={drive.points} />
      </View>

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Review
      </AppText>
      <AppText color="secondary">{drive.review.trim() ? drive.review : "No notes for this drive."}</AppText>

      {drive.notes.length > 0 ? (
        <>
          <AppText variant="titleSmall" style={styles.sectionTitle}>
            Notes
          </AppText>
          {drive.notes.map((note) => (
            <View key={note.id} style={styles.noteRow}>
              <AppText color="secondary" variant="labelSmall">
                {formatStartedAt(note.createdAt)}
              </AppText>
              <AppText>{note.text}</AppText>
            </View>
          ))}
        </>
      ) : null}

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Photos
      </AppText>
      {drive.pins.length === 0 ? (
        <AppText color="secondary">No photos attached to this drive.</AppText>
      ) : (
        <FlatList
          horizontal
          data={drive.pins}
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

      <MediaViewerModal pins={drive.pins} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  meta: {
    marginBottom: spacing.md,
  },
  tripBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxs,
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
