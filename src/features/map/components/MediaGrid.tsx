import React from "react";
import { Image, Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { radii, spacing, useAppTheme } from "@/theme";

import { getPinThumbnailUri } from "../pinMedia";
import type { Pin } from "../types";

const COLUMNS = 3;
const GAP = spacing.xs;

export type MediaGridProps = {
  pins: Pin[];
  onPressPin: (index: number) => void;
  /** When set, each tile gets a small remove (×) control in its corner. */
  onRemovePin?: (index: number) => void;
  /** Total horizontal padding around the grid, so tiles can be sized to fit exactly. Defaults to the standard screen gutters. */
  horizontalInset?: number;
};

/**
 * Non-virtualized 3-column photo/video grid, for embedding in an already
 * scrolling screen (Drive/Trip detail). The Memories tab has its own
 * virtualized version, since it can hold every photo in the app.
 */
export function MediaGrid({ pins, onPressPin, onRemovePin, horizontalInset = spacing.md * 2 }: MediaGridProps) {
  const theme = useAppTheme();
  const { width } = useWindowDimensions();
  const tileSize = Math.floor((width - horizontalInset - GAP * (COLUMNS - 1)) / COLUMNS);

  return (
    <View style={styles.grid}>
      {pins.map((pin, index) => (
        <View key={pin.id} style={{ width: tileSize, height: tileSize }}>
          <Pressable
            onPress={() => onPressPin(index)}
            style={[styles.tile, { backgroundColor: theme.palette.surfaceVariant }]}
          >
            <Image source={{ uri: getPinThumbnailUri(pin) }} style={styles.image} />
            {pin.mediaType === "video" ? (
              <View style={styles.videoBadge}>
                <MaterialCommunityIcons name="play-circle" size={26} color="#FFFFFF" />
              </View>
            ) : null}
          </Pressable>
          {onRemovePin ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove"
              onPress={() => onRemovePin(index)}
              hitSlop={8}
              style={styles.removeBadge}
            >
              <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  tile: {
    flex: 1,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  removeBadge: {
    position: "absolute",
    top: spacing.xs,
    right: spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
});
