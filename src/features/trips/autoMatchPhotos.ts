import * as MediaLibrary from "expo-media-library";
import { v4 as uuid } from "uuid";

import type { Pin } from "@/features/map";

import { nearestDistanceMeters } from "./distance";
import type { Trip } from "./types";

/** How close a photo's EXIF location must be to any recorded point to count as "on the route". */
const MATCH_RADIUS_METERS = 150;
/** Catches photos taken just before Start Trip / just after Stop Trip. */
const TIME_BUFFER_MS = 2 * 60 * 1000;
const MAX_CANDIDATES = 200;

/**
 * Scans the camera roll for photos taken during `trip` (with a small time
 * buffer) whose EXIF location falls within `MATCH_RADIUS_METERS` of the
 * recorded route, and returns them as ready-to-attach pins. Silent/no-op
 * (returns []) if gallery permission isn't granted or the trip has no
 * recorded points to match against — never prompts, since this runs right
 * after Stop Trip and permission priming already happened up front.
 */
export async function findGeotaggedPhotosForTrip(trip: Trip): Promise<Pin[]> {
  if (trip.points.length === 0 || trip.endedAt === null) return [];

  const permission = await MediaLibrary.getPermissionsAsync();
  if (permission.status !== "granted") return [];

  const { assets } = await MediaLibrary.getAssetsAsync({
    mediaType: "photo",
    createdAfter: trip.startedAt - TIME_BUFFER_MS,
    createdBefore: trip.endedAt + TIME_BUFFER_MS,
    first: MAX_CANDIDATES,
  });

  const matches: Pin[] = [];

  for (const asset of assets) {
    const info = await MediaLibrary.getAssetInfoAsync(asset);
    const location = info.location;
    if (!location) continue;

    const distance = nearestDistanceMeters(
      { latitude: location.latitude, longitude: location.longitude },
      trip.points
    );
    if (distance > MATCH_RADIUS_METERS) continue;

    matches.push({
      id: uuid(),
      uri: asset.uri,
      coordinates: { latitude: location.latitude, longitude: location.longitude },
      createdAt: asset.creationTime,
    });
  }

  return matches;
}
