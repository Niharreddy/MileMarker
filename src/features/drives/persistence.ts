import type { Pin, PinMediaType } from "@/features/map";
import {
  deleteDriveRow,
  getAllDriveRows,
  getDriveNoteRows,
  getDrivePinRows,
  getDrivePointRows,
  initDatabase,
  insertDriveNoteRow,
  insertDrivePinRow,
  insertDrivePointRow,
  insertDriveRow,
  updateDriveDetailsRow,
  updateDriveEndedAtRow,
  updateDriveTripIdRow,
} from "@/services/db";

import type { Drive, DriveNote, DrivePoint } from "./types";

/** Maps between the generic DB row shapes in `services/db` and this feature's `Drive` domain type. */

export function initDriveDatabase() {
  initDatabase();
}

export function persistNewDrive(id: string, startedAt: number, tripId: string | null) {
  insertDriveRow(id, startedAt, tripId);
}

export function persistDriveEnded(id: string, endedAt: number) {
  updateDriveEndedAtRow(id, endedAt);
}

export function persistDriveDetails(id: string, name: string, review: string) {
  updateDriveDetailsRow(id, name, review);
}

export function persistDriveDeleted(id: string) {
  deleteDriveRow(id);
}

export function persistDriveTripId(id: string, tripId: string | null) {
  updateDriveTripIdRow(id, tripId);
}

export function persistDrivePoint(driveId: string, point: DrivePoint) {
  insertDrivePointRow(driveId, point.latitude, point.longitude, point.timestamp);
}

export function persistDrivePin(driveId: string, pin: Pin) {
  insertDrivePinRow(
    pin.id,
    driveId,
    pin.uri,
    pin.mediaType,
    pin.thumbnailUri ?? null,
    pin.coordinates.latitude,
    pin.coordinates.longitude,
    pin.createdAt
  );
}

export function persistDriveNote(driveId: string, note: DriveNote) {
  insertDriveNoteRow(note.id, driveId, note.text, note.coordinates.latitude, note.coordinates.longitude, note.createdAt);
}

export function loadAllDrives(): Drive[] {
  return getAllDriveRows().map((row) => ({
    id: row.id,
    name: row.name,
    review: row.review,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    tripId: row.trip_id,
    points: getDrivePointRows(row.id).map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: point.timestamp,
    })),
    pins: getDrivePinRows(row.id).map((pin) => ({
      id: pin.id,
      uri: pin.uri,
      mediaType: pin.media_type as PinMediaType,
      thumbnailUri: pin.thumbnail_uri ?? undefined,
      coordinates: { latitude: pin.latitude, longitude: pin.longitude },
      createdAt: pin.created_at,
    })),
    notes: getDriveNoteRows(row.id).map((note) => ({
      id: note.id,
      text: note.text,
      coordinates: { latitude: note.latitude, longitude: note.longitude },
      createdAt: note.created_at,
    })),
  }));
}
