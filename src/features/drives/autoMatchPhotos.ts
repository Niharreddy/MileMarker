import * as MediaLibrary from "expo-media-library";
import { v4 as uuid } from "uuid";

import type { Pin, PinMediaType } from "@/features/map";
import { nearestDistanceMeters } from "@/utils";

import { persistPinMedia } from "./photoStorage";
import type { Drive } from "./types";

/** How close a photo's EXIF location must be to any recorded point to count as "on the route". */
const MATCH_RADIUS_METERS = 150;
/** Catches photos taken just before Start Drive / just after Stop Drive. */
const TIME_BUFFER_MS = 2 * 60 * 1000;
const MAX_CANDIDATES = 200;

/**
 * Scans the camera roll for photos taken during `drive` (with a small time
 * buffer) whose EXIF location falls within `MATCH_RADIUS_METERS` of the
 * recorded route, and returns them as ready-to-attach pins. Silent/no-op
 * (returns []) if gallery permission isn't granted or the drive has no
 * recorded points to match against — never prompts, since this runs right
 * after Stop Drive and permission priming already happened up front.
 */
export async function findGeotaggedPhotosForDrive(drive: Drive): Promise<Pin[]> {
  if (drive.points.length === 0 || drive.endedAt === null) return [];

  const permission = await MediaLibrary.getPermissionsAsync();
  if (permission.status !== "granted") return [];

  const { assets } = await MediaLibrary.getAssetsAsync({
    mediaType: ["photo", "video"],
    createdAfter: drive.startedAt - TIME_BUFFER_MS,
    createdBefore: drive.endedAt + TIME_BUFFER_MS,
    first: MAX_CANDIDATES,
  });

  const matches: Pin[] = [];

  for (const asset of assets) {
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    const location = info.location;
    if (!location) continue;

    const distance = nearestDistanceMeters(
      { latitude: location.latitude, longitude: location.longitude },
      drive.points
    );
    if (distance > MATCH_RADIUS_METERS) continue;

    const id = uuid();
    const mediaType: PinMediaType = asset.mediaType === "video" ? "video" : "photo";
    const { uri: persistedUri, thumbnailUri } = await persistPinMedia(asset.uri, id, mediaType);
    matches.push({
      id,
      uri: persistedUri,
      mediaType,
      thumbnailUri,
      coordinates: { latitude: location.latitude, longitude: location.longitude },
      createdAt: asset.creationTime,
    });
  }

  return matches;
}
