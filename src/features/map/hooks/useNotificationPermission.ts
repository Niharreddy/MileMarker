import * as Notifications from "expo-notifications";

import { usePermission } from "./usePermission";

/** OS notification permission, used to alert about auto-detected trips and long stops. */
export function useNotificationPermission() {
  return usePermission(Notifications.getPermissionsAsync, Notifications.requestPermissionsAsync);
}
