import { useCallback } from "react";

import { findGeotaggedPhotosForTrip } from "../autoMatchPhotos";
import { resetAutoDetectState } from "../autoDetect";
import { useTripStore } from "../store/tripStore";

/**
 * Wraps `tripStore.startTrip`/`stopTrip` with auto-detect state resets and
 * post-stop geotagged-photo matching. The background location subscription
 * itself is no longer tied to trip start/stop — see `useLocationMonitoring`,
 * which runs it continuously (permission and settings allowing) so driving
 * can be detected even with no trip active.
 */
export function useBackgroundTripTracking() {
  const startTripInStore = useTripStore((state) => state.startTrip);
  const stopTripInStore = useTripStore((state) => state.stopTrip);
  const addPinsToPendingTrip = useTripStore((state) => state.addPinsToPendingTrip);

  const startTrip = useCallback(() => {
    resetAutoDetectState();
    startTripInStore();
  }, [startTripInStore]);

  const stopTrip = useCallback(async () => {
    resetAutoDetectState();
    stopTripInStore();

    const stoppedTrip = useTripStore.getState().pendingTrip;
    if (stoppedTrip) {
      const matchedPins = await findGeotaggedPhotosForTrip(stoppedTrip);
      addPinsToPendingTrip(matchedPins);
    }
  }, [stopTripInStore, addPinsToPendingTrip]);

  return { startTrip, stopTrip };
}
