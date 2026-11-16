import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { v4 as uuid } from "uuid";

import {
  AppText,
  Card,
  EditDetailsDialog,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  StatRow,
} from "@/components";
import { DriveCard, persistPinMedia, useDriveStore } from "@/features/drives";
import {
  AddMediaButton,
  MediaGrid,
  MediaViewerModal,
  RouteMap,
  type Pin,
} from "@/features/map";
import { ShareSummaryModal } from "@/features/share";
import { useTripStore } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useSettingsStore } from "@/store";
import { radii, spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDate, formatDistance, formatMinutes, formatStartedAt } from "@/utils";

type Props = NativeStackScreenProps<RootStackParamList, "Trip">;

type PinSource = { type: "trip" } | { type: "drive"; driveId: string };
type SourcedPin = { pin: Pin; source: PinSource };

export function TripDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const trip = useTripStore((state) => state.pastTrips.find((candidate) => candidate.id === route.params.tripId));
  const updateTripDetails = useTripStore((state) => state.updateTripDetails);
  const addPinToTrip = useTripStore((state) => state.addPinToTrip);
  const removePinFromTrip = useTripStore((state) => state.removePinFromTrip);
  const allDrives = useDriveStore((state) => state.pastDrives);
  const removePinFromDrive = useDriveStore((state) => state.removePinFromDrive);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const memberDrives = useMemo(
    () =>
      allDrives.filter((drive) => drive.tripId === trip?.id).sort((a, b) => a.startedAt - b.startedAt),
    [allDrives, trip?.id]
  );
  const sourcedPins = useMemo<SourcedPin[]>(() => {
    if (!trip) return [];
    const ownPins = trip.pins.map((pin) => ({ pin, source: { type: "trip" as const } }));
    const drivePins = memberDrives.flatMap((drive) =>
      drive.pins.map((pin) => ({ pin, source: { type: "drive" as const, driveId: drive.id } }))
    );
    return [...ownPins, ...drivePins].sort((a, b) => b.pin.createdAt - a.pin.createdAt);
  }, [trip, memberDrives]);
  const pins = useMemo(() => sourcedPins.map((sourced) => sourced.pin), [sourcedPins]);
  const routes = useMemo(
    () => memberDrives.map((drive) => ({ id: drive.id, coordinates: drive.points })),
    [memberDrives]
  );
  const { totalDistanceMeters, drivingMinutes } = useMemo(() => {
    let totalDistanceMeters = 0;
    let drivingMs = 0;
    for (const drive of memberDrives) {
      totalDistanceMeters += calculateRouteDistanceMeters(drive.points);
      drivingMs += (drive.endedAt ?? drive.startedAt) - drive.startedAt;
    }
    return { totalDistanceMeters, drivingMinutes: Math.round(drivingMs / 60_000) };
  }, [memberDrives]);

  if (!trip) {
    return (
      <ScreenContainer edges={["bottom", "left", "right"]}>
        <EmptyState icon="map-search-outline" title="Trip not found" message="This trip may have been deleted." />
      </ScreenContainer>
    );
  }

  const handleRemovePin = (index: number) => {
    const sourced = sourcedPins[index];
    if (!sourced) return;
    Alert.alert("Remove this photo/video?", "This permanently deletes it.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () =>
          sourced.source.type === "trip"
            ? removePinFromTrip(trip.id, sourced.pin.id)
            : removePinFromDrive(sourced.source.driveId, sourced.pin.id),
      },
    ]);
  };

  const dateRange =
    trip.dateLabel.trim() ||
    (trip.endedAt && formatDate(trip.endedAt) !== formatDate(trip.startedAt)
      ? `${formatDate(trip.startedAt)} – ${formatDate(trip.endedAt)}`
      : formatDate(trip.startedAt));

  return (
    <ScreenContainer scrollable edges={["bottom", "left", "right"]}>
      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <AppText variant="headlineMedium">{trip.name}</AppText>
          <AppText color="secondary">{dateRange}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share trip summary"
          onPress={() => setIsSharing(true)}
          hitSlop={10}
          style={[styles.editButton, { backgroundColor: theme.palette.primaryContainer }]}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={theme.palette.onPrimaryContainer} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit trip"
          onPress={() => setIsEditing(true)}
          hitSlop={10}
          style={[styles.editButton, { backgroundColor: theme.palette.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.palette.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap
          currentLocation={null}
          pins={pins}
          notes={trip.notes}
          routes={routes}
          onPinPress={(pin) => {
            const index = pins.findIndex((candidate) => candidate.id === pin.id);
            if (index >= 0) setViewerIndex(index);
          }}
        />
      </View>

      <Card>
        <StatRow
          items={[
            { icon: "road-variant", label: memberDrives.length === 1 ? "Drive" : "Drives", value: String(memberDrives.length) },
            { icon: "map-marker-distance", label: "Distance", value: formatDistance(totalDistanceMeters, unitPreference) },
            { icon: "steering", label: "Driving", value: formatMinutes(drivingMinutes) },
            { icon: "image-outline", label: "Photos", value: String(pins.length) },
          ]}
        />
      </Card>

      <SectionHeader title="Description" />
      <Card onPress={() => setIsEditing(true)}>
        <AppText color={trip.review.trim() ? "primary" : "secondary"}>
          {trip.review.trim() ? trip.review : "No description yet — tap to tell the story of this trip."}
        </AppText>
      </Card>

      {trip.notes.length > 0 ? (
        <>
          <SectionHeader title="Comments" />
          <Card style={styles.comments}>
            {trip.notes.map((note) => (
              <View key={note.id} style={styles.comment}>
                <AppText color="secondary" variant="labelSmall">
                  {formatStartedAt(note.createdAt)}
                </AppText>
                <AppText>{note.text}</AppText>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Drives" />
      {memberDrives.length === 0 ? (
        <AppText color="secondary">
          No drives are part of this trip yet. Open a drive and choose “Add to Trip” from its menu.
        </AppText>
      ) : (
        memberDrives.map((drive) => (
          <DriveCard
            key={drive.id}
            drive={drive}
            onPress={() => navigation.navigate("Drive", { driveId: drive.id })}
          />
        ))
      )}

      <SectionHeader
        title="Photos & videos"
        right={
          pins.length > 0 ? (
            <AppText variant="labelMedium" color="secondary">
              {pins.length}
            </AppText>
          ) : null
        }
      />
      {pins.length === 0 ? (
        <AppText color="secondary" style={styles.mediaBlock}>
          Nothing attached to this trip yet.
        </AppText>
      ) : (
        <View style={styles.mediaBlock}>
          <MediaGrid pins={pins} onPressPin={setViewerIndex} onRemovePin={handleRemovePin} />
        </View>
      )}

      <AddMediaButton
        label="Add Photo/Video"
        // Added after the fact: only the media's own GPS metadata counts as its location, never where you are now.
        onPickMedia={async (uri, mediaType, mediaLocation) => {
          const id = uuid();
          const { uri: persistedUri, thumbnailUri } = await persistPinMedia(uri, id, mediaType);
          addPinToTrip(trip.id, {
            id,
            uri: persistedUri,
            mediaType,
            thumbnailUri,
            coordinates: mediaLocation,
            createdAt: Date.now(),
          });
        }}
      />

      <AppText variant="bodySmall" color="secondary" style={styles.addHint}>
        A photo is placed on the map only if it has a saved location of its own.
      </AppText>

      <MediaViewerModal pins={pins} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />

      <ShareSummaryModal
        visible={isSharing}
        onClose={() => setIsSharing(false)}
        title={trip.name}
        subtitle={dateRange}
        stats={[
          { icon: "road-variant", label: memberDrives.length === 1 ? "Drive" : "Drives", value: String(memberDrives.length) },
          { icon: "map-marker-distance", label: "Distance", value: formatDistance(totalDistanceMeters, unitPreference) },
          { icon: "steering", label: "Driving", value: formatMinutes(drivingMinutes) },
        ]}
        routes={routes}
        pins={pins}
      />

      <EditDetailsDialog
        visible={isEditing}
        title="Edit trip"
        nameLabel="Trip name"
        reviewLabel="Description"
        initialName={trip.name}
        initialReview={trip.review}
        onSave={(details) => updateTripDetails(trip.id, details)}
        onClose={() => setIsEditing(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  mapContainer: {
    height: 280,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  addHint: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  comments: {
    gap: spacing.md,
  },
  comment: {
    gap: spacing.xxs,
  },
  mediaBlock: {
    marginBottom: spacing.md,
  },
});
