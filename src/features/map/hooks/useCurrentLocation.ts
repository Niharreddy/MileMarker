import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import { LOCATION_POLL_INTERVAL_MS } from "../constants";
import type { Coordinates } from "../types";

export type CurrentLocationState = {
  coordinates: Coordinates | null;
  /** Ground speed in meters/second reported by the GPS fix, or null if unavailable. */
  speedMps: number | null;
  /**
   * When this fix was actually captured (ms since epoch), per the OS —
   * not when the JS callback ran. `getCurrentPositionAsync` can return a
   * cached fix (e.g. right after the app resumes/reopens and a fresh GPS
   * lock hasn't happened yet), so this can be meaningfully older than
   * `Date.now()`; consumers that record trip points should treat a stale
   * fix as untrustworthy rather than assuming it just happened.
   */
  timestamp: number | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * Polls the device's position on an interval using a single
 * `getCurrentPositionAsync` call, instead of `watchPositionAsync`'s
 * continuous GPS stream — keeps battery usage low at the cost of the map
 * marker only updating once every `intervalMs` (default: once a minute).
 */
export function useCurrentLocation(
  enabled: boolean,
  intervalMs: number = LOCATION_POLL_INTERVAL_MS
): CurrentLocationState {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [speedMps, setSpeedMps] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (isMountedRef.current) {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setSpeedMps(position.coords.speed ?? null);
        setTimestamp(position.timestamp);
        setError(null);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Unable to get current location");
      }
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    refresh();
    const interval = setInterval(refresh, intervalMs);
    return () => clearInterval(interval);
  }, [enabled, intervalMs, refresh]);

  return { coordinates, speedMps, timestamp, isLoading, error, refresh };
}
