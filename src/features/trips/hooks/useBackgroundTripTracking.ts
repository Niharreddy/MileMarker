import { useCallback } from "react";
import * as Location from "expo-location";

import { startBackgroundLocationUpdates, stopBackgroundLocationUpdates } from "../backgroundLocation";
import { useTripStore } from "../store/tripStore";

/**
 * Wraps `tripStore.startTrip`/`stopTrip` with the background location
 * permission request and task lifecycle. Falls back to foreground-only
 * recording (via `useTripRecorder`) if background permission is denied —
 * starting a trip never hard-fails on that.
 */
export function useBackgroundTripTracking() {
  const startTripInStore = useTripStore((state) => state.startTrip);
  const stopTripInStore = useTripStore((state) => state.stopTrip);
  const setBackgroundTrackingActive = useTripStore((state) => state.setBackgroundTrackingActive);

  const startTrip = useCallback(async () => {
    const { status } = await Location.requestBackgroundPermissionsAsync();

    if (status === Location.PermissionStatus.GRANTED) {
      await startBackgroundLocationUpdates();
      setBackgroundTrackingActive(true);
    } else {
      setBackgroundTrackingActive(false);
    }

    startTripInStore();
  }, [startTripInStore, setBackgroundTrackingActive]);

  const stopTrip = useCallback(async () => {
    if (useTripStore.getState().isBackgroundTrackingActive) {
      await stopBackgroundLocationUpdates();
    }
    stopTripInStore();
  }, [stopTripInStore]);

  return { startTrip, stopTrip };
}
