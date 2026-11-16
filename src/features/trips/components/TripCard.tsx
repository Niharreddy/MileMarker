import React from "react";
import { Image, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { AppText, Card, MetaItem } from "@/components";
import { getPinThumbnailUri, type Pin } from "@/features/map";
import { radii, spacing, useAppTheme } from "@/theme";
import { formatDate } from "@/utils";

import type { Trip } from "../types";

export type TripCardProps = {
  trip: Trip;
  driveCount: number;
  /** Pre-formatted combined distance of the trip's drives, e.g. "128.4 mi". */
  distanceLabel: string;
  photoCount: number;
  /** A photo to represent the trip — falls back to a suitcase placeholder when it has none yet. */
  coverPin?: Pin;
  onPress: () => void;
};

/** One saved trip as a tappable card: cover photo, name, dates, and its drive/distance/photo totals. */
export function TripCard({ trip, driveCount, distanceLabel, photoCount, coverPin, onPress }: TripCardProps) {
  const theme = useAppTheme();

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={[styles.cover, { backgroundColor: theme.palette.primaryContainer }]}>
        {coverPin ? (
          <Image source={{ uri: getPinThumbnailUri(coverPin) }} style={styles.coverImage} />
        ) : (
          <MaterialCommunityIcons name="bag-suitcase-outline" size={30} color={theme.palette.onPrimaryContainer} />
        )}
      </View>

      <View style={styles.body}>
        <AppText variant="titleMedium" numberOfLines={1}>
          {trip.name}
        </AppText>
        <AppText variant="bodySmall" color="secondary" numberOfLines={1}>
          {trip.dateLabel.trim() ? trip.dateLabel : formatDate(trip.startedAt)}
        </AppText>
        <View style={styles.metaRow}>
          <MetaItem icon="road-variant" label={`${driveCount} ${driveCount === 1 ? "drive" : "drives"}`} />
          <MetaItem icon="map-marker-distance" label={distanceLabel} />
          {photoCount > 0 ? <MetaItem icon="image-outline" label={String(photoCount)} /> : null}
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.palette.textDisabled} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cover: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    columnGap: spacing.md,
    rowGap: spacing.xs,
    marginTop: spacing.xs,
  },
});
