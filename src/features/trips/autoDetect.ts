import { StorageKeys } from "@/constants/storageKeys";
import { appStorage } from "@/services/storage";
import { useSettingsStore } from "@/store";

import { distanceBetweenMeters } from "./distance";
import { recordTripPoint } from "./recordTripPoint";
import { useTripStore } from "./store/tripStore";
import type { TripPoint } from "./types";

/** Sustained speed above this is treated as driving, not walking/jogging. ~10 mph. */
const DRIVING_SPEED_MPS = 4.5;
/** Consecutive above-threshold samples required before auto-starting a trip. */
const DRIVING_CONFIRM_SAMPLES = 2;
/** At/below this is treated as "not moving". ~2 mph, loose enough to absorb GPS jitter. */
const STOP_SPEED_MPS = 1;
/** How long a trip has to sit stationary before we ask whether to stop tracking it. */
const STOP_PROMPT_MINUTES = 10;

function readLastSample(): TripPoint | null {
  const raw = appStorage.getString(StorageKeys.autoDetectLastSample);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TripPoint;
  } catch {
    return null;
  }
}

function writeLastSample(sample: TripPoint) {
  appStorage.set(StorageKeys.autoDetectLastSample, JSON.stringify(sample));
}

/** Prefers the GPS fix's own speed reading; falls back to distance/time between the last two fixes. */
function estimateSpeedMps(sample: TripPoint, reportedSpeedMps: number | null): number | null {
  if (reportedSpeedMps !== null && reportedSpeedMps >= 0) return reportedSpeedMps;

  const last = readLastSample();
  if (!last) return null;
  const dtSeconds = (sample.timestamp - last.timestamp) / 1000;
  if (dtSeconds <= 0) return null;
  return distanceBetweenMeters(last, sample) / dtSeconds;
}

function updateDrivingDetection(sample: TripPoint, reportedSpeedMps: number | null) {
  const speedMps = estimateSpeedMps(sample, reportedSpeedMps);
  writeLastSample(sample);

  if (!useSettingsStore.getState().autoDetectDrivingEnabled) {
    appStorage.set(StorageKeys.autoDetectConsecutiveDriving, 0);
    return;
  }

  const isDriving = speedMps !== null && speedMps >= DRIVING_SPEED_MPS;
  if (!isDriving) {
    appStorage.set(StorageKeys.autoDetectConsecutiveDriving, 0);
    return;
  }

  const consecutive = (appStorage.getNumber(StorageKeys.autoDetectConsecutiveDriving) ?? 0) + 1;
  if (consecutive < DRIVING_CONFIRM_SAMPLES) {
    appStorage.set(StorageKeys.autoDetectConsecutiveDriving, consecutive);
    return;
  }

  appStorage.set(StorageKeys.autoDetectConsecutiveDriving, 0);
  useTripStore.getState().startTrip();
  appStorage.set(StorageKeys.autoStartNoticePending, true);
}

function updateStopDetection(sample: TripPoint, reportedSpeedMps: number | null) {
  const speedMps = estimateSpeedMps(sample, reportedSpeedMps);
  writeLastSample(sample);

  const isStopped = speedMps !== null && speedMps <= STOP_SPEED_MPS;
  if (!isStopped) {
    appStorage.delete(StorageKeys.autoDetectStoppedSince);
    return;
  }

  const stoppedSinceRaw = appStorage.getString(StorageKeys.autoDetectStoppedSince);
  if (!stoppedSinceRaw) {
    appStorage.set(StorageKeys.autoDetectStoppedSince, String(sample.timestamp));
    return;
  }

  const stoppedMinutes = (sample.timestamp - Number(stoppedSinceRaw)) / 60_000;
  if (stoppedMinutes >= STOP_PROMPT_MINUTES) {
    appStorage.set(StorageKeys.stopPromptPending, true);
  }
}

/**
 * Single entry point for every raw location fix, from both the always-on
 * background task and foreground polling (see `useLocationMonitoring`).
 * Branches on whether a trip is currently active:
 *  - active: durably record the point, and watch for a long stop so a
 *    scenic-viewpoint stop doesn't silently fragment the trip.
 *  - idle: watch for sustained driving speed and auto-start a trip.
 */
export function handleLocationSample(sample: TripPoint, reportedSpeedMps: number | null) {
  const tripId = appStorage.getString(StorageKeys.activeTripId);

  if (tripId) {
    recordTripPoint(sample);
    updateStopDetection(sample, reportedSpeedMps);
  } else {
    updateDrivingDetection(sample, reportedSpeedMps);
  }
}

/** Clears the rolling detection window — call whenever a trip starts or stops so detection begins fresh. */
export function resetAutoDetectState() {
  appStorage.delete(StorageKeys.autoDetectLastSample);
  appStorage.delete(StorageKeys.autoDetectConsecutiveDriving);
  appStorage.delete(StorageKeys.autoDetectStoppedSince);
  appStorage.set(StorageKeys.autoStartNoticePending, false);
  appStorage.set(StorageKeys.stopPromptPending, false);
}
