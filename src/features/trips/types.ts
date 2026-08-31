import type { Note } from "@/features/map";

export type TripNote = Note;

/**
 * A bundle of Drives — started/stopped independently of any single drive.
 * Membership is derived, not stored here: a trip's drives are whichever
 * `Drive`s in `driveStore.pastDrives` (or the active one) have a matching
 * `tripId`.
 */
export type Trip = {
  id: string;
  name: string;
  /** Free-text description, editable anytime from Trip Detail — not the same as `notes` (geotagged comments). */
  review: string;
  /** Optional descriptive date range set at Start Trip (e.g. "Aug 28 - Sept 2") — display text only, not tied to `startedAt`/`endedAt`. */
  dateLabel: string;
  startedAt: number;
  endedAt: number | null;
  notes: TripNote[];
};
