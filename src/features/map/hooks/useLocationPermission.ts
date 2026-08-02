import * as Location from "expo-location";

import { usePermission } from "./usePermission";

/** Foreground-only location permission — no background tracking in this feature yet. */
export function useLocationPermission() {
  return usePermission(
    Location.getForegroundPermissionsAsync,
    Location.requestForegroundPermissionsAsync
  );
}
