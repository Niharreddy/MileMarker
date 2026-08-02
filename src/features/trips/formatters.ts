export function formatTripStartedAt(startedAt: number) {
  return new Date(startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTripDuration(startedAt: number, endedAt: number | null) {
  const minutes = Math.max(1, Math.round(((endedAt ?? Date.now()) - startedAt) / 60_000));
  return minutes === 1 ? "1 min" : `${minutes} min`;
}
