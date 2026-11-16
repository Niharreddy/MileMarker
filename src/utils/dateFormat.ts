/** Shared by both Drives (single recordings) and Trips (bundles of drives) — both have a startedAt/endedAt. */
export function formatStartedAt(startedAt: number) {
  return new Date(startedAt).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(startedAt: number, endedAt: number | null) {
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

/** "Sat, Nov 5" — or "Sat, Nov 5, 2025" once it's no longer the current year. */
export function formatDate(timestamp: number) {
  const date = new Date(timestamp);
  const isCurrentYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: isCurrentYear ? undefined : "numeric",
  });
}

export function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

/** "November 2026" — the heading used to group lists by month. */
export function formatMonthYear(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Live stopwatch-style elapsed time: "4:07", "1:02:45". */
export function formatElapsed(elapsedMs: number) {
  const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const paddedSeconds = String(seconds).padStart(2, "0");
  if (hours === 0) return `${minutes}:${paddedSeconds}`;
  return `${hours}:${String(minutes).padStart(2, "0")}:${paddedSeconds}`;
}

/**
 * Groups items (assumed already sorted) into consecutive month sections,
 * shaped for `SectionList` — `[{ title: "November 2026", data: [...] }, ...]`.
 */
export function groupByMonth<T>(items: T[], getTimestamp: (item: T) => number): { title: string; data: T[] }[] {
  const sections: { title: string; data: T[] }[] = [];
  for (const item of items) {
    const title = formatMonthYear(getTimestamp(item));
    const last = sections[sections.length - 1];
    if (last && last.title === title) {
      last.data.push(item);
    } else {
      sections.push({ title, data: [item] });
    }
  }
  return sections;
}
