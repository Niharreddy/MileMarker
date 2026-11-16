import { create } from "zustand";
import { v4 as uuid } from "uuid";

import { StorageKeys } from "@/constants/storageKeys";
import { deletePinMedia } from "@/features/drives/photoStorage";
import { useDriveStore } from "@/features/drives/store/driveStore";
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
  persistTripPinDeleted,
  persistTripReview,
} from "../persistence";
import type { Trip, TripNote } from "../types";

export type TripState = {
  /** The trip (bundle) currently active. */
  activeTrip: Trip | null;
  /** A just-stopped trip awaiting its name/description to be confirmed before it's filed into pastTrips. */
  pendingTrip: Trip | null;
  pastTrips: Trip[];
  /** Name and optional date label are captured up front — a Trip always starts already named. */
  startTrip: (details: { name: string; dateLabel: string }) => void;
  stopTrip: () => void;
  saveTrip: (details: { name: string; review: string }) => void;
  discardPendingTrip: () => void;
  /** Deletes the trip but never its member drives — they're unbundled, not removed. */
  deleteTrip: (id: string) => void;
  /** Edits a past trip's description anytime from Trip Detail — distinct from `saveTrip`, which only applies to a just-stopped `pendingTrip`. */
  updateTripReview: (id: string, review: string) => void;
  /** Renames / re-describes a past trip anytime from Trip Detail. */
  updateTripDetails: (id: string, details: { name: string; review: string }) => void;
  addNoteToActiveTrip: (note: TripNote) => void;
  /** Adds a photo/video directly to a trip (active or past) — separate from a member drive's own pins. */
  addPinToTrip: (tripId: string, pin: Pin) => void;
  /** Removes one of the trip's own pins, deleting its durable media file too. Doesn't touch a member drive's pins. */
  removePinFromTrip: (tripId: string, pinId: string) => void;
};

/**
 * Backed by SQLite (see `../persistence`) — a live, in-memory view over that
 * database, not the source of truth itself. Mirrors `driveStore`'s
 * active/pending/past lifecycle, but a Trip has no route of its own: it's
 * just a time window that Drives (started while it's active) and Trip-level
 * comments attach to. See `driveStore.startDrive`, which reads
 * `activeTrip?.id` at drive-creation time to establish that link.
 */
export const useTripStore = create<TripState>()((set, get) => ({
  activeTrip: null,
  pendingTrip: null,
  pastTrips: [],

  startTrip: ({ name, dateLabel }) => {
    const id = uuid();
    const startedAt = Date.now();
    persistNewTrip(id, startedAt, name, dateLabel);
    appStorage.set(StorageKeys.activeTripId, id);
    set({ activeTrip: { id, name, review: "", dateLabel, startedAt, endedAt: null, notes: [], pins: [] } });
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
    if (pendingTrip) {
      persistTripDeleted(pendingTrip.id);
      for (const pin of pendingTrip.pins) void deletePinMedia(pin.uri, pin.thumbnailUri);
    }
    set({ pendingTrip: null });
  },

  deleteTrip: (id) => {
    const { pastTrips } = get();
    const trip = pastTrips.find((candidate) => candidate.id === id);
    if (!trip) return;
    persistTripDeleted(id);
    set({ pastTrips: pastTrips.filter((candidate) => candidate.id !== id) });
    for (const pin of trip.pins) void deletePinMedia(pin.uri, pin.thumbnailUri);
    // The DB already cleared trip_id on member drives (see deleteTripRow) — reload so the in-memory copy matches.
    useDriveStore.getState().reloadFromDatabase();
  },

  updateTripReview: (id, review) => {
    const { pastTrips } = get();
    if (!pastTrips.some((candidate) => candidate.id === id)) return;
    persistTripReview(id, review);
    set({
      pastTrips: pastTrips.map((candidate) => (candidate.id === id ? { ...candidate, review } : candidate)),
    });
  },

  updateTripDetails: (id, { name, review }) => {
    const { pastTrips } = get();
    if (!pastTrips.some((candidate) => candidate.id === id)) return;
    persistTripDetails(id, name, review);
    set({
      pastTrips: pastTrips.map((candidate) => (candidate.id === id ? { ...candidate, name, review } : candidate)),
    });
  },

  addNoteToActiveTrip: (note) => {
    const { activeTrip } = get();
    if (!activeTrip) return;
    persistTripNote(activeTrip.id, note);
    set({ activeTrip: { ...activeTrip, notes: [...activeTrip.notes, note] } });
  },

  addPinToTrip: (tripId, pin) => {
    const { activeTrip, pastTrips } = get();
    persistTripPin(tripId, pin);
    if (activeTrip?.id === tripId) {
      set({ activeTrip: { ...activeTrip, pins: [...activeTrip.pins, pin] } });
      return;
    }
    set({
      pastTrips: pastTrips.map((candidate) =>
        candidate.id === tripId ? { ...candidate, pins: [...candidate.pins, pin] } : candidate
      ),
    });
  },

  removePinFromTrip: (tripId, pinId) => {
    const { activeTrip, pastTrips } = get();
    const trip = activeTrip?.id === tripId ? activeTrip : pastTrips.find((candidate) => candidate.id === tripId);
    const pin = trip?.pins.find((candidate) => candidate.id === pinId);
    if (!trip || !pin) return;

    persistTripPinDeleted(pinId);
    if (activeTrip?.id === tripId) {
      set({ activeTrip: { ...activeTrip, pins: activeTrip.pins.filter((candidate) => candidate.id !== pinId) } });
    } else {
      set({
        pastTrips: pastTrips.map((candidate) =>
          candidate.id === tripId
            ? { ...candidate, pins: candidate.pins.filter((candidatePin) => candidatePin.id !== pinId) }
            : candidate
        ),
      });
    }
    void deletePinMedia(pin.uri, pin.thumbnailUri);
  },
}));

/**
 * Runs once at module load: initializes the SQLite schema (idempotent,
 * shared with `driveStore`'s own init call) and loads every trip, including
 * whichever one is still active (no `ended_at`) — e.g. if the app process
 * was killed while a Trip was in progress.
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
