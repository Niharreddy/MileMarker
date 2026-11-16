import * as SQLite from "expo-sqlite";

/**
 * Deliberately kept generic (row shapes, not domain types like `Drive`) —
 * this is a low-level storage service `features/drives`/`features/trips`
 * build on, not the other way around. Feature-specific mapping lives in
 * each feature's `persistence.ts`.
 */
const db = SQLite.openDatabaseSync("milemarker.db");

function tableExists(name: string): boolean {
  const row = db.getFirstSync<{ name: string }>(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`,
    [name]
  );
  return !!row;
}

/**
 * Drives used to be called "trips" (single start/stop recordings). "Trip"
 * was repurposed to mean a bundle of drives, so the original tables are
 * renamed in place — not recreated — the first time this runs post-upgrade,
 * so existing recorded drives/photos survive.
 */
function migrateTripsToDrivesIfNeeded() {
  if (tableExists("trips") && !tableExists("drives")) {
    db.execSync(`
      ALTER TABLE trips RENAME TO drives;
      ALTER TABLE trip_points RENAME TO drive_points;
      ALTER TABLE trip_pins RENAME TO drive_pins;
      ALTER TABLE trip_notes RENAME TO drive_notes;
      ALTER TABLE drive_points RENAME COLUMN trip_id TO drive_id;
      ALTER TABLE drive_pins RENAME COLUMN trip_id TO drive_id;
      ALTER TABLE drive_notes RENAME COLUMN trip_id TO drive_id;
    `);
  }
}

export function initDatabase() {
  db.execSync(`PRAGMA journal_mode = WAL;`);
  migrateTripsToDrivesIfNeeded();

  db.execSync(`
    CREATE TABLE IF NOT EXISTS drives (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      review TEXT NOT NULL DEFAULT '',
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      trip_id TEXT
    );

    CREATE TABLE IF NOT EXISTS drive_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drive_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (drive_id) REFERENCES drives(id)
    );

    CREATE TABLE IF NOT EXISTS drive_pins (
      id TEXT PRIMARY KEY,
      drive_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'photo',
      thumbnail_uri TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (drive_id) REFERENCES drives(id)
    );

    CREATE TABLE IF NOT EXISTS drive_notes (
      id TEXT PRIMARY KEY,
      drive_id TEXT NOT NULL,
      text TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (drive_id) REFERENCES drives(id)
    );

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      review TEXT NOT NULL DEFAULT '',
      date_label TEXT NOT NULL DEFAULT '',
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS trip_notes (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      text TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );

    CREATE TABLE IF NOT EXISTS trip_pins (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      media_type TEXT NOT NULL DEFAULT 'photo',
      thumbnail_uri TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );

    CREATE INDEX IF NOT EXISTS idx_drive_points_drive ON drive_points(drive_id);
    CREATE INDEX IF NOT EXISTS idx_drive_pins_drive ON drive_pins(drive_id);
    CREATE INDEX IF NOT EXISTS idx_drive_notes_drive ON drive_notes(drive_id);
    CREATE INDEX IF NOT EXISTS idx_drives_trip_id ON drives(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_notes_trip ON trip_notes(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_pins_trip ON trip_pins(trip_id);
  `);

  // `CREATE TABLE IF NOT EXISTS` above doesn't add columns to a drives/drive_pins
  // table that already existed pre-upgrade — do that here, idempotently,
  // since ALTER TABLE has no "IF NOT EXISTS" for columns.
  try {
    db.execSync(`ALTER TABLE drive_pins ADD COLUMN media_type TEXT NOT NULL DEFAULT 'photo';`);
  } catch {
    // Column already exists.
  }
  try {
    db.execSync(`ALTER TABLE drive_pins ADD COLUMN thumbnail_uri TEXT;`);
  } catch {
    // Column already exists.
  }
  try {
    db.execSync(`ALTER TABLE drives ADD COLUMN trip_id TEXT;`);
  } catch {
    // Column already exists.
  }
  try {
    db.execSync(`ALTER TABLE trips ADD COLUMN date_label TEXT NOT NULL DEFAULT '';`);
  } catch {
    // Column already exists.
  }
  // A pin added after the fact may have no location at all (the photo carried
  // no GPS metadata). latitude/longitude are NOT NULL in every existing
  // install, so rather than rebuild the tables, a flag marks whether those
  // two columns hold a real position (1) or a 0/0 placeholder (0).
  for (const table of ["drive_pins", "trip_pins"]) {
    try {
      db.execSync(`ALTER TABLE ${table} ADD COLUMN has_location INTEGER NOT NULL DEFAULT 1;`);
    } catch {
      // Column already exists.
    }
  }
}

export type DriveRow = {
  id: string;
  name: string;
  review: string;
  started_at: number;
  ended_at: number | null;
  trip_id: string | null;
};

export type DrivePointRow = {
  drive_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type DrivePinRow = {
  id: string;
  drive_id: string;
  uri: string;
  media_type: string;
  thumbnail_uri: string | null;
  latitude: number;
  longitude: number;
  /** 0 when the pin has no known position — `latitude`/`longitude` are then just placeholders. */
  has_location: number;
  created_at: number;
};

export type DriveNoteRow = {
  id: string;
  drive_id: string;
  text: string;
  latitude: number;
  longitude: number;
  created_at: number;
};

export function insertDriveRow(id: string, startedAt: number, tripId: string | null) {
  db.runSync(`INSERT INTO drives (id, started_at, trip_id) VALUES (?, ?, ?)`, [id, startedAt, tripId]);
}

export function updateDriveDetailsRow(id: string, name: string, review: string) {
  db.runSync(`UPDATE drives SET name = ?, review = ? WHERE id = ?`, [name, review, id]);
}

export function updateDriveEndedAtRow(id: string, endedAt: number) {
  db.runSync(`UPDATE drives SET ended_at = ? WHERE id = ?`, [endedAt, id]);
}

export function updateDriveTripIdRow(id: string, tripId: string | null) {
  db.runSync(`UPDATE drives SET trip_id = ? WHERE id = ?`, [tripId, id]);
}

export function deleteDriveRow(id: string) {
  db.runSync(`DELETE FROM drive_points WHERE drive_id = ?`, [id]);
  db.runSync(`DELETE FROM drive_pins WHERE drive_id = ?`, [id]);
  db.runSync(`DELETE FROM drive_notes WHERE drive_id = ?`, [id]);
  db.runSync(`DELETE FROM drives WHERE id = ?`, [id]);
}

export function insertDrivePointRow(driveId: string, latitude: number, longitude: number, timestamp: number) {
  db.runSync(
    `INSERT INTO drive_points (drive_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`,
    [driveId, latitude, longitude, timestamp]
  );
}

export function insertDrivePinRow(
  id: string,
  driveId: string,
  uri: string,
  mediaType: string,
  thumbnailUri: string | null,
  /** Both null for a pin with no known position. */
  latitude: number | null,
  longitude: number | null,
  createdAt: number
) {
  const hasLocation = latitude !== null && longitude !== null;
  db.runSync(
    `INSERT INTO drive_pins (id, drive_id, uri, media_type, thumbnail_uri, latitude, longitude, has_location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, driveId, uri, mediaType, thumbnailUri, latitude ?? 0, longitude ?? 0, hasLocation ? 1 : 0, createdAt]
  );
}

export function deleteDrivePinRow(id: string) {
  db.runSync(`DELETE FROM drive_pins WHERE id = ?`, [id]);
}

export function getAllDriveRows(): DriveRow[] {
  return db.getAllSync<DriveRow>(`SELECT * FROM drives ORDER BY started_at DESC`);
}

export function getDriveRowsByTripId(tripId: string): DriveRow[] {
  return db.getAllSync<DriveRow>(`SELECT * FROM drives WHERE trip_id = ? ORDER BY started_at ASC`, [tripId]);
}

export function getDrivePointRows(driveId: string): DrivePointRow[] {
  return db.getAllSync<DrivePointRow>(`SELECT * FROM drive_points WHERE drive_id = ? ORDER BY timestamp ASC`, [
    driveId,
  ]);
}

export function getDrivePinRows(driveId: string): DrivePinRow[] {
  return db.getAllSync<DrivePinRow>(`SELECT * FROM drive_pins WHERE drive_id = ? ORDER BY created_at ASC`, [
    driveId,
  ]);
}

export function insertDriveNoteRow(
  id: string,
  driveId: string,
  text: string,
  latitude: number,
  longitude: number,
  createdAt: number
) {
  db.runSync(
    `INSERT INTO drive_notes (id, drive_id, text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, driveId, text, latitude, longitude, createdAt]
  );
}

export function getDriveNoteRows(driveId: string): DriveNoteRow[] {
  return db.getAllSync<DriveNoteRow>(`SELECT * FROM drive_notes WHERE drive_id = ? ORDER BY created_at ASC`, [
    driveId,
  ]);
}

export type TripRow = {
  id: string;
  name: string;
  review: string;
  date_label: string;
  started_at: number;
  ended_at: number | null;
};

export type TripNoteRow = {
  id: string;
  trip_id: string;
  text: string;
  latitude: number;
  longitude: number;
  created_at: number;
};

export function insertTripRow(id: string, startedAt: number, name: string, dateLabel: string) {
  db.runSync(`INSERT INTO trips (id, started_at, name, date_label) VALUES (?, ?, ?, ?)`, [
    id,
    startedAt,
    name,
    dateLabel,
  ]);
}

export function updateTripDetailsRow(id: string, name: string, review: string) {
  db.runSync(`UPDATE trips SET name = ?, review = ? WHERE id = ?`, [name, review, id]);
}

export function updateTripReviewRow(id: string, review: string) {
  db.runSync(`UPDATE trips SET review = ? WHERE id = ?`, [review, id]);
}

export function updateTripEndedAtRow(id: string, endedAt: number) {
  db.runSync(`UPDATE trips SET ended_at = ? WHERE id = ?`, [endedAt, id]);
}

export function deleteTripRow(id: string) {
  // Member drives outlive their trip — unbundle them, don't delete them.
  db.runSync(`UPDATE drives SET trip_id = NULL WHERE trip_id = ?`, [id]);
  db.runSync(`DELETE FROM trip_notes WHERE trip_id = ?`, [id]);
  db.runSync(`DELETE FROM trip_pins WHERE trip_id = ?`, [id]);
  db.runSync(`DELETE FROM trips WHERE id = ?`, [id]);
}

export function getAllTripRows(): TripRow[] {
  return db.getAllSync<TripRow>(`SELECT * FROM trips ORDER BY started_at DESC`);
}

export function insertTripNoteRow(
  id: string,
  tripId: string,
  text: string,
  latitude: number,
  longitude: number,
  createdAt: number
) {
  db.runSync(
    `INSERT INTO trip_notes (id, trip_id, text, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tripId, text, latitude, longitude, createdAt]
  );
}

export function getTripNoteRows(tripId: string): TripNoteRow[] {
  return db.getAllSync<TripNoteRow>(`SELECT * FROM trip_notes WHERE trip_id = ? ORDER BY created_at ASC`, [
    tripId,
  ]);
}

export type TripPinRow = {
  id: string;
  trip_id: string;
  uri: string;
  media_type: string;
  thumbnail_uri: string | null;
  latitude: number;
  longitude: number;
  /** 0 when the pin has no known position — `latitude`/`longitude` are then just placeholders. */
  has_location: number;
  created_at: number;
};

export function insertTripPinRow(
  id: string,
  tripId: string,
  uri: string,
  mediaType: string,
  thumbnailUri: string | null,
  /** Both null for a pin with no known position. */
  latitude: number | null,
  longitude: number | null,
  createdAt: number
) {
  const hasLocation = latitude !== null && longitude !== null;
  db.runSync(
    `INSERT INTO trip_pins (id, trip_id, uri, media_type, thumbnail_uri, latitude, longitude, has_location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, tripId, uri, mediaType, thumbnailUri, latitude ?? 0, longitude ?? 0, hasLocation ? 1 : 0, createdAt]
  );
}

export function getTripPinRows(tripId: string): TripPinRow[] {
  return db.getAllSync<TripPinRow>(`SELECT * FROM trip_pins WHERE trip_id = ? ORDER BY created_at ASC`, [
    tripId,
  ]);
}

export function deleteTripPinRow(id: string) {
  db.runSync(`DELETE FROM trip_pins WHERE id = ?`, [id]);
}
