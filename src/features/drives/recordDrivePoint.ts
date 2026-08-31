import { StorageKeys } from "@/constants/storageKeys";
import { appStorage } from "@/services/storage";

import { persistDrivePoint } from "./persistence";
import { useDriveStore } from "./store/driveStore";
import type { DrivePoint } from "./types";

/**
 * The single path for recording a location point during an active drive —
 * used by both the foreground polling hook (`useDriveRecorder`) and the
 * background location task. Reads the active drive id from MMKV (not the
 * Zustand store) so it works correctly even in a cold JS context spun up
 * headlessly by the OS to deliver a background location update, where the
 * in-memory store would otherwise be empty.
 *
 * Always writes straight to SQLite (durable), and additionally updates the
 * live Zustand state when it's warm and matches the same drive, so the map
 * and stats update in real time while the app is open.
 */
export function recordDrivePoint(point: DrivePoint) {
  const driveId = appStorage.getString(StorageKeys.activeDriveId);
  if (!driveId) return;

  persistDrivePoint(driveId, point);

  const state = useDriveStore.getState();
  if (state.activeDrive?.id === driveId) {
    useDriveStore.setState({
      activeDrive: { ...state.activeDrive, points: [...state.activeDrive.points, point] },
    });
  }
}
