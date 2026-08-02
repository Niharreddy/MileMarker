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
  return formatMinutes(minutes);
}

export function formatMinutes(totalMinutes: number) {
  if (totalMinutes < 60) {
    return totalMinutes === 1 ? "1 min" : `${totalMinutes} min`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}
