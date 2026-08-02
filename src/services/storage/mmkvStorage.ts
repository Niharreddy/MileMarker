import { MMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

/**
 * Single MMKV instance backing all local key/value storage (user
 * preferences today; future phases can add `new MMKV({ id: "..." })`
 * instances for larger/sensitive data without touching this one).
 */
export const appStorage = new MMKV({ id: "milemarker.app" });

/**
 * Adapts MMKV's sync get/set/delete API to zustand's `persist` middleware
 * `StateStorage` interface, so any store can opt into persistence with
 * `persist(fn, { name: StorageKeys.x, storage: createJSONStorage(() => zustandMmkvStorage) })`.
 */
export const zustandMmkvStorage: StateStorage = {
  getItem: (name) => appStorage.getString(name) ?? null,
  setItem: (name, value) => appStorage.set(name, value),
  removeItem: (name) => appStorage.delete(name),
};
