import * as Location from "expo-location";

import { LOCATION_POLL_INTERVAL_MS } from "@/features/map";

import { BACKGROUND_LOCATION_TASK } from "./backgroundLocationTask";

/**
 * Starts the OS-level location subscription backing `BACKGROUND_LOCATION_TASK`.
 * Runs a persistent Android foreground-service notification while active —
 * without it, Android is far more likely to kill the app process (and the
 * task with it) once it's backgrounded for more than a few minutes.
 */
export async function startBackgroundLocationUpdates() {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: LOCATION_POLL_INTERVAL_MS,
    distanceInterval: 50,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Mile Marker is recording your trip",
      notificationBody: "Tap to return to the app.",
    },
  });
}

export async function stopBackgroundLocationUpdates() {
  const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
