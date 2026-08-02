import type { Coordinates } from "@/features/map";

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number) {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceMeters(a: Coordinates, b: Coordinates) {
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
    total += haversineDistanceMeters(points[i - 1]!, points[i]!);
  }
  return total;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}
