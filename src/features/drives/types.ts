import type { Coordinates, Note, Pin } from "@/features/map";

export type DrivePoint = Coordinates & { timestamp: number };

export type DriveNote = Note;

export type Drive = {
  id: string;
  name: string;
  review: string;
  startedAt: number;
  endedAt: number | null;
  /** The Trip (bundle) this drive belongs to, if any — a drive belongs to at most one trip. */
  tripId: string | null;
  points: DrivePoint[];
  pins: Pin[];
  notes: DriveNote[];
};
