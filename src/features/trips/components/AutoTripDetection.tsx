import React from "react";

import { useAutoDetectNotices } from "../hooks/useAutoDetectNotices";
import { useLocationMonitoring } from "../hooks/useLocationMonitoring";
import { AutoStartTripDialog } from "./AutoStartTripDialog";
import { StopPromptDialog } from "./StopPromptDialog";

/**
 * App-root-level: owns the always-on location subscription and the
 * MMKV -> Zustand notice sync, and renders the popups they can trigger.
 * Mounted once in `RootNavigator` so it keeps running regardless of which
 * tab/screen is active.
 */
export function AutoTripDetection() {
  useLocationMonitoring();
  useAutoDetectNotices();

  return (
    <>
      <AutoStartTripDialog />
      <StopPromptDialog />
    </>
  );
}
