import React, { useMemo, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { AppButton, AppText, AppTextInput, ScreenContainer } from "@/components";
import { useDriveStore } from "@/features/drives";
import { getPinThumbnailUri, MediaViewerModal, RouteMap } from "@/features/map";
import { useTripStore } from "@/features/trips";
import type { RootStackParamList } from "@/navigation";
import { spacing, useAppTheme } from "@/theme";
import { formatDuration, formatStartedAt } from "@/utils";

type Props = NativeStackScreenProps<RootStackParamList, "Trip">;

export function TripDetailScreen({ route }: Props) {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const trip = useTripStore((state) => state.pastTrips.find((candidate) => candidate.id === route.params.tripId));
  const updateTripReview = useTripStore((state) => state.updateTripReview);
  const allDrives = useDriveStore((state) => state.pastDrives);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState("");

  const memberDrives = useMemo(
    () => allDrives.filter((drive) => drive.tripId === trip?.id),
    [allDrives, trip?.id]
  );
  const pins = useMemo(() => memberDrives.flatMap((drive) => drive.pins), [memberDrives]);
  const routes = useMemo(
    () => memberDrives.map((drive) => ({ id: drive.id, coordinates: drive.points })),
    [memberDrives]
  );

  if (!trip) {
    return (
      <ScreenContainer>
        <AppText color="secondary">This trip could not be found.</AppText>
      </ScreenContainer>
    );
  }

  const openDescriptionEditor = () => {
    setDescriptionDraft(trip.review);
    setIsEditingDescription(true);
  };

  const saveDescription = () => {
    updateTripReview(trip.id, descriptionDraft.trim());
    setIsEditingDescription(false);
  };

  return (
    <ScreenContainer scrollable>
      <AppText variant="titleLarge">{trip.name}</AppText>

      <Pressable onPress={openDescriptionEditor} style={styles.descriptionRow}>
        <AppText color={trip.review.trim() ? "primary" : "secondary"}>
          {trip.review.trim() ? trip.review : "Add a description…"}
        </AppText>
      </Pressable>

      <AppText color="secondary" style={styles.meta}>
        {trip.dateLabel.trim() ? `${trip.dateLabel} · ` : ""}
        {formatStartedAt(trip.startedAt)} · {formatDuration(trip.startedAt, trip.endedAt)} · {memberDrives.length}{" "}
        {memberDrives.length === 1 ? "drive" : "drives"}
      </AppText>

      <View style={[styles.mapContainer, { borderColor: theme.palette.border }]}>
        <RouteMap currentLocation={null} pins={pins} notes={trip.notes} routes={routes} />
      </View>

      {trip.notes.length > 0 ? (
        <>
          <AppText variant="titleSmall" style={styles.sectionTitle}>
            Comments
          </AppText>
          {trip.notes.map((note) => (
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
        Drives
      </AppText>
      {memberDrives.length === 0 ? (
        <AppText color="secondary">No drives are part of this trip yet.</AppText>
      ) : (
        memberDrives.map((drive) => (
          <Pressable
            key={drive.id}
            onPress={() => navigation.navigate("Drive", { driveId: drive.id })}
            style={[styles.driveRow, { borderBottomColor: theme.palette.border }]}
          >
            <AppText variant="titleSmall">{drive.name}</AppText>
            <AppText color="secondary" variant="bodySmall">
              {formatStartedAt(drive.startedAt)} · {formatDuration(drive.startedAt, drive.endedAt)}
            </AppText>
          </Pressable>
        ))
      )}

      <AppText variant="titleSmall" style={styles.sectionTitle}>
        Photos
      </AppText>
      {pins.length === 0 ? (
        <AppText color="secondary">No photos attached to this trip's drives yet.</AppText>
      ) : (
        <FlatList
          horizontal
          data={pins}
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

      <MediaViewerModal pins={pins} initialIndex={viewerIndex} onClose={() => setViewerIndex(null)} />

      <Modal
        visible={isEditingDescription}
        transparent
        animationType="fade"
        onRequestClose={() => setIsEditingDescription(false)}
      >
        <View style={styles.editBackdrop}>
          <View style={[styles.editCard, { backgroundColor: theme.palette.surface }]}>
            <AppText variant="titleMedium" style={styles.editTitle}>
              Trip description
            </AppText>
            <AppTextInput
              label="Describe this trip"
              value={descriptionDraft}
              onChangeText={setDescriptionDraft}
              multiline
              numberOfLines={4}
              autoFocus
              style={styles.editField}
            />
            <AppButton label="Save" onPress={saveDescription} style={styles.editField} />
            <AppButton label="Cancel" variant="text" onPress={() => setIsEditingDescription(false)} />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  descriptionRow: {
    marginTop: spacing.xs,
  },
  meta: {
    marginTop: spacing.xs,
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
  driveRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xxs,
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
  editBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  editCard: {
    width: "100%",
    borderRadius: 16,
    padding: spacing.lg,
  },
  editTitle: {
    marginBottom: spacing.sm,
  },
  editField: {
    marginBottom: spacing.md,
  },
});
