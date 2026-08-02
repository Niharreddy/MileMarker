import { useCallback, useEffect, useState } from "react";
import { PermissionStatus, type PermissionResponse } from "expo-modules-core";

/**
 * Generic wrapper around Expo's get/request permission function pairs
 * (expo-location, expo-media-library, ...), so each concrete permission
 * hook is a one-line call instead of re-implementing this state machine.
 */
export function usePermission(
  getPermission: () => Promise<PermissionResponse>,
  requestPermission: () => Promise<PermissionResponse>
) {
  const [status, setStatus] = useState<PermissionStatus>(PermissionStatus.UNDETERMINED);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getPermission()
      .then((response) => {
        if (!cancelled) setStatus(response.status);
      })
      .finally(() => {
        if (!cancelled) setIsChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [getPermission]);

  const request = useCallback(async () => {
    const response = await requestPermission();
    setStatus(response.status);
    return response.status === PermissionStatus.GRANTED;
  }, [requestPermission]);

  return {
    status,
    isChecking,
    isGranted: status === PermissionStatus.GRANTED,
    isDenied: status === PermissionStatus.DENIED,
    request,
  };
}
