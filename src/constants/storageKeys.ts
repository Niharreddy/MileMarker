/**
 * Central registry of MMKV / persisted-storage keys. Every persisted store
 * or one-off value should have its key declared here instead of inlined as a
 * string literal, so key collisions and orphaned keys are easy to spot.
 */
export const StorageKeys = {
  settingsStore: "milemarker.settings",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
