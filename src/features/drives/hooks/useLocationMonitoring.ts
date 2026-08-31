import { useEffect } from "react";

import { useBackgroundLocationPermission } from "@/features/map";
import { useSettingsStore } from "@/store";

import { startLocationMonitoring, stopLocationMonitoring } from "../backgroundLocation";
import { useDriveStore } from "../store/driveStore";

/**
 * Owns the always-on background location subscription's lifecycle. Runs it
 * continuously whenever background permission is granted and the user has
 * auto-detect turned on (so driving can be noticed even with the app
 * closed and no drive active) — or, if auto-detect is off, only while a
 * drive is actively being recorded (so a manually-started drive still
 * survives being backgrounded, without a standing battery cost otherwise).
 * Mount once near the app root, not per-screen.
 */
export function useLocationMonitoring() {
  const backgroundPermission = useBackgroundLocationPermission();
  const autoDetectEnabled = useSettingsStore((state) => state.autoDetectDrivingEnabled);
  const isRecording = useDriveStore((state) => state.activeDrive !== null);
  const setBackgroundTrackingActive = useDriveStore((state) => state.setBackgroundTrackingActive);

  const shouldMonitor = backgroundPermission.isGranted && (autoDetectEnabled || isRecording);

  useEffect(() => {
    if (backgroundPermission.isChecking) return;

    if (shouldMonitor) {
      startLocationMonitoring();
      setBackgroundTrackingActive(true);
    } else {
      stopLocationMonitoring();
      setBackgroundTrackingActive(false);
    }
  }, [backgroundPermission.isChecking, shouldMonitor, setBackgroundTrackingActive]);
}
