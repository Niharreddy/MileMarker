import { useEffect, useRef } from "react";

import type { Coordinates } from "@/features/map";

import { handleLocationSample } from "../autoDetect";

/**
 * Feeds each new foreground location update into `handleLocationSample`,
 * which records it if a trip is active or runs driving-detection if not.
 * No-ops when there's no location yet, the location hasn't changed since
 * the last sample, or `enabled` is false.
 *
 * `enabled` should be set to false whenever the always-on background
 * location subscription is already covering this (see
 * `useLocationMonitoring`) — otherwise both this foreground poll and the
 * background task would double-feed the same fixes.
 */
export function useTripRecorder(
  coordinates: Coordinates | null,
  speedMps: number | null,
  enabled: boolean = true
) {
  const lastCoordinatesRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!enabled || !coordinates) return;

    const last = lastCoordinatesRef.current;
    if (last && last.latitude === coordinates.latitude && last.longitude === coordinates.longitude) {
      return;
    }

    lastCoordinatesRef.current = coordinates;
    handleLocationSample({ ...coordinates, timestamp: Date.now() }, speedMps);
  }, [enabled, coordinates, speedMps]);
}
