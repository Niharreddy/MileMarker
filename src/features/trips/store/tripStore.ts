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
  persistTripNote,
  persistTripPin,
} from "../persistence";
import { deletePinMedia } from "../photoStorage";
import type { Trip, TripNote } from "../types";

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
  deleteTrip: (id: string) => void;
  addPinToActiveTrip: (pin: Pin) => void;
  /** Bulk-adds pins to the just-stopped pending trip — used by geotag auto-matching after Stop Trip. */
  addPinsToPendingTrip: (pins: Pin[]) => void;
  addNoteToActiveTrip: (note: TripNote) => void;
  /**
   * Re-reads every trip from SQLite, including whichever trip (if any) is
   * still unfinished — used after importing data, and to pull in a trip
   * that auto-detect started from a headless JS context this store's
   * in-memory state never observed directly.
   */
  reloadFromDatabase: () => void;
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
      activeTrip: { id, name: "", review: "", startedAt, endedAt: null, points: [], pins: [], notes: [] },
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

  deleteTrip: (id) => {
    const { pastTrips } = get();
    const trip = pastTrips.find((candidate) => candidate.id === id);
    if (!trip) return;
    persistTripDeleted(id);
    set({ pastTrips: pastTrips.filter((candidate) => candidate.id !== id) });
    for (const pin of trip.pins) void deletePinMedia(pin.uri, pin.thumbnailUri);
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

  addNoteToActiveTrip: (note) => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    persistTripNote(activeTrip.id, note);
    set({ activeTrip: { ...activeTrip, notes: [...activeTrip.notes, note] } });
  },

  reloadFromDatabase: () => {
    const trips = loadAllTrips();
    const activeRow = trips.find((trip) => trip.endedAt === null) ?? null;
    if (activeRow) appStorage.set(StorageKeys.activeTripId, activeRow.id);
    set({
      activeTrip: activeRow,
      pastTrips: trips.filter((trip) => trip.endedAt !== null),
    });
  },

  autoStartNoticeVisible: false,
  stopPromptVisible: false,

  syncAutoDetectNotices: () => {
    const autoStartPending = appStorage.getBoolean(StorageKeys.autoStartNoticePending) ?? false;
    const stopPending = appStorage.getBoolean(StorageKeys.stopPromptPending) ?? false;

    // Auto-detect can start/record a trip from a headless JS context this
    // store never saw directly — catch up here whenever what MMKV says is
    // active disagrees with what's in memory (e.g. after the app is
    // reopened via the "Trip detected" notification).
    const storedActiveTripId = appStorage.getString(StorageKeys.activeTripId) ?? null;
    if (storedActiveTripId && storedActiveTripId !== get().activeTrip?.id) {
      get().reloadFromDatabase();
    }

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
 * schema, loads completed trips, and resumes any trip that was still
 * "active" (no `ended_at`) — whether because the app process was killed
 * mid-recording, or because auto-detect started it from a headless JS
 * context between launches. Either way the trip is still genuinely being
 * tracked (background recording writes points straight to SQLite
 * regardless of whether this store is warm), so it comes back as
 * `activeTrip` with a working Stop Trip button, not as a forced
 * name/save prompt.
 */
function hydrateTripStore() {
  initTripDatabase();
  const trips = loadAllTrips();
  const activeRow = trips.find((trip) => trip.endedAt === null) ?? null;
  const completedTrips = trips.filter((trip) => trip.endedAt !== null);

  if (activeRow) {
    appStorage.set(StorageKeys.activeTripId, activeRow.id);
  } else {
    appStorage.delete(StorageKeys.activeTripId);
  }

  useTripStore.setState({
    activeTrip: activeRow,
    pastTrips: completedTrips,
    pendingTrip: null,
  });
}

hydrateTripStore();
