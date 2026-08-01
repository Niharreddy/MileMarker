import { create } from "zustand";

export type AppState = {
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;
};

/**
 * Global, non-persisted app state — things that reset every launch (splash
 * gating, transient UI flags). Feature-specific state belongs in
 * `src/features/<feature>/store`, not here; this store is only for
 * cross-cutting app shell state.
 */
export const useAppStore = create<AppState>()((set) => ({
  isAppReady: false,
  setAppReady: (isAppReady) => set({ isAppReady }),
}));
