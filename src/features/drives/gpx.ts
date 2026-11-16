import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import type { Drive } from "./types";

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Serializes a drive as GPX 1.1 — the route as one track segment, and each
 * mid-drive note as a waypoint — so it opens in any mapping tool (Google
 * Earth, Strava, Gaia, OsmAnd…).
 */
export function buildGpx(drive: Drive): string {
  const waypoints = drive.notes
    .map(
      (note) =>
        `  <wpt lat="${note.coordinates.latitude}" lon="${note.coordinates.longitude}">\n` +
        `    <time>${new Date(note.createdAt).toISOString()}</time>\n` +
        `    <name>${escapeXml(note.text.slice(0, 60))}</name>\n` +
        `    <desc>${escapeXml(note.text)}</desc>\n` +
        `  </wpt>`
    )
    .join("\n");

  const trackPoints = drive.points
    .map(
      (point) =>
        `      <trkpt lat="${point.latitude}" lon="${point.longitude}">` +
        `<time>${new Date(point.timestamp).toISOString()}</time></trkpt>`
    )
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<gpx version="1.1" creator="Mile Marker" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata>`,
    `    <name>${escapeXml(drive.name)}</name>`,
    drive.review.trim() ? `    <desc>${escapeXml(drive.review)}</desc>` : null,
    `    <time>${new Date(drive.startedAt).toISOString()}</time>`,
    `  </metadata>`,
    waypoints || null,
    `  <trk>`,
    `    <name>${escapeXml(drive.name)}</name>`,
    `    <trkseg>`,
    trackPoints || null,
    `    </trkseg>`,
    `  </trk>`,
    `</gpx>`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

/** Writes the drive's route to a `.gpx` file in the cache directory and opens the OS share sheet for it. */
export async function shareDriveAsGpx(drive: Drive): Promise<void> {
  if (drive.points.length === 0) throw new Error("This drive has no recorded route to export.");

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing isn't available on this device.");

  const safeName = drive.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "drive";
  const destinationUri = `${FileSystem.cacheDirectory}${safeName}.gpx`;
  await FileSystem.writeAsStringAsync(destinationUri, buildGpx(drive));

  await Sharing.shareAsync(destinationUri, {
    mimeType: "application/gpx+xml",
    dialogTitle: `Share "${drive.name}" route`,
    UTI: "com.topografix.gpx",
  });
}
