import { useEffect } from "react";
import { AppState } from "react-native";

import { useTripStore } from "../store/tripStore";

const POLL_INTERVAL_MS = 20_000;

/**
 * The background location task can set "trip auto-started" / "you've been
 * stopped a while" flags from a headless JS context this app's Zustand
 * store never observes directly. This bridges them in: once on mount,
 * whenever the app returns to the foreground, and on a light poll while
 * open (covers the background task firing while the app stays foregrounded
 * the whole time). Mount once near the app root.
 */
export function useAutoDetectNotices() {
  const sync = useTripStore((state) => state.syncAutoDetectNotices);

  useEffect(() => {
    sync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") sync();
    });
    const interval = setInterval(sync, POLL_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [sync]);
}
