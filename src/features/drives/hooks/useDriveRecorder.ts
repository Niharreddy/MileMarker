import { useEffect, useRef } from "react";

import type { Coordinates } from "@/features/map";

import { handleLocationSample } from "../autoDetect";

/**
 * `getCurrentPositionAsync` can hand back a cached fix instead of a fresh
 * one — most noticeably right when the app resumes/reopens and a new GPS
 * lock hasn't happened yet. A fix whose own capture time is older than
 * this is treated as untrustworthy and dropped rather than recorded as
 * "right now", so a stale cached location can't put a spurious jump in the
 * route line. Generous relative to the ~60s poll interval so normal
 * scheduling jitter never trips it.
 */
const STALE_FIX_THRESHOLD_MS = 90_000;

/**
 * Feeds each new foreground location update into `handleLocationSample`,
 * which records it if a drive is active or runs driving-detection if not.
 * No-ops when there's no location yet, the location hasn't changed since
 * the last sample, the fix is too stale to trust, or `enabled` is false.
 *
 * `enabled` should be set to false whenever the always-on background
 * location subscription is already covering this (see
 * `useLocationMonitoring`) — otherwise every fix gets recorded/evaluated
 * twice.
 */
export function useDriveRecorder(
  coordinates: Coordinates | null,
  speedMps: number | null,
  timestamp: number | null,
  enabled: boolean = true
) {
  const lastCoordinatesRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!enabled || !coordinates || !timestamp) return;

    const last = lastCoordinatesRef.current;
    if (last && last.latitude === coordinates.latitude && last.longitude === coordinates.longitude) {
      return;
    }

    if (Date.now() - timestamp > STALE_FIX_THRESHOLD_MS) return;

    lastCoordinatesRef.current = coordinates;
    handleLocationSample({ ...coordinates, timestamp }, speedMps);
  }, [enabled, coordinates, speedMps, timestamp]);
}
