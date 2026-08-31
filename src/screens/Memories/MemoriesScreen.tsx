import React, { useMemo } from "react";
import { FlatList, Image, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { AppHeader, AppText, ScreenContainer } from "@/components";
import { useDriveStore } from "@/features/drives";
import { getPinThumbnailUri, type Pin } from "@/features/map";
import { spacing, useAppTheme } from "@/theme";

type Memory = {
  pin: Pin;
  driveId: string;
  driveName: string;
};

const GRID_COLUMNS = 3;
const GRID_GAP = spacing.xs;

/** Every photo/video pinned across all drives, flattened and sorted newest first. */
export function MemoriesScreen() {
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pastDrives = useDriveStore((state) => state.pastDrives);

  const memories = useMemo(() => {
    const flattened: Memory[] = [];
    for (const drive of pastDrives) {
      for (const pin of drive.pins) {
        flattened.push({ pin, driveId: drive.id, driveName: drive.name });
      }
    }
    return flattened.sort((a, b) => b.pin.createdAt - a.pin.createdAt);
  }, [pastDrives]);

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
            Photos and videos you pin during a drive will show up here.
          </AppText>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.tile, { borderColor: theme.palette.border }]}
            onPress={() => navigation.navigate("Drive", { driveId: item.driveId })}
          >
            <Image source={{ uri: getPinThumbnailUri(item.pin) }} style={styles.image} />
            {item.pin.mediaType === "video" ? (
              <View style={styles.videoBadge}>
                <MaterialCommunityIcons name="play-circle" size={22} color="#FFFFFF" />
              </View>
            ) : null}
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
  videoBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
});
