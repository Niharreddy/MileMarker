import React, { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { v4 as uuid } from "uuid";

import { AppText, Card, EmptyState, MetaItem, ScreenContainer, SectionHeader, StatRow } from "@/components";
import { EditDriveDialog, persistPinMedia, useDriveStore } from "@/features/drives";
import {
  AddMediaButton,
  MediaGrid,
  MediaViewerModal,
  RouteMap,
} from "@/features/map";
import { ShareSummaryModal } from "@/features/share";
import { useTripStore } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { useSettingsStore } from "@/store";
import { radii, spacing, useAppTheme } from "@/theme";
import {
  averageSpeedMps,
  calculateRouteDistanceMeters,
  formatDate,
  formatDistance,
  formatDuration,
  formatSpeed,
  formatTime,
} from "@/utils";

type Props = NativeStackScreenProps<RootStackParamList, "Drive">;

export function DriveDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const drive = useDriveStore((state) =>
    state.pastDrives.find((candidate) => candidate.id === route.params.driveId)
  );
  const addPinToDrive = useDriveStore((state) => state.addPinToDrive);
  const removePinFromDrive = useDriveStore((state) => state.removePinFromDrive);
  const trip = useTripStore((state) =>
    drive?.tripId ? state.pastTrips.find((candidate) => candidate.id === drive.tripId) : undefined
  );
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const distanceMeters = useMemo(() => calculateRouteDistanceMeters(drive?.points ?? []), [drive?.points]);
  const shareRoutes = useMemo(() => (drive ? [{ id: drive.id, coordinates: drive.points }] : []), [drive]);

  if (!drive) {
    return (
      <ScreenContainer edges={["bottom", "left", "right"]}>
        <EmptyState icon="map-search-outline" title="Drive not found" message="This drive may have been deleted." />
      </ScreenContainer>
    );
  }

  const handleRemovePin = (index: number) => {
    const pin = drive.pins[index];
    if (!pin) return;
    Alert.alert("Remove this photo/video?", "This permanently deletes it.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removePinFromDrive(drive.id, pin.id) },
    ]);
  };

  return (
    <ScreenContainer scrollable edges={["bottom", "left", "right"]}>
      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <AppText variant="headlineMedium">{drive.name}</AppText>
          <AppText color="secondary">
            {formatDate(drive.startedAt)} · {formatTime(drive.startedAt)}
            {drive.endedAt ? ` – ${formatTime(drive.endedAt)}` : ""}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share drive summary"
          onPress={() => setIsSharing(true)}
          hitSlop={10}
          style={[styles.editButton, { backgroundColor: theme.palette.primaryContainer }]}
        >
          <MaterialCommunityIcons name="share-variant" size={18} color={theme.palette.onPrimaryContainer} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit drive"
          onPress={() => setIsEditing(true)}
          hitSlop={10}
          style={[styles.editButton, { backgroundColor: theme.palette.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.palette.textPrimary} />
        </Pressable>
      </View>

      {trip ? (
        <Pressable
          onPress={() => navigation.navigate("Trip", { tripId: trip.id })}
          style={[styles.tripBadge, { backgroundColor: theme.palette.primaryContainer }]}
        >
          <MetaItem icon="bag-suitcase-outline" label={`Part of trip: ${trip.name}`} highlighted />
          <MaterialCommunityIcons name="chevron-right" size={16} color={theme.palette.primary} />
        </Pressable>
      ) : null}

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap
          currentLocation={null}
          pins={drive.pins}
          notes={drive.notes}
          routeCoordinates={drive.points}
          onPinPress={(pin) => {
            const index = drive.pins.findIndex((candidate) => candidate.id === pin.id);
            if (index >= 0) setViewerIndex(index);
          }}
        />
      </View>

      <Card>
        <StatRow
          items={[
            { icon: "map-marker-distance", label: "Distance", value: formatDistance(distanceMeters, unitPreference) },
            { icon: "clock-outline", label: "Duration", value: formatDuration(drive.startedAt, drive.endedAt) },
            {
              icon: "speedometer",
              label: "Avg speed",
              value: formatSpeed(averageSpeedMps(distanceMeters, drive.startedAt, drive.endedAt), unitPreference),
            },
            { icon: "image-outline", label: "Photos", value: String(drive.pins.length) },
          ]}
        />
      </Card>

      <SectionHeader title="Review" />
      <Card onPress={() => setIsEditing(true)}>
        <AppText color={drive.review.trim() ? "primary" : "secondary"}>
          {drive.review.trim() ? drive.review : "No review yet — tap to write down how this drive went."}
        </AppText>
      </Card>

      {drive.notes.length > 0 ? (
        <>
          <SectionHeader title="Notes along the way" />
          <Card style={styles.timeline}>
            {drive.notes.map((note, index) => (
              <View key={note.id} style={styles.timelineRow}>
                <View style={styles.timelineRail}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.palette.success }]} />
                  {index < drive.notes.length - 1 ? (
                    <View style={[styles.timelineLine, { backgroundColor: theme.palette.border }]} />
                  ) : null}
                </View>
                <View style={styles.timelineBody}>
                  <AppText color="secondary" variant="labelSmall">
                    {formatTime(note.createdAt)}
                  </AppText>
                  <AppText>{note.text}</AppText>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader
        title="Photos & videos"
        right={
          drive.pins.length > 0 ? (
            <AppText variant="labelMedium" color="secondary">
              {drive.pins.length}
            </AppText>
          ) : null
        }
      />
      {drive.pins.length === 0 ? (
        <AppText color="secondary" style={styles.emptyMedia}>
          Nothing attached to this drive yet.
        </AppText>
      ) : (
        <View style={styles.mediaGrid}>
          <MediaGrid pins={drive.pins} onPressPin={setViewerIndex} onRemovePin={handleRemovePin} />
        </View>
      )}

      <AddMediaButton
        label="Add Photo/Video"
        // Added after the fact: only the media's own GPS metadata counts as its location, never where you are now.
        onPickMedia={async (uri, mediaType, mediaLocation) => {
          const id = uuid();
          const { uri: persistedUri, thumbnailUri } = await persistPinMedia(uri, id, mediaType);
          addPinToDrive(drive.id, {
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

      <MediaViewerModal pins={drive.pins} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
      <ShareSummaryModal
        visible={isSharing}
        onClose={() => setIsSharing(false)}
        title={drive.name}
        subtitle={formatDate(drive.startedAt)}
        stats={[
          { icon: "map-marker-distance", label: "Distance", value: formatDistance(distanceMeters, unitPreference) },
          { icon: "clock-outline", label: "Duration", value: formatDuration(drive.startedAt, drive.endedAt) },
          {
            icon: "speedometer",
            label: "Avg speed",
            value: formatSpeed(averageSpeedMps(distanceMeters, drive.startedAt, drive.endedAt), unitPreference),
          },
        ]}
        routes={shareRoutes}
        pins={drive.pins}
      />
      <EditDriveDialog visible={isEditing} driveId={drive.id} onClose={() => setIsEditing(false)} />
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
  tripBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.xs,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.md,
  },
  mapContainer: {
    height: 280,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  timeline: {
    paddingBottom: spacing.xs,
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timelineRail: {
    alignItems: "center",
    width: 12,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: spacing.xs,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    marginTop: spacing.xs,
  },
  timelineBody: {
    flex: 1,
    gap: spacing.xxs,
    paddingBottom: spacing.md,
  },
  addHint: {
    textAlign: "center",
    marginTop: spacing.sm,
  },
  emptyMedia: {
    marginBottom: spacing.md,
  },
  mediaGrid: {
    marginBottom: spacing.md,
  },
});
