/**
 * Central registry of MMKV / persisted-storage keys. Every persisted store
 * or one-off value should have its key declared here instead of inlined as a
 * string literal, so key collisions and orphaned keys are easy to spot.
 */
export const StorageKeys = {
  settingsStore: "milemarker.settings",
  /**
   * Id of the trip currently being recorded, if any. Kept in MMKV (not just
   * the in-memory trip store) so the background location task can durably
   * write points even when the OS relaunches the JS engine in a fresh
   * context — reading this doesn't depend on any store being "warm".
   */
  activeTripId: "milemarker.activeTripId",

  /** Most recent raw location sample seen by auto-detect, used to estimate speed between fixes. */
  autoDetectLastSample: "milemarker.autoDetect.lastSample",
  /** Consecutive samples in a row at/above driving speed, while no trip is active. */
  autoDetectConsecutiveDriving: "milemarker.autoDetect.consecutiveDriving",
  /** Timestamp the vehicle was first seen stationary during an active trip, or unset if moving. */
  autoDetectStoppedSince: "milemarker.autoDetect.stoppedSince",
  /** Set when auto-detect just started a trip; cleared once the in-app notice has been shown. */
  autoStartNoticePending: "milemarker.autoDetect.autoStartNoticePending",
  /** Set once a long stop is confirmed; cleared once the in-app prompt has been shown/resolved. */
  stopPromptPending: "milemarker.autoDetect.stopPromptPending",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
