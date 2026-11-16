import * as MediaLibrary from "expo-media-library";

import type { Coordinates } from "./types";

function isValidCoordinates(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180 &&
    // 0/0 is what a camera writes when it had no GPS fix — "no location", not a spot in the Gulf of Guinea.
    !(latitude === 0 && longitude === 0)
  );
}

/**
 * The GPS position embedded in a gallery photo/video, or null if it has
 * none (or it can't be read — e.g. media-location access was denied).
 */
export async function readAssetLocation(asset: MediaLibrary.Asset): Promise<Coordinates | null> {
  try {
    const { location } = await MediaLibrary.getAssetInfoAsync(asset);
    if (!location) return null;
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    return isValidCoordinates(latitude, longitude) ? { latitude, longitude } : null;
  } catch {
    return null;
  }
}

/**
 * The GPS position from a just-captured photo's EXIF block, or null if the
 * camera didn't write one. iOS reports unsigned values plus N/S and E/W
 * reference tags; Android usually reports already-signed decimals.
 */
export function readExifLocation(exif: Record<string, unknown> | null | undefined): Coordinates | null {
  if (!exif) return null;

  const rawLatitude = Number(exif.GPSLatitude);
  const rawLongitude = Number(exif.GPSLongitude);
  if (!Number.isFinite(rawLatitude) || !Number.isFinite(rawLongitude)) return null;

  const latitude = exif.GPSLatitudeRef === "S" ? -Math.abs(rawLatitude) : rawLatitude;
  const longitude = exif.GPSLongitudeRef === "W" ? -Math.abs(rawLongitude) : rawLongitude;
  return isValidCoordinates(latitude, longitude) ? { latitude, longitude } : null;
}
