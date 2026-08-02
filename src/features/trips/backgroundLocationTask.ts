import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { useTripStore } from "./store/tripStore";

export const BACKGROUND_LOCATION_TASK = "milemarker-background-location";

/**
 * Must run in the JS module's global scope (not inside a component/effect):
 * when the OS delivers a location update while the app is backgrounded or
 * killed, it relaunches the JS engine and re-evaluates this module before
 * dispatching the event, so the task has to already be defined by then.
 * Imported once, unconditionally, from App.tsx.
 *
 * Reads/writes the trip store directly via `getState()`/state actions
 * instead of a hook, since this runs outside any React tree.
 */
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(
  BACKGROUND_LOCATION_TASK,
  ({ data, error }) => {
    if (error) {
      console.warn("[milemarker] background location task error", error.message);
      return;
    }

    const { activeTrip, addPoint } = useTripStore.getState();
    if (!activeTrip) return;

    for (const location of data.locations) {
      addPoint({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
      });
    }
  }
);
