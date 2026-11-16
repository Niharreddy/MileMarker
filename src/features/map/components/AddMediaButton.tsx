import React, { useState } from "react";
import { Alert } from "react-native";

import { AppButton } from "@/components";

import { useGalleryPermission } from "../hooks/useGalleryPermission";
import type { Coordinates, PinMediaType } from "../types";
import { PhotoPickerSheet } from "./PhotoPickerSheet";

export type AddMediaButtonProps = {
  label?: string;
  disabled?: boolean;
  /** `location` is the media's own embedded GPS position, or null if it has none. */
  onPickMedia: (uri: string, mediaType: PinMediaType, location: Coordinates | null) => void | Promise<void>;
};

/**
 * Same request-permission-then-pick flow as `AddPinButton`, but an inline
 * button rather than a FAB — for screens like Drive/Trip Detail that show a
 * static map, not a live one to float a FAB over.
 */
export function AddMediaButton({ label = "Add Photo/Video", disabled = false, onPickMedia }: AddMediaButtonProps) {
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
      <AppButton label={label} variant="outline" disabled={disabled} onPress={handlePress} />
      <PhotoPickerSheet visible={isPickerVisible} onClose={() => setIsPickerVisible(false)} onSelect={handleSelectMedia} />
    </>
  );
}
