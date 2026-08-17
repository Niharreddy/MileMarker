import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const TRIP_ALERTS_CHANNEL_ID = "milemarker-trip-alerts";

/**
 * Governs whether a notification actually surfaces while the app is
 * foregrounded — without this, Expo suppresses the alert banner/sound by
 * default whenever the app is already open. Runs at import time (not
 * inside a component) so it's in effect for both normal launches and the
 * headless JS context the OS spins up to deliver a background location
 * update — `autoDetect.ts` imports this module either way.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

if (Platform.OS === "android") {
  void Notifications.setNotificationChannelAsync(TRIP_ALERTS_CHANNEL_ID, {
    name: "Trip alerts",
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/** Fired the moment auto-detect starts tracking a drive on its own. */
export async function notifyTripAutoStarted() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Trip detected",
      body: "Looks like you're driving — Mile Marker started tracking this trip automatically.",
    },
    trigger: null,
  });
}

/** Fired once an active trip has sat stationary long enough to ask whether to keep tracking it. */
export async function notifyStopPrompt() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Still on this trip?",
      body: "You've been stopped for about 10 minutes. Open Mile Marker to keep going or stop tracking.",
    },
    trigger: null,
  });
}
