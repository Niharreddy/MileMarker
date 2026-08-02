import type { Coordinates } from "@/features/map";
import type { UnitPreference } from "@/store";

const EARTH_RADIUS_METERS = 6371000;
const METERS_PER_MILE = 1609.344;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

export function distanceBetweenMeters(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
}

/** Straight-line distance summed between consecutive points — not road distance. */
export function calculateTripDistanceMeters(points: Coordinates[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceBetweenMeters(points[i - 1]!, points[i]!);
  }
  return total;
}

/** Shortest distance from `target` to any point in `points`; `Infinity` if `points` is empty. */
export function nearestDistanceMeters(target: Coordinates, points: Coordinates[]): number {
  let min = Infinity;
  for (const point of points) {
    const distance = distanceBetweenMeters(target, point);
    if (distance < min) min = distance;
  }
  return min;
}

export function formatDistance(meters: number, unit: UnitPreference): string {
  if (unit === "imperial") {
    const miles = meters / METERS_PER_MILE;
    if (miles < 0.1) return `${Math.round(meters * 3.28084)} ft`;
    return `${miles.toFixed(1)} mi`;
  }

  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
