import * as MediaLibrary from "expo-media-library";

import { usePermission } from "./usePermission";

/** Read-only gallery access, used to pick a photo to attach to a pin. */
export function useGalleryPermission() {
  return usePermission(MediaLibrary.getPermissionsAsync, MediaLibrary.requestPermissionsAsync);
}
