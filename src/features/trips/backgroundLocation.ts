import * as Location from "expo-location";

import { LOCATION_POLL_INTERVAL_MS } from "@/features/map";

import { BACKGROUND_LOCATION_TASK } from "./backgroundLocationTask";

/**
 * Starts the OS-level location subscription backing `BACKGROUND_LOCATION_TASK`.
 * One subscription serves both driving auto-detection and active-trip
 * recording — see `useLocationMonitoring` for when this runs, and
 * `handleLocationSample` for how each fix is interpreted. Runs a persistent
 * Android foreground-service notification while active — without it,
 * Android is far more likely to kill the app process (and the task with
 * it) once it's backgrounded for more than a few minutes.
 */
export async function startLocationMonitoring() {
  const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (alreadyStarted) return;

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: LOCATION_POLL_INTERVAL_MS,
    distanceInterval: 50,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Mile Marker",
      notificationBody: "Watching for drives and tracking any trip in progress.",
    },
  });
}

export async function stopLocationMonitoring() {
  const isStarted = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  if (isStarted) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
