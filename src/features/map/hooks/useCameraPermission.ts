import * as ImagePicker from "expo-image-picker";

import { usePermission } from "./usePermission";

/** Camera access, used to take a new photo to attach to a pin. */
export function useCameraPermission() {
  return usePermission(ImagePicker.getCameraPermissionsAsync, ImagePicker.requestCameraPermissionsAsync);
}
