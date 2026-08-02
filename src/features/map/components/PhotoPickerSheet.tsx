import React, { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet } from "react-native";
import * as MediaLibrary from "expo-media-library";

import { AppHeader, AppText, LoadingIndicator, ScreenContainer } from "@/components";
import { spacing } from "@/theme";

import { RECENT_PHOTOS_LIMIT } from "../constants";

export type PhotoPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (uri: string) => void;
};

const NUM_COLUMNS = 3;

/** Full-screen modal grid of recent camera-roll photos, used to pick one to attach to a pin. */
export function PhotoPickerSheet({ visible, onClose, onSelect }: PhotoPickerSheetProps) {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setIsLoading(true);
    MediaLibrary.getAssetsAsync({
      mediaType: "photo",
      first: RECENT_PHOTOS_LIMIT,
      sortBy: [["creationTime", false]],
    })
      .then((result) => {
        if (!cancelled) setAssets(result.assets);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ScreenContainer>
        <AppHeader
          title="Choose a photo"
          right={
            <Pressable onPress={onClose}>
              <AppText color="secondary">Cancel</AppText>
            </Pressable>
          }
        />

        {isLoading ? (
          <LoadingIndicator fullscreen label="Loading photos…" />
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(asset) => asset.id}
            numColumns={NUM_COLUMNS}
            ListEmptyComponent={<AppText color="secondary">No photos found on this device.</AppText>}
            renderItem={({ item }) => (
              <Pressable style={styles.cell} onPress={() => onSelect(item.uri)}>
                <Image source={{ uri: item.uri }} style={styles.thumbnail} />
              </Pressable>
            )}
          />
        )}
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cell: {
    flex: 1 / NUM_COLUMNS,
    aspectRatio: 1,
    padding: spacing.xxs,
  },
  thumbnail: {
    flex: 1,
    borderRadius: 4,
  },
});
