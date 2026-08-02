import * as Location from "expo-location";

import { usePermission } from "./usePermission";

/**
 * Background location permission. Platform rule: only request this after
 * foreground permission is already granted (both the permissions-priming
 * screen and `useBackgroundTripTracking` respect that ordering).
 */
export function useBackgroundLocationPermission() {
  return usePermission(
    Location.getBackgroundPermissionsAsync,
    Location.requestBackgroundPermissionsAsync
  );
}
