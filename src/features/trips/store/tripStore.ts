import { create } from "zustand";
import { v4 as uuid } from "uuid";

import type { Pin } from "@/features/map";

import type { Trip, TripPoint } from "../types";

export type TripState = {
  /** The trip currently being recorded. */
  activeTrip: Trip | null;
  /** A just-stopped trip awaiting a name/review before it's filed into pastTrips. */
  pendingTrip: Trip | null;
  pastTrips: Trip[];
  /** Whether the current recording is backed by the background location task (vs. foreground-only polling). */
  isBackgroundTrackingActive: boolean;
  setBackgroundTrackingActive: (active: boolean) => void;
  startTrip: () => void;
  stopTrip: () => void;
  saveTrip: (details: { name: string; review: string }) => void;
  discardPendingTrip: () => void;
  addPoint: (point: TripPoint) => void;
  addPinToActiveTrip: (pin: Pin) => void;
};

/**
 * In-memory only — resets on app restart, same limitation the rest of the
 * app has until a real database lands. Recording flows through three
 * states: `activeTrip` (being recorded) -> `pendingTrip` (stopped, waiting
 * on the save form) -> filed into `pastTrips`.
 */
export const useTripStore = create<TripState>()((set, get) => ({
  activeTrip: null,
  pendingTrip: null,
  pastTrips: [],
  isBackgroundTrackingActive: false,

  setBackgroundTrackingActive: (isBackgroundTrackingActive) => set({ isBackgroundTrackingActive }),

  startTrip: () =>
    set({
      activeTrip: {
        id: uuid(),
        name: "",
        review: "",
        startedAt: Date.now(),
        endedAt: null,
        points: [],
        pins: [],
      },
    }),

  stopTrip: () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    set({
      activeTrip: null,
      pendingTrip: { ...activeTrip, endedAt: Date.now() },
      isBackgroundTrackingActive: false,
    });
  },

  saveTrip: ({ name, review }) => {
    const { pendingTrip, pastTrips } = get();
    if (!pendingTrip) return;
    set({
      pendingTrip: null,
      pastTrips: [{ ...pendingTrip, name, review }, ...pastTrips],
    });
  },

  discardPendingTrip: () => set({ pendingTrip: null }),

  addPoint: (point) =>
    set((state) =>
      state.activeTrip
        ? { activeTrip: { ...state.activeTrip, points: [...state.activeTrip.points, point] } }
        : state
    ),

  addPinToActiveTrip: (pin) =>
    set((state) =>
      state.activeTrip
        ? { activeTrip: { ...state.activeTrip, pins: [...state.activeTrip.pins, pin] } }
        : state
    ),
}));
