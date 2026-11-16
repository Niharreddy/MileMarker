import React, { useState } from "react";
import { Alert, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { FAB } from "react-native-paper";

import { spacing, useAppTheme } from "@/theme";

import { useGalleryPermission } from "../hooks/useGalleryPermission";
import type { Coordinates, PinMediaType } from "../types";
import { PhotoPickerSheet } from "./PhotoPickerSheet";

export type AddPinButtonProps = {
  /** Disable when there's nothing meaningful to attach a photo to (e.g. no active trip, no location yet). */
  disabled?: boolean;
  /** `location` is the media's own embedded GPS position, or null if it has none. */
  onPickMedia: (uri: string, mediaType: PinMediaType, location: Coordinates | null) => void | Promise<void>;
  /** Overrides the default bottom-right absolute placement — e.g. to stack it in a host-owned column of map controls. */
  style?: StyleProp<ViewStyle>;
};

/**
 * Floating action button: requests gallery access (if not already granted),
 * opens the photo/video picker, and hands the chosen media's URI and type
 * back to the caller. Deliberately has no opinion on what happens to that
 * media — the caller (e.g. the trips feature) decides where the resulting
 * pin goes.
 */
export function AddPinButton({ disabled = false, onPickMedia, style }: AddPinButtonProps) {
  const theme = useAppTheme();
  const galleryPermission = useGalleryPermission();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handlePress = async () => {
    if (disabled) return;

    try {
      const granted = galleryPermission.isGranted || (await galleryPermission.request());
      if (!granted) return;
      setIsPickerVisible(true);
    } catch {
      Alert.alert("Gallery unavailable", "Mile Marker couldn't access your photos. Check the app's permissions in Settings.");
    }
  };

  const handleSelectMedia = async (uri: string, mediaType: PinMediaType, location: Coordinates | null) => {
    setIsPickerVisible(false);
    try {
      await onPickMedia(uri, mediaType, location);
    } catch (error) {
      Alert.alert(
        "Couldn't add that photo/video",
        error instanceof Error ? error.message : "Something went wrong while saving it. Please try again."
      );
    }
  };

  return (
    <>
      <FAB
        icon="image-plus"
        style={[styles.fab, { backgroundColor: theme.palette.primary }, style]}
        color={theme.palette.onPrimary}
        disabled={disabled}
        onPress={handlePress}
      />
      <PhotoPickerSheet
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleSelectMedia}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.lg,
  },
});
