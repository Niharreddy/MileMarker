import { StorageKeys } from "@/constants/storageKeys";
import { appStorage } from "@/services/storage";
import { useSettingsStore } from "@/store";
import { distanceBetweenMeters } from "@/utils";

import { notifyDriveAutoStarted, notifyStopPrompt } from "./notifications";
import { recordDrivePoint } from "./recordDrivePoint";
import { useDriveStore } from "./store/driveStore";
import type { DrivePoint } from "./types";

/** Sustained speed above this is treated as driving, not walking/jogging. ~10 mph. */
const DRIVING_SPEED_MPS = 4.5;
/** Consecutive above-threshold samples required before auto-starting a drive. */
const DRIVING_CONFIRM_SAMPLES = 2;
/** At/below this is treated as "not moving". ~2 mph, loose enough to absorb GPS jitter. */
const STOP_SPEED_MPS = 1;
/** How long a drive has to sit stationary before we ask whether to stop tracking it. */
const STOP_PROMPT_MINUTES = 10;

function readLastSample(): DrivePoint | null {
  const raw = appStorage.getString(StorageKeys.autoDetectLastSample);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DrivePoint;
  } catch {
    return null;
  }
}

function writeLastSample(sample: DrivePoint) {
  appStorage.set(StorageKeys.autoDetectLastSample, JSON.stringify(sample));
}

/** Prefers the GPS fix's own speed reading; falls back to distance/time between the last two fixes. */
function estimateSpeedMps(sample: DrivePoint, reportedSpeedMps: number | null): number | null {
  if (reportedSpeedMps !== null && reportedSpeedMps >= 0) return reportedSpeedMps;

  const last = readLastSample();
  if (!last) return null;
  const dtSeconds = (sample.timestamp - last.timestamp) / 1000;
  if (dtSeconds <= 0) return null;
  return distanceBetweenMeters(last, sample) / dtSeconds;
}

function updateDrivingDetection(sample: DrivePoint, reportedSpeedMps: number | null) {
  const speedMps = estimateSpeedMps(sample, reportedSpeedMps);
  const previousSample = readLastSample();
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
  useDriveStore.getState().startDrive();
  // Back-fill the sample that first crossed the driving threshold (not just
  // the one that confirmed it), so the recorded route starts from where the
  // movement was actually detected instead of a beat late.
  if (previousSample) recordDrivePoint(previousSample);
  recordDrivePoint(sample);
  appStorage.set(StorageKeys.autoStartNoticePending, true);
  void notifyDriveAutoStarted();
}

function updateStopDetection(sample: DrivePoint, reportedSpeedMps: number | null) {
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
    const alreadyPending = appStorage.getBoolean(StorageKeys.stopPromptPending) ?? false;
    appStorage.set(StorageKeys.stopPromptPending, true);
    if (!alreadyPending) void notifyStopPrompt();
  }
}

/**
 * Single entry point for every raw location fix, from both the always-on
 * background task and foreground polling (see `useLocationMonitoring`).
 * Branches on whether a drive is currently active:
 *  - active: durably record the point, and watch for a long stop so a
 *    scenic-viewpoint stop doesn't silently fragment the drive.
 *  - idle: watch for sustained driving speed and auto-start a drive.
 */
export function handleLocationSample(sample: DrivePoint, reportedSpeedMps: number | null) {
  const driveId = appStorage.getString(StorageKeys.activeDriveId);

  if (driveId) {
    recordDrivePoint(sample);
    updateStopDetection(sample, reportedSpeedMps);
  } else {
    updateDrivingDetection(sample, reportedSpeedMps);
  }
}

/** Clears the rolling detection window — call whenever a drive starts or stops so detection begins fresh. */
export function resetAutoDetectState() {
  appStorage.delete(StorageKeys.autoDetectLastSample);
  appStorage.delete(StorageKeys.autoDetectConsecutiveDriving);
  appStorage.delete(StorageKeys.autoDetectStoppedSince);
  appStorage.set(StorageKeys.autoStartNoticePending, false);
  appStorage.set(StorageKeys.stopPromptPending, false);
}
