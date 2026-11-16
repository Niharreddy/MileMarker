import React, { useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import {
  AppHeader,
  EmptyState,
  ScreenContainer,
  SectionHeader,
  SegmentedControl,
  type SegmentedOption,
} from "@/components";
import { useDriveStore } from "@/features/drives";
import { getPinThumbnailUri, MediaViewerModal, type Pin } from "@/features/map";
import { useTripStore } from "@/features/trips";
import { radii, spacing, useAppTheme } from "@/theme";
import { groupByMonth } from "@/utils";

type Memory = { pin: Pin } & ({ type: "drive"; driveId: string } | { type: "trip"; tripId: string });

type MediaFilter = "all" | "photo" | "video";

const FILTER_OPTIONS: readonly SegmentedOption<MediaFilter>[] = [
  { value: "all", label: "All" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
];

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;

/**
 * FlatList can't mix section headers with `numColumns`, so the grid is
 * flattened into rows by hand: a month heading row, then rows of up to
 * three tiles. `index` is each tile's position in the full filtered list,
 * which is what the viewer pages through.
 */
type GridRow =
  | { kind: "header"; key: string; title: string }
  | { kind: "tiles"; key: string; tiles: { memory: Memory; index: number }[] };

/** Every photo/video pinned across all drives and trips, newest first, grouped by month. */
export function MemoriesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastDrives = useDriveStore((state) => state.pastDrives);
  const pastTrips = useTripStore((state) => state.pastTrips);
  const [filter, setFilter] = useState<MediaFilter>("all");
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const allMemories = useMemo(() => {
    const flattened: Memory[] = [];
    for (const drive of pastDrives) {
      for (const pin of drive.pins) flattened.push({ pin, type: "drive", driveId: drive.id });
    }
    for (const trip of pastTrips) {
      for (const pin of trip.pins) flattened.push({ pin, type: "trip", tripId: trip.id });
    }
    return flattened.sort((a, b) => b.pin.createdAt - a.pin.createdAt);
  }, [pastDrives, pastTrips]);

  const memories = useMemo(
    () => (filter === "all" ? allMemories : allMemories.filter((memory) => memory.pin.mediaType === filter)),
    [allMemories, filter]
  );
  const pins = useMemo(() => memories.map((memory) => memory.pin), [memories]);

  const rows = useMemo(() => {
    const result: GridRow[] = [];
    let index = 0;
    for (const section of groupByMonth(memories, (memory) => memory.pin.createdAt)) {
      result.push({ kind: "header", key: `header-${section.title}`, title: section.title });
      for (let start = 0; start < section.data.length; start += GRID_COLUMNS) {
        const tiles = section.data.slice(start, start + GRID_COLUMNS).map((memory) => ({ memory, index: index++ }));
        result.push({ kind: "tiles", key: tiles.map((tile) => tile.memory.pin.id).join("-"), tiles });
      }
    }
    return result;
  }, [memories]);

  const openSource = (pin: Pin) => {
    const memory = memories.find((candidate) => candidate.pin.id === pin.id);
    if (!memory) return;
    setViewerIndex(null);
    if (memory.type === "drive") navigation.navigate("Drive", { driveId: memory.driveId });
    else navigation.navigate("Trip", { tripId: memory.tripId });
  };

  const sourceLabel = (pin: Pin) =>
    memories.find((candidate) => candidate.pin.id === pin.id)?.type === "trip" ? "View trip" : "View drive";

  const photoCount = allMemories.filter((memory) => memory.pin.mediaType === "photo").length;
  const videoCount = allMemories.length - photoCount;
  const subtitle =
    allMemories.length === 0
      ? undefined
      : [
          photoCount > 0 ? `${photoCount} ${photoCount === 1 ? "photo" : "photos"}` : null,
          videoCount > 0 ? `${videoCount} ${videoCount === 1 ? "video" : "videos"}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

  return (
    <ScreenContainer edges={["top", "left", "right"]}>
      <AppHeader title="Memories" subtitle={subtitle} />

      {allMemories.length === 0 ? (
        <EmptyState
          icon="image-multiple-outline"
          title="No memories yet"
          message="Photos and videos you add to a drive or trip will be collected here."
        />
      ) : (
        <>
          <SegmentedControl options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <EmptyState
                icon={filter === "video" ? "video-outline" : "image-outline"}
                title={filter === "video" ? "No videos yet" : "No photos yet"}
              />
            }
            renderItem={({ item }) =>
              item.kind === "header" ? (
                <SectionHeader title={item.title} />
              ) : (
                <View style={styles.row}>
                  {item.tiles.map(({ memory, index }) => (
                    <Pressable
                      key={memory.pin.id}
                      style={[styles.tile, { backgroundColor: theme.palette.surfaceVariant }]}
                      onPress={() => setViewerIndex(index)}
                    >
                      <Image source={{ uri: getPinThumbnailUri(memory.pin) }} style={styles.image} />
                      {memory.pin.mediaType === "video" ? (
                        <View style={styles.videoBadge}>
                          <MaterialCommunityIcons name="play-circle" size={26} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                  {/* Invisible fillers keep a short last row's tiles the same width as full rows. */}
                  {Array.from({ length: GRID_COLUMNS - item.tiles.length }, (_, fillerIndex) => (
                    <View key={`filler-${fillerIndex}`} style={styles.filler} />
                  ))}
                </View>
              )
            }
          />
        </>
      )}

      <MediaViewerModal
        pins={pins}
        initialIndex={viewerIndex}
        onClose={() => setViewerIndex(null)}
        actionLabel={sourceLabel}
        onAction={openSource}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: "row",
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  tile: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.md,
    overflow: "hidden",
  },
  filler: {
    flex: 1,
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
});
