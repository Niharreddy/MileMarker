import * as SQLite from "expo-sqlite";

/**
 * Deliberately kept generic (row shapes, not domain types like `Trip`) —
 * this is a low-level storage service `features/trips` builds on, not the
 * other way around. Feature-specific mapping lives in
 * `features/trips/persistence.ts`.
 */
const db = SQLite.openDatabaseSync("milemarker.db");

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      review TEXT NOT NULL DEFAULT '',
      started_at INTEGER NOT NULL,
      ended_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS trip_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );

    CREATE TABLE IF NOT EXISTS trip_pins (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL,
      uri TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (trip_id) REFERENCES trips(id)
    );

    CREATE INDEX IF NOT EXISTS idx_trip_points_trip ON trip_points(trip_id);
    CREATE INDEX IF NOT EXISTS idx_trip_pins_trip ON trip_pins(trip_id);
  `);
}

export type TripRow = {
  id: string;
  name: string;
  review: string;
  started_at: number;
  ended_at: number | null;
};

export type TripPointRow = {
  trip_id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
};

export type TripPinRow = {
  id: string;
  trip_id: string;
  uri: string;
  latitude: number;
  longitude: number;
  created_at: number;
};

export function insertTripRow(id: string, startedAt: number) {
  db.runSync(`INSERT INTO trips (id, started_at) VALUES (?, ?)`, [id, startedAt]);
}

export function updateTripDetailsRow(id: string, name: string, review: string) {
  db.runSync(`UPDATE trips SET name = ?, review = ? WHERE id = ?`, [name, review, id]);
}

export function updateTripEndedAtRow(id: string, endedAt: number) {
  db.runSync(`UPDATE trips SET ended_at = ? WHERE id = ?`, [endedAt, id]);
}

export function deleteTripRow(id: string) {
  db.runSync(`DELETE FROM trip_points WHERE trip_id = ?`, [id]);
  db.runSync(`DELETE FROM trip_pins WHERE trip_id = ?`, [id]);
  db.runSync(`DELETE FROM trips WHERE id = ?`, [id]);
}

export function insertTripPointRow(
  tripId: string,
  latitude: number,
  longitude: number,
  timestamp: number
) {
  db.runSync(
    `INSERT INTO trip_points (trip_id, latitude, longitude, timestamp) VALUES (?, ?, ?, ?)`,
    [tripId, latitude, longitude, timestamp]
  );
}

export function insertTripPinRow(
  id: string,
  tripId: string,
  uri: string,
  latitude: number,
  longitude: number,
  createdAt: number
) {
  db.runSync(
    `INSERT INTO trip_pins (id, trip_id, uri, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, tripId, uri, latitude, longitude, createdAt]
  );
}

export function getAllTripRows(): TripRow[] {
  return db.getAllSync<TripRow>(`SELECT * FROM trips ORDER BY started_at DESC`);
}

export function getTripPointRows(tripId: string): TripPointRow[] {
  return db.getAllSync<TripPointRow>(
    `SELECT * FROM trip_points WHERE trip_id = ? ORDER BY timestamp ASC`,
    [tripId]
  );
}

export function getTripPinRows(tripId: string): TripPinRow[] {
  return db.getAllSync<TripPinRow>(
    `SELECT * FROM trip_pins WHERE trip_id = ? ORDER BY created_at ASC`,
    [tripId]
  );
}
