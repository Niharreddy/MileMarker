import * as MediaLibrary from "expo-media-library";

import { usePermission } from "./usePermission";

/**
 * Photos + videos only. Without an explicit list, expo-media-library on
 * Android 13+ also asks for "music and audio" access, which the app never uses.
 */
export const GALLERY_GRANULAR_PERMISSIONS: MediaLibrary.GranularPermission[] = ["photo", "video"];

const getGalleryPermission = () => MediaLibrary.getPermissionsAsync(false, GALLERY_GRANULAR_PERMISSIONS);
const requestGalleryPermission = () => MediaLibrary.requestPermissionsAsync(false, GALLERY_GRANULAR_PERMISSIONS);

/** Read-only gallery access, used to pick a photo to attach to a pin. */
export function useGalleryPermission() {
  return usePermission(getGalleryPermission, requestGalleryPermission);
}
