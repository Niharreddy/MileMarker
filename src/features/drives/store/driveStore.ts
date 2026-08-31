import { create } from "zustand";
import { v4 as uuid } from "uuid";

import { StorageKeys } from "@/constants/storageKeys";
import type { Pin } from "@/features/map";
import { useTripStore } from "@/features/trips/store/tripStore";
import { appStorage } from "@/services/storage";

import {
  initDriveDatabase,
  loadAllDrives,
  persistDriveDeleted,
  persistDriveDetails,
  persistDriveEnded,
  persistDriveNote,
  persistDrivePin,
  persistDriveTripId,
  persistNewDrive,
} from "../persistence";
import { deletePinMedia } from "../photoStorage";
import type { Drive, DriveNote } from "../types";

export type DriveState = {
  /** The drive currently being recorded. */
  activeDrive: Drive | null;
  /** A just-stopped drive awaiting a name/review before it's filed into pastDrives. */
  pendingDrive: Drive | null;
  pastDrives: Drive[];
  /** Whether the always-on background location subscription is currently running (vs. foreground-only polling). */
  isBackgroundTrackingActive: boolean;
  setBackgroundTrackingActive: (active: boolean) => void;
  startDrive: () => void;
  stopDrive: () => void;
  saveDrive: (details: { name: string; review: string }) => void;
  discardPendingDrive: () => void;
  deleteDrive: (id: string) => void;
  addPinToActiveDrive: (pin: Pin) => void;
  /** Bulk-adds pins to the just-stopped pending drive — used by geotag auto-matching after Stop Drive. */
  addPinsToPendingDrive: (pins: Pin[]) => void;
  addNoteToActiveDrive: (note: DriveNote) => void;
  /** Adds a not-yet-bundled drive to an existing Trip. No-ops if the drive is already part of one. */
  addDriveToTrip: (driveId: string, tripId: string) => void;
  /** Unbundles a drive from whatever Trip it's part of. No-ops if it isn't part of one. */
  removeDriveFromTrip: (driveId: string) => void;
  /**
   * Re-reads every drive from SQLite, including whichever drive (if any) is
   * still unfinished — used after importing data, and to pull in a drive
   * that auto-detect started from a headless JS context this store's
   * in-memory state never observed directly.
   */
  reloadFromDatabase: () => void;
  /** Whether to show the "drive detected" popup — set by auto-detect via MMKV, synced in by `useAutoDetectNotices`. */
  autoStartNoticeVisible: boolean;
  /** Whether to show the "you've been stopped a while" popup. */
  stopPromptVisible: boolean;
  syncAutoDetectNotices: () => void;
  dismissAutoStartNotice: () => void;
  acknowledgeStopPrompt: () => void;
  keepRecordingAfterStop: () => void;
};

/**
 * Backed by SQLite (see `../persistence`) so drives/points/pins survive the
 * app being closed or killed — this store is a live, in-memory view over
 * that database, not the source of truth itself. Every mutating action
 * writes through to SQLite synchronously before updating state.
 *
 * Recording flows through three states: `activeDrive` (being recorded) ->
 * `pendingDrive` (stopped, waiting on the save form) -> filed into
 * `pastDrives`. Points recorded via the background location task go
 * straight to SQLite through `recordDrivePoint` (see `../recordDrivePoint`),
 * not through an action on this store.
 */
