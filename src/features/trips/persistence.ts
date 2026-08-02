import type { Pin } from "@/features/map";
import {
  deleteTripRow,
  getAllTripRows,
  getTripPinRows,
  getTripPointRows,
  initDatabase,
  insertTripPinRow,
  insertTripPointRow,
  insertTripRow,
  updateTripDetailsRow,
  updateTripEndedAtRow,
} from "@/services/db";

import type { Trip, TripPoint } from "./types";

/** Maps between the generic DB row shapes in `services/db` and this feature's `Trip` domain type. */

export function initTripDatabase() {
  initDatabase();
}

export function persistNewTrip(id: string, startedAt: number) {
  insertTripRow(id, startedAt);
}

export function persistTripEnded(id: string, endedAt: number) {
  updateTripEndedAtRow(id, endedAt);
}

export function persistTripDetails(id: string, name: string, review: string) {
  updateTripDetailsRow(id, name, review);
}

export function persistTripDeleted(id: string) {
  deleteTripRow(id);
}

export function persistTripPoint(tripId: string, point: TripPoint) {
  insertTripPointRow(tripId, point.latitude, point.longitude, point.timestamp);
}

export function persistTripPin(tripId: string, pin: Pin) {
  insertTripPinRow(pin.id, tripId, pin.uri, pin.coordinates.latitude, pin.coordinates.longitude, pin.createdAt);
}

export function loadAllTrips(): Trip[] {
  return getAllTripRows().map((row) => ({
    id: row.id,
    name: row.name,
    review: row.review,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    points: getTripPointRows(row.id).map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp,
    })),
    pins: getTripPinRows(row.id).map((pin) => ({
      id: pin.id,
      uri: pin.uri,
      coordinates: { latitude: pin.latitude, longitude: pin.longitude },
      createdAt: pin.created_at,
    })),
  }));
}
