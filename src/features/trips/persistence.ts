import {
  deleteTripRow,
  getAllTripRows,
  getTripNoteRows,
  initDatabase,
  insertTripNoteRow,
  insertTripRow,
  updateTripDetailsRow,
  updateTripEndedAtRow,
  updateTripReviewRow,
} from "@/services/db";

import type { Trip, TripNote } from "./types";

/** Maps between the generic DB row shapes in `services/db` and this feature's `Trip` (bundle) domain type. */

export function initTripDatabase() {
  initDatabase();
}

export function persistNewTrip(id: string, startedAt: number, name: string, dateLabel: string) {
  insertTripRow(id, startedAt, name, dateLabel);
}

export function persistTripEnded(id: string, endedAt: number) {
  updateTripEndedAtRow(id, endedAt);
}

export function persistTripDetails(id: string, name: string, review: string) {
  updateTripDetailsRow(id, name, review);
}

export function persistTripReview(id: string, review: string) {
  updateTripReviewRow(id, review);
}

export function persistTripDeleted(id: string) {
  deleteTripRow(id);
}

export function persistTripNote(tripId: string, note: TripNote) {
  insertTripNoteRow(note.id, tripId, note.text, note.coordinates.latitude, note.coordinates.longitude, note.createdAt);
}

export function loadAllTrips(): Trip[] {
  return getAllTripRows().map((row) => ({
    id: row.id,
    name: row.name,
    review: row.review,
    dateLabel: row.date_label,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    notes: getTripNoteRows(row.id).map((note) => ({
      id: note.id,
      text: note.text,
      coordinates: { latitude: note.latitude, longitude: note.longitude },
      createdAt: note.created_at,
    })),
  }));
}
