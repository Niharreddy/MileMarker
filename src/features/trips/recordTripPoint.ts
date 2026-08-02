import { StorageKeys } from "@/constants/storageKeys";
import { appStorage } from "@/services/storage";

import { persistTripPoint } from "./persistence";
import { useTripStore } from "./store/tripStore";
import type { TripPoint } from "./types";

/**
 * The single path for recording a location point during an active trip —
 * used by both the foreground polling hook (`useTripRecorder`) and the
 * background location task. Reads the active trip id from MMKV (not the
 * Zustand store) so it works correctly even in a cold JS context spun up
 * headlessly by the OS to deliver a background location update, where the
 * in-memory store would otherwise be empty.
 *
 * Always writes straight to SQLite (durable), and additionally updates the
 * live Zustand state when it's warm and matches the same trip, so the map
 * and stats update in real time while the app is open.
 */
export function recordTripPoint(point: TripPoint) {
  const tripId = appStorage.getString(StorageKeys.activeTripId);
  if (!tripId) return;

  persistTripPoint(tripId, point);

  const state = useTripStore.getState();
  if (state.activeTrip?.id === tripId) {
    useTripStore.setState({
      activeTrip: { ...state.activeTrip, points: [...state.activeTrip.points, point] },
    });
  }
}