export const useDriveStore = create<DriveState>()((set, get) => ({
  activeDrive: null,
  pendingDrive: null,
  pastDrives: [],
  isBackgroundTrackingActive: false,

  setBackgroundTrackingActive: (isBackgroundTrackingActive) => set({ isBackgroundTrackingActive }),

  startDrive: () => {
    const id = uuid();
    const startedAt = Date.now();
    // A drive joins whatever Trip is active the moment it starts, regardless of when it ends.
    const activeTripId = useTripStore.getState().activeTrip?.id ?? null;
    persistNewDrive(id, startedAt, activeTripId);
    appStorage.set(StorageKeys.activeDriveId, id);
    set({
      activeDrive: {
        id,
        name: "",
        review: "",
        startedAt,
        endedAt: null,
        tripId: activeTripId,
        points: [],
        pins: [],
        notes: [],
      },
    });
  },

  stopDrive: () => {
    const { activeDrive } = get();
    if (!activeDrive) return;
    const endedAt = Date.now();
    persistDriveEnded(activeDrive.id, endedAt);
    appStorage.delete(StorageKeys.activeDriveId);
    set({
      activeDrive: null,
      pendingDrive: { ...activeDrive, endedAt },
    });
  },

  saveDrive: ({ name, review }) => {
    const { pendingDrive, pastDrives } = get();
    if (!pendingDrive) return;
    persistDriveDetails(pendingDrive.id, name, review);
    set({
      pendingDrive: null,
      pastDrives: [{ ...pendingDrive, name, review }, ...pastDrives],
    });
  },

  discardPendingDrive: () => {
    const { pendingDrive } = get();
    if (pendingDrive) persistDriveDeleted(pendingDrive.id);
    set({ pendingDrive: null });
  },

  deleteDrive: (id) => {
    const { pastDrives } = get();
    const drive = pastDrives.find((candidate) => candidate.id === id);
    if (!drive) return;
    persistDriveDeleted(id);
    set({ pastDrives: pastDrives.filter((candidate) => candidate.id !== id) });
    for (const pin of drive.pins) void deletePinMedia(pin.uri, pin.thumbnailUri);
  },

  addPinToActiveDrive: (pin) => {
    const { activeDrive } = get();
    if (!activeDrive) return;
    persistDrivePin(activeDrive.id, pin);
    set({ activeDrive: { ...activeDrive, pins: [...activeDrive.pins, pin] } });
  },

  addPinsToPendingDrive: (pins) => {
    const { pendingDrive } = get();
    if (!pendingDrive || pins.length === 0) return;
    for (const pin of pins) persistDrivePin(pendingDrive.id, pin);
    set({ pendingDrive: { ...pendingDrive, pins: [...pendingDrive.pins, ...pins] } });
  },

  addNoteToActiveDrive: (note) => {
    const { activeDrive } = get();
    if (!activeDrive) return;
    persistDriveNote(activeDrive.id, note);
    set({ activeDrive: { ...activeDrive, notes: [...activeDrive.notes, note] } });
  },

  addDriveToTrip: (driveId, tripId) => {
    const { pastDrives } = get();
    const drive = pastDrives.find((candidate) => candidate.id === driveId);
    if (!drive || drive.tripId) return;
    persistDriveTripId(driveId, tripId);
    set({
      pastDrives: pastDrives.map((candidate) =>
        candidate.id === driveId ? { ...candidate, tripId } : candidate
      ),
    });
  },

  removeDriveFromTrip: (driveId) => {
    const { pastDrives } = get();
    const drive = pastDrives.find((candidate) => candidate.id === driveId);
    if (!drive || !drive.tripId) return;
    persistDriveTripId(driveId, null);
    set({
      pastDrives: pastDrives.map((candidate) =>
        candidate.id === driveId ? { ...candidate, tripId: null } : candidate
      ),
    });
  },

  reloadFromDatabase: () => {
    const drives = loadAllDrives();
    const activeRow = drives.find((drive) => drive.endedAt === null) ?? null;
    if (activeRow) appStorage.set(StorageKeys.activeDriveId, activeRow.id);
    set({
      activeDrive: activeRow,
      pastDrives: drives.filter((drive) => drive.endedAt !== null),
    });
  },

  autoStartNoticeVisible: false,
  stopPromptVisible: false,

  syncAutoDetectNotices: () => {
    const autoStartPending = appStorage.getBoolean(StorageKeys.autoStartNoticePending) ?? false;
    const stopPending = appStorage.getBoolean(StorageKeys.stopPromptPending) ?? false;

    // Auto-detect can start/record a drive from a headless JS context this
    // store never saw directly — catch up here whenever what MMKV says is
    // active disagrees with what's in memory (e.g. after the app is
    // reopened via the "Drive detected" notification).
    const storedActiveDriveId = appStorage.getString(StorageKeys.activeDriveId) ?? null;
    if (storedActiveDriveId && storedActiveDriveId !== get().activeDrive?.id) {
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
 * schema, loads completed drives, and resumes any drive that was still
 * "active" (no `ended_at`) — whether because the app process was killed
 * mid-recording, or because auto-detect started it from a headless JS
 * context between launches. Either way the drive is still genuinely being
 * tracked (background recording writes points straight to SQLite
 * regardless of whether this store is warm), so it comes back as
 * `activeDrive` with a working Stop Drive button, not as a forced
 * name/save prompt.
 */
function hydrateDriveStore() {
  initDriveDatabase();
  const drives = loadAllDrives();
  const activeRow = drives.find((drive) => drive.endedAt === null) ?? null;
  const completedDrives = drives.filter((drive) => drive.endedAt !== null);

  if (activeRow) {
    appStorage.set(StorageKeys.activeDriveId, activeRow.id);
  } else {
    appStorage.delete(StorageKeys.activeDriveId);
  }

  useDriveStore.setState({
    activeDrive: activeRow,
    pastDrives: completedDrives,
    pendingDrive: null,
  });
}

hydrateDriveStore();
