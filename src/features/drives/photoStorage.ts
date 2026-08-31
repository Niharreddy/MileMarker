import * as FileSystem from "expo-file-system";
import * as VideoThumbnails from "expo-video-thumbnails";

import type { PinMediaType } from "@/features/map";

const PINS_DIR = `${FileSystem.documentDirectory}pins/`;

function extensionFromUri(uri: string, fallback: string): string {
  const lastSegment = uri.split("/").pop() ?? "";
  const withoutQuery = lastSegment.split("?")[0] ?? "";
  const extension = withoutQuery.includes(".") ? withoutQuery.split(".").pop() : null;
  return extension && extension.length <= 5 ? extension : fallback;
}

export type PersistedPinMedia = {
  uri: string;
  /** Set only for videos — a durable static frame grids/map markers can render. */
  thumbnailUri?: string;
};

/**
 * Copies a pin's media (gallery `content://`/`ph://` asset, or a
 * camera-capture cache file) into app-durable storage, keyed by pin id. Both
 * sources can disappear later — a gallery asset can be deleted by the user, a
 * cache file can be purged by the OS — so pins must own a stable copy rather
 * than just referencing wherever the media happened to come from. Also what
 * makes drive export possible, since that reads pin files back off disk. For
 * videos, also generates and persists a static thumbnail frame, since
 * neither grids nor map markers can render a video file directly.
 */
export async function persistPinMedia(
  sourceUri: string,
  pinId: string,
  mediaType: PinMediaType
): Promise<PersistedPinMedia> {
  await FileSystem.makeDirectoryAsync(PINS_DIR, { intermediates: true }).catch(() => {});
  const extension = extensionFromUri(sourceUri, mediaType === "video" ? "mp4" : "jpg");
  const destinationUri = `${PINS_DIR}${pinId}.${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });

  if (mediaType !== "video") return { uri: destinationUri };

  try {
    const { uri: generatedThumbnailUri } = await VideoThumbnails.getThumbnailAsync(destinationUri, { time: 0 });
    const thumbnailUri = `${PINS_DIR}${pinId}-thumb.jpg`;
    await FileSystem.copyAsync({ from: generatedThumbnailUri, to: thumbnailUri });
    return { uri: destinationUri, thumbnailUri };
  } catch {
    // Thumbnail generation is best-effort — the video itself still persisted fine.
    return { uri: destinationUri };
  }
}

/** Best-effort cleanup of a pin's durable media file(s) — used when its drive is deleted. */
export async function deletePinMedia(uri: string, thumbnailUri?: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
  if (thumbnailUri) await FileSystem.deleteAsync(thumbnailUri, { idempotent: true }).catch(() => {});
}
