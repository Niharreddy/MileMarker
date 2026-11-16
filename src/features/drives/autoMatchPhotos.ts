import * as MediaLibrary from "expo-media-library";
import { v4 as uuid } from "uuid";

import type { Coordinates, Pin, PinMediaType } from "@/features/map";
import { nearestDistanceMeters } from "@/utils";

import { persistPinMedia } from "./photoStorage";
import type { Drive, DrivePoint } from "./types";

/** How close a photo's EXIF location must be to any recorded point to count as "on the route". */
const MATCH_RADIUS_METERS = 150;
/** Catches photos taken just before Start Drive / just after Stop Drive. */
const TIME_BUFFER_MS = 2 * 60 * 1000;
const MAX_CANDIDATES = 200;

/** The recorded point closest in time to `timestamp` — used when an asset has no embedded location of its own. */
function nearestPointByTime(timestamp: number, points: DrivePoint[]): DrivePoint | null {
  let closest: DrivePoint | null = null;
  let smallestDelta = Infinity;
  for (const point of points) {
    const delta = Math.abs(point.timestamp - timestamp);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      closest = point;
    }
  }
  return closest;
}

/**
 * Scans the camera roll for photos/videos taken during `drive` (with a small
 * time buffer) and returns them as ready-to-attach pins. Silent/no-op
 * (returns []) if gallery permission isn't granted or the drive has no
 * recorded points to match against — never prompts, since this runs right
 * after Stop Drive and permission priming already happened up front.
 *
 * Prefers the asset's own embedded location (matched within
 * `MATCH_RADIUS_METERS` of the route) when it has one. Android videos very
 * often have no embedded location at all, even with location services on —
 * unlike photo EXIF, it's not reliably written — so an asset with none
 * falls back to the recorded route point closest in time to when it was
 * taken, rather than being dropped. The query already bounds every
 * candidate to the drive's own time window, so this fallback can't pull in
 * something unrelated.
 */
export async function findGeotaggedPhotosForDrive(drive: Drive): Promise<Pin[]> {
  if (drive.points.length === 0 || drive.endedAt === null) return [];

  const permission = await MediaLibrary.getPermissionsAsync(false, ["photo", "video"]);
  if (permission.status !== "granted") return [];

  const { assets } = await MediaLibrary.getAssetsAsync({
    mediaType: ["photo", "video"],
    createdAfter: drive.startedAt - TIME_BUFFER_MS,
    createdBefore: drive.endedAt + TIME_BUFFER_MS,
    first: MAX_CANDIDATES,
  });

  const matches: Pin[] = [];

  for (const asset of assets) {
    // One unreadable asset (deleted mid-scan, missing ACCESS_MEDIA_LOCATION,
    // unsupported file) must not abort matching for the whole drive.
    let location: MediaLibrary.Location | undefined;
    try {
      const info = await MediaLibrary.getAssetInfoAsync(asset);
      location = info.location;
    } catch {
      location = undefined;
    }

    let coordinates: Coordinates;
    if (location) {
      const distance = nearestDistanceMeters(
        { latitude: location.latitude, longitude: location.longitude },
        drive.points
      );
      if (distance > MATCH_RADIUS_METERS) continue;
      coordinates = { latitude: location.latitude, longitude: location.longitude };
    } else {
      const nearestPoint = nearestPointByTime(asset.creationTime, drive.points);
      if (!nearestPoint) continue;
      coordinates = { latitude: nearestPoint.latitude, longitude: nearestPoint.longitude };
    }

    const id = uuid();
    const mediaType: PinMediaType = asset.mediaType === "video" ? "video" : "photo";
    try {
      const { uri: persistedUri, thumbnailUri } = await persistPinMedia(asset.uri, id, mediaType);
      matches.push({
        id,
        uri: persistedUri,
        mediaType,
        thumbnailUri,
        coordinates,
        createdAt: asset.creationTime,
      });
    } catch {
      // Couldn't copy this one — skip it and keep matching the rest.
    }
  }

  return matches;
}
