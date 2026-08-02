import { useEffect, useRef } from "react";

import type { Coordinates } from "@/features/map";

import { useTripStore } from "../store/tripStore";

/**
 * Appends each new location update to the active trip's point list while a
 * trip is being recorded. No-ops when there's no active trip, no location
 * yet, the location hasn't changed since the last recorded point, or
 * `enabled` is false.
 *
 * `enabled` should be set to false whenever the background location task is
 * driving the same trip (see `useBackgroundTripTracking`) — otherwise both
 * this foreground poll and the background task would double-record points.
 */
export function useTripRecorder(coordinates: Coordinates | null, enabled: boolean = true) {
  const isRecording = useTripStore((state) => state.activeTrip !== null);
  const addPoint = useTripStore((state) => state.addPoint);
  const lastCoordinatesRef = useRef<Coordinates | null>(null);

  useEffect(() => {
    if (!enabled || !isRecording || !coordinates) return;

    const last = lastCoordinatesRef.current;
    if (last && last.latitude === coordinates.latitude && last.longitude === coordinates.longitude) {
      return;
    }

    lastCoordinatesRef.current = coordinates;
    addPoint({ ...coordinates, timestamp: Date.now() });
  }, [enabled, isRecording, coordinates, addPoint]);
}
