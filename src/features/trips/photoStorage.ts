import * as FileSystem from "expo-file-system";

const PINS_DIR = `${FileSystem.documentDirectory}pins/`;

function extensionFromUri(uri: string): string {
  const lastSegment = uri.split("/").pop() ?? "";
  const withoutQuery = lastSegment.split("?")[0] ?? "";
  const extension = withoutQuery.includes(".") ? withoutQuery.split(".").pop() : null;
  return extension && extension.length <= 5 ? extension : "jpg";
}

/**
 * Copies a photo (gallery `content://`/`ph://` asset, or a camera-capture
 * cache file) into app-durable storage, keyed by pin id. Both sources can
 * disappear later — a gallery photo can be deleted by the user, a cache
 * file can be purged by the OS — so pins must own a stable copy rather
 * than just referencing wherever the photo happened to come from. Also
 * what makes trip export possible, since that reads pin files back off disk.
 */
export async function persistPinPhoto(sourceUri: string, pinId: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(PINS_DIR, { intermediates: true }).catch(() => {});
  const destinationUri = `${PINS_DIR}${pinId}.${extensionFromUri(sourceUri)}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
  return destinationUri;
}

/** Best-effort cleanup of a pin's durable photo file — used when its trip is deleted. */
export async function deletePinPhoto(uri: string): Promise<void> {
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
}
