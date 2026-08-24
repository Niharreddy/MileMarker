import type { Pin } from "./types";

/** The URI to render in a thumbnail context (grid tile, map marker) — a video's durable thumbnail, or the photo itself. */
export function getPinThumbnailUri(pin: Pin): string {
  return pin.mediaType === "video" ? pin.thumbnailUri ?? pin.uri : pin.uri;
}
