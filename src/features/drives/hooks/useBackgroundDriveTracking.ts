import { useCallback } from "react";

import { findGeotaggedPhotosForDrive } from "../autoMatchPhotos";
import { resetAutoDetectState } from "../autoDetect";
import { useDriveStore } from "../store/driveStore";

/**
 * Wraps `driveStore.startDrive`/`stopDrive` with auto-detect state resets and
 * post-stop geotagged-photo matching. The background location subscription
 * itself is no longer tied to drive start/stop — see `useLocationMonitoring`,
 * which runs it continuously (permission and settings allowing) so driving
 * can be detected even with no drive active.
 */
export function useBackgroundDriveTracking() {
  const startDriveInStore = useDriveStore((state) => state.startDrive);
  const stopDriveInStore = useDriveStore((state) => state.stopDrive);
  const addPinsToPendingDrive = useDriveStore((state) => state.addPinsToPendingDrive);

  const startDrive = useCallback(() => {
    resetAutoDetectState();
    startDriveInStore();
  }, [startDriveInStore]);

  const stopDrive = useCallback(async () => {
    resetAutoDetectState();
    stopDriveInStore();

    const stoppedDrive = useDriveStore.getState().pendingDrive;
    if (stoppedDrive) {
      const matchedPins = await findGeotaggedPhotosForDrive(stoppedDrive);
      addPinsToPendingDrive(matchedPins);
    }
  }, [stopDriveInStore, addPinsToPendingDrive]);

  return { startDrive, stopDrive };
}
