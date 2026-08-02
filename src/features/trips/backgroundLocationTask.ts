import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { handleLocationSample } from "./autoDetect";

export const BACKGROUND_LOCATION_TASK = "milemarker-background-location";

/**
 * Must run in the JS module's global scope (not inside a component/effect):
 * when the OS delivers a location update while the app is backgrounded or
 * killed, it relaunches the JS engine and re-evaluates this module before
 * dispatching the event, so the task has to already be defined by then.
 * Imported once, unconditionally, from App.tsx.
 *
 * Delegates to `handleLocationSample`, which reads the active trip id from
 * MMKV (not this module's own state) so it works correctly even when the OS
 * spins up a fresh, empty JS context just to deliver this event. This same
 * subscription runs whether or not a trip is active — see
 * `useLocationMonitoring` — so each fix might be a recorded trip point or a
 * driving-detection sample, decided per-sample by `handleLocationSample`.
 */
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  BACKGROUND_LOCATION_TASK,
  ({ data, error }) => {
    if (error) {
      console.warn("[milemarker] background location task error", error.message);
      return;
    }

    for (const location of data.locations) {
      handleLocationSample(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: location.timestamp,
        },
        location.coords.speed ?? null
      );
    }
  }
);
