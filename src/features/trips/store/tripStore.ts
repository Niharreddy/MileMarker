import { create } from "zustand";
import { v4 as uuid } from "uuid";

import { StorageKeys } from "@/constants/storageKeys";
import type { Pin } from "@/features/map";
import { appStorage } from "@/services/storage";

import {
  initTripDatabase,
  loadAllTrips,
  persistNewTrip,
  persistTripDeleted,
  persistTripDetails,
  persistTripEnded,
  persistTripPin,
} from "../persistence";
import type { Trip } from "../types";

export type TripState = {
  /** The trip currently being recorded. */
  activeTrip: Trip | null;
  /** A just-stopped trip awaiting a name/review before it's filed into pastTrips. */
  pendingTrip: Trip | null;
  pastTrips: Trip[];
  /** Whether the always-on background location subscription is currently running (vs. foreground-only polling). */
  isBackgroundTrackingActive: boolean;
  setBackgroundTrackingActive: (active: boolean) => void;
  startTrip: () => void;
  stopTrip: () => void;
  saveTrip: (details: { name: string; review: string }) => void;
  discardPendingTrip: () => void;
  addPinToActiveTrip: (pin: Pin) => void;
  /** Bulk-adds pins to the just-stopped pending trip — used by geotag auto-matching after Stop Trip. */
  addPinsToPendingTrip: (pins: Pin[]) => void;
  /** Whether to show the "trip detected" popup — set by auto-detect via MMKV, synced in by `useAutoDetectNotices`. */
  autoStartNoticeVisible: boolean;
  /** Whether to show the "you've been stopped a while" popup. */
  stopPromptVisible: boolean;
  syncAutoDetectNotices: () => void;
  dismissAutoStartNotice: () => void;
  acknowledgeStopPrompt: () => void;
  keepRecordingAfterStop: () => void;
};

/**
 * Backed by SQLite (see `../persistence`) so trips/points/pins survive the
 * app being closed or killed — this store is a live, in-memory view over
 * that database, not the source of truth itself. Every mutating action
 * writes through to SQLite synchronously before updating state.
 *
 * Recording flows through three states: `activeTrip` (being recorded) ->
 * `pendingTrip` (stopped, waiting on the save form) -> filed into
 * `pastTrips`. Points recorded via the background location task go
 * straight to SQLite through `recordTripPoint` (see `../recordTripPoint`),
 * not through an action on this store.
 */
export const useTripStore = create<TripState>()((set, get) => ({
  activeTrip: null,
  pendingTrip: null,
  pastTrips: [],
  isBackgroundTrackingActive: false,

  setBackgroundTrackingActive: (isBackgroundTrackingActive) => set({ isBackgroundTrackingActive }),

  startTrip: () => {
    const id = uuid();
    const startedAt = Date.now();
    persistNewTrip(id, startedAt);
    appStorage.set(StorageKeys.activeTripId, id);
    set({
      activeTrip: { id, name: "", review: "", startedAt, endedAt: null, points: [], pins: [] },
    });
  },

  stopTrip: () => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    const endedAt = Date.now();
    persistTripEnded(activeTrip.id, endedAt);
    appStorage.delete(StorageKeys.activeTripId);
    set({
      activeTrip: null,
      pendingTrip: { ...activeTrip, endedAt },
    });
  },

  saveTrip: ({ name, review }) => {
    const { pendingTrip, pastTrips } = get();
    if (!pendingTrip) return;
    persistTripDetails(pendingTrip.id, name, review);
    set({
      pendingTrip: null,
      pastTrips: [{ ...pendingTrip, name, review }, ...pastTrips],
    });
  },

  discardPendingTrip: () => {
    const { pendingTrip } = get();
    if (pendingTrip) persistTripDeleted(pendingTrip.id);
    set({ pendingTrip: null });
  },

  addPinToActiveTrip: (pin) => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    persistTripPin(activeTrip.id, pin);
    set({ activeTrip: { ...activeTrip, pins: [...activeTrip.pins, pin] } });
  },

  addPinsToPendingTrip: (pins) => {
    const { pendingTrip } = get();
    if (!pendingTrip || pins.length === 0) return;
    for (const pin of pins) persistTripPin(pendingTrip.id, pin);
    set({ pendingTrip: { ...pendingTrip, pins: [...pendingTrip.pins, ...pins] } });
  },

  autoStartNoticeVisible: false,
  stopPromptVisible: false,

  syncAutoDetectNotices: () => {
    const autoStartPending = appStorage.getBoolean(StorageKeys.autoStartNoticePending) ?? false;
    const stopPending = appStorage.getBoolean(StorageKeys.stopPromptPending) ?? false;
    if (!autoStartPending && !stopPending) return;
    set((state) => ({
      autoStartNoticeVisible: state.autoStartNoticeVisible || autoStartPending,
      stopPromptVisible: state.stopPromptVisible || stopPending,
    }));
  },

  dismissAutoStartNotice: () => {
    appStorage.set(StorageKeys.autoStartNoticePending, false);
    set({ autoStartNoticeVisible: false });
  },

  acknowledgeStopPrompt: () => {
    appStorage.set(StorageKeys.stopPromptPending, false);
    set({ stopPromptVisible: false });
  },

  keepRecordingAfterStop: () => {
    appStorage.delete(StorageKeys.autoDetectStoppedSince);
    appStorage.set(StorageKeys.stopPromptPending, false);
    set({ stopPromptVisible: false });
  },
}));

/**
 * Runs once at module load (i.e. app startup): initializes the SQLite
 * schema, loads completed trips, and recovers any trip that was still
 * "active" (no `ended_at`) when the process last died — background
 * recording writes points straight to SQLite regardless of whether this
 * store is warm, so that data isn't lost, it just needs a name/review like
 * any other stopped trip.
 */
function hydrateTripStore() {
  initTripDatabase();
  const trips = loadAllTrips();
  const orphanedTrip = trips.find((trip) => trip.endedAt === null) ?? null;
  const completedTrips = trips.filter((trip) => trip.endedAt !== null);

  if (orphanedTrip) {
    appStorage.delete(StorageKeys.activeTripId);
  }

  useTripStore.setState({
    pastTrips: completedTrips,
    pendingTrip: orphanedTrip ? { ...orphanedTrip, endedAt: orphanedTrip.endedAt ?? Date.now() } : null,
  });
}

hydrateTripStore();
