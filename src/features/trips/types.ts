import type { Coordinates, Note, Pin } from "@/features/map";

export type TripPoint = Coordinates & { timestamp: number };

export type TripNote = Note;

export type Trip = {
  id: string;
  name: string;
  review: string;
  startedAt: number;
  endedAt: number | null;
  points: TripPoint[];
  pins: Pin[];
  notes: TripNote[];
};
