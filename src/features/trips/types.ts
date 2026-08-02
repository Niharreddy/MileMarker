import type { Coordinates, Pin } from "@/features/map";

export type TripPoint = Coordinates & { timestamp: number };

export type Trip = {
  id: string;
  name: string;
  review: string;
  startedAt: number;
  endedAt: number | null;
  points: TripPoint[];
  pins: Pin[];
};
