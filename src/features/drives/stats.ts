import { calculateRouteDistanceMeters } from "@/utils/geo";

import type { Drive } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

export type MonthlyDistance = {
  /** "2026-11" — stable key, also sorts chronologically. */
  key: string;
  /** First instant of the month, local time. */
  monthStart: number;
  distanceMeters: number;
  driveCount: number;
};

export type DriveRecord = {
  driveId: string;
  name: string;
  startedAt: number;
  distanceMeters: number;
  durationMs: number;
};

export type DriveStats = {
  driveCount: number;
  totalDistanceMeters: number;
  totalDurationMs: number;
  /** Distinct calendar days with at least one drive. */
  daysDriven: number;
  /** The most recent `monthCount` calendar months, oldest first, including months with no drives. */
  monthly: MonthlyDistance[];
  longestByDistance: DriveRecord | null;
  longestByDuration: DriveRecord | null;
  /** Consecutive days with a drive, counting back from today — or from yesterday, so a streak isn't "lost" before today's drive happens. */
  currentStreakDays: number;
  longestStreakDays: number;
  /** Last day of the longest streak, for display. */
  longestStreakEndedAt: number | null;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Whole days since the epoch in *local* time, so "the same day" and
 * "consecutive days" mean what the calendar on the wall says. Built from
 * the local date parts via `Date.UTC` so a daylight-saving shift (a 23- or
 * 25-hour day) can't skip or repeat a day number.
 */
function localDayNumber(timestamp: number) {
  const date = new Date(timestamp);
  return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
}

function dayNumberToTimestamp(dayNumber: number) {
  const utc = new Date(dayNumber * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()).getTime();
}

/** Everything the Stats screen shows, derived in one pass from the saved drives. A drive counts toward the day/month it started in. */
export function computeDriveStats(drives: Drive[], now: number = Date.now(), monthCount = 12): DriveStats {
  // Seed the trailing window of months up front so empty months still get a (zero-height) bar.
  const monthly: MonthlyDistance[] = [];
  const monthByKey = new Map<string, MonthlyDistance>();
  const today = new Date(now);
  for (let offset = monthCount - 1; offset >= 0; offset--) {
    const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const entry = { key: monthKey(start), monthStart: start.getTime(), distanceMeters: 0, driveCount: 0 };
    monthly.push(entry);
    monthByKey.set(entry.key, entry);
  }

  let totalDistanceMeters = 0;
  let totalDurationMs = 0;
  let longestByDistance: DriveRecord | null = null;
  let longestByDuration: DriveRecord | null = null;
  const dayNumbers = new Set<number>();

  for (const drive of drives) {
    const distanceMeters = calculateRouteDistanceMeters(drive.points);
    const durationMs = Math.max(0, (drive.endedAt ?? drive.startedAt) - drive.startedAt);
    const record: DriveRecord = {
      driveId: drive.id,
      name: drive.name,
      startedAt: drive.startedAt,
      distanceMeters,
      durationMs,
    };

    totalDistanceMeters += distanceMeters;
    totalDurationMs += durationMs;
    if (distanceMeters > 0 && (!longestByDistance || distanceMeters > longestByDistance.distanceMeters)) {
      longestByDistance = record;
    }
    if (durationMs > 0 && (!longestByDuration || durationMs > longestByDuration.durationMs)) {
      longestByDuration = record;
    }

    const month = monthByKey.get(monthKey(new Date(drive.startedAt)));
    if (month) {
      month.distanceMeters += distanceMeters;
      month.driveCount += 1;
    }

    dayNumbers.add(localDayNumber(drive.startedAt));
  }

  // Streaks: walk the distinct driving days in order, measuring each run of consecutive days.
  const sortedDays = [...dayNumbers].sort((a, b) => a - b);
  let longestStreakDays = 0;
  let longestStreakEndDay: number | null = null;
  let runLength = 0;
  let previousDay: number | null = null;
  for (const day of sortedDays) {
    runLength = previousDay !== null && day === previousDay + 1 ? runLength + 1 : 1;
    if (runLength > longestStreakDays) {
      longestStreakDays = runLength;
      longestStreakEndDay = day;
    }
    previousDay = day;
  }

  const todayNumber = localDayNumber(now);
  let currentStreakDays = 0;
  let cursor = dayNumbers.has(todayNumber) ? todayNumber : todayNumber - 1;
  while (dayNumbers.has(cursor)) {
    currentStreakDays += 1;
    cursor -= 1;
  }

  return {
    driveCount: drives.length,
    totalDistanceMeters,
    totalDurationMs,
    daysDriven: dayNumbers.size,
    monthly,
    longestByDistance,
    longestByDuration,
    currentStreakDays,
    longestStreakDays,
    longestStreakEndedAt: longestStreakEndDay === null ? null : dayNumberToTimestamp(longestStreakEndDay),
  };
}
