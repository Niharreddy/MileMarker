import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { FAB } from "react-native-paper";

import { spacing, useAppTheme } from "@/theme";

import { useGalleryPermission } from "../hooks/useGalleryPermission";
import { PhotoPickerSheet } from "./PhotoPickerSheet";

export type AddPinButtonProps = {
  /** Disable when there's nothing meaningful to attach a photo to (e.g. no active trip, no location yet). */
  disabled?: boolean;
  onPickPhoto: (uri: string) => void;
};

/**
 * Floating action button: requests gallery access (if not already granted),
 * opens the photo picker, and hands the chosen photo's URI back to the
 * caller. Deliberately has no opinion on what happens to that photo — the
 * caller (e.g. the trips feature) decides where the resulting pin goes.
 */
export function AddPinButton({ disabled = false, onPickPhoto }: AddPinButtonProps) {
  const theme = useAppTheme();
  const galleryPermission = useGalleryPermission();
  const [isPickerVisible, setIsPickerVisible] = useState(false);

  const handlePress = async () => {
    if (disabled) return;

    const granted = galleryPermission.isGranted || (await galleryPermission.request());
    if (!granted) return;

    setIsPickerVisible(true);
  };

  const handleSelectPhoto = (uri: string) => {
    onPickPhoto(uri);
    setIsPickerVisible(false);
  };

  return (
    <>
      <FAB
        icon="image-plus"
        style={[styles.fab, { backgroundColor: theme.palette.primary }]}
        color={theme.palette.onPrimary}
        disabled={disabled}
        onPress={handlePress}
      />
      <PhotoPickerSheet
        visible={isPickerVisible}
        onClose={() => setIsPickerVisible(false)}
        onSelect={handleSelectPhoto}
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
