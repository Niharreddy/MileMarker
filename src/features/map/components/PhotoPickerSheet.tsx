import React, { useEffect, useState } from "react";
import { FlatList, Image, Modal, Pressable, StyleSheet, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";

import { AppHeader, AppText, LoadingIndicator, ScreenContainer } from "@/components";
import { spacing, useAppTheme } from "@/theme";

import { RECENT_PHOTOS_LIMIT } from "../constants";
import { useCameraPermission } from "../hooks/useCameraPermission";
import type { PinMediaType } from "../types";

export type PhotoPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (uri: string, mediaType: PinMediaType) => void;
};

const NUM_COLUMNS = 3;

/** Full-screen modal grid of recent camera-roll photos and videos, used to pick one to attach to a pin. */
export function PhotoPickerSheet({ visible, onClose, onSelect }: PhotoPickerSheetProps) {
  const theme = useAppTheme();
  const cameraPermission = useCameraPermission();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleTakePhoto = async () => {
    const granted = cameraPermission.isGranted || (await cameraPermission.request());
    if (!granted) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    const asset = result.assets?.[0];
    if (!result.canceled && asset) onSelect(asset.uri, asset.type === "video" ? "video" : "photo");
  };

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    setIsLoading(true);
    MediaLibrary.getAssetsAsync({
      mediaType: ["photo", "video"],
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
          title="Choose a photo or video"
          right={
            <Pressable onPress={onClose}>
              <AppText color="secondary">Cancel</AppText>
            </Pressable>
          }
        />

        <Pressable
          style={[styles.takePhotoRow, { borderBottomColor: theme.palette.border }]}
          onPress={handleTakePhoto}
        >
          <MaterialCommunityIcons name="camera-outline" size={22} color={theme.palette.primary} />
          <AppText style={[styles.takePhotoLabel, { color: theme.palette.primary }]}>
            Take Photo or Video
          </AppText>
        </Pressable>

        {isLoading ? (
          <LoadingIndicator fullscreen label="Loading photos…" />
        ) : (
          <FlatList
            data={assets}
            keyExtractor={(asset) => asset.id}
            numColumns={NUM_COLUMNS}
            ListEmptyComponent={<AppText color="secondary">No photos or videos found on this device.</AppText>}
            renderItem={({ item }) => (
              <Pressable
                style={styles.cell}
                onPress={() => onSelect(item.uri, item.mediaType === "video" ? "video" : "photo")}
              >
                {item.mediaType === "video" ? (
                  <View style={[styles.thumbnail, styles.videoPlaceholder]}>
                    <MaterialCommunityIcons name="play-circle" size={28} color="#FFFFFF" />
                  </View>
                ) : (
                  <Image source={{ uri: item.uri }} style={styles.thumbnail} />
                )}
              </Pressable>
            )}
          />
        )}
      </ScreenContainer>
    </Modal>
  );
}

const styles = StyleSheet.create({
  takePhotoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  takePhotoLabel: {
    fontWeight: "600",
  },
  cell: {
    flex: 1 / NUM_COLUMNS,
    aspectRatio: 1,
    padding: spacing.xxs,
  },
  thumbnail: {
    flex: 1,
    borderRadius: 4,
  },
  videoPlaceholder: {
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
