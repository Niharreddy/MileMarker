import React, { useMemo } from "react";
import { Image, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText, Card, MetaItem } from "@/components";
import { getPinThumbnailUri } from "@/features/map";
import { useSettingsStore } from "@/store";
import { radii, spacing, useAppTheme } from "@/theme";
import { calculateRouteDistanceMeters, formatDate, formatDistance, formatDuration, formatTime } from "@/utils";

import type { Drive } from "../types";

const MAX_THUMBNAILS = 4;

export type DriveCardProps = {
  drive: Drive;
  /** Name of the Trip this drive is bundled into, shown as a badge. Omit where that's already obvious (e.g. on Trip Detail). */
  tripName?: string;
  onPress: () => void;
};

/** One saved drive as a tappable card: name, when, distance/duration, and a strip of its first few photos. */
export function DriveCard({ drive, tripName, onPress }: DriveCardProps) {
  const theme = useAppTheme();
  const unitPreference = useSettingsStore((state) => state.unitPreference);
  const distanceMeters = useMemo(() => calculateRouteDistanceMeters(drive.points), [drive.points]);

  const thumbnails = drive.pins.slice(0, MAX_THUMBNAILS);
  const hiddenCount = drive.pins.length - thumbnails.length;

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.titleRow}>
        <View style={styles.titles}>
          <AppText variant="titleMedium" numberOfLines={1}>
            {drive.name}
          </AppText>
          <AppText variant="bodySmall" color="secondary">
            {formatDate(drive.startedAt)} · {formatTime(drive.startedAt)}
          </AppText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={22} color={theme.palette.textDisabled} />
      </View>

      <View style={styles.metaRow}>
        <MetaItem icon="map-marker-distance" label={formatDistance(distanceMeters, unitPreference)} />
        <MetaItem icon="clock-outline" label={formatDuration(drive.startedAt, drive.endedAt)} />
        {drive.notes.length > 0 ? (
          <MetaItem icon="comment-text-outline" label={String(drive.notes.length)} />
        ) : null}
        {tripName ? <MetaItem icon="bag-suitcase-outline" label={tripName} highlighted /> : null}
      </View>

      {drive.review.trim() ? (
        <AppText color="secondary" numberOfLines={2}>
          {drive.review}
        </AppText>
      ) : null}

      {thumbnails.length > 0 ? (
        <View style={styles.thumbnailRow}>
          {thumbnails.map((pin, index) => (
            <View key={pin.id} style={[styles.thumbnail, { backgroundColor: theme.palette.surfaceVariant }]}>
              <Image source={{ uri: getPinThumbnailUri(pin) }} style={styles.thumbnailImage} />
              {hiddenCount > 0 && index === thumbnails.length - 1 ? (
                <View style={styles.moreOverlay}>
                  <AppText variant="labelLarge" style={styles.moreText}>
                    +{hiddenCount}
                  </AppText>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titles: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.md,
    rowGap: spacing.xs,
  },
  thumbnailRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  moreText: {
    color: "#FFFFFF",
  },
});
