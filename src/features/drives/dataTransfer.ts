import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

import { exportFileSchema, type ExportFile, type ExportedDrive } from "./schema";
import {
  persistDriveDetails,
  persistDriveEnded,
  persistDriveNote,
  persistDrivePin,
  persistDrivePoint,
  persistNewDrive,
} from "./persistence";
import { useDriveStore } from "./store/driveStore";

const PINS_DIR = `${FileSystem.documentDirectory}pins/`;

/**
 * Every past drive — points, pins (photo/video bytes embedded as base64), and
 * notes — serialized to a single JSON file and handed to the OS share
 * sheet (save to Drive/Files, send via email, AirDrop, etc.). No zip
 * library: base64 costs ~33% extra size, but it keeps this to one file and
 * one new-native-module-free code path.
 */
export async function exportAllData(): Promise<void> {
  const pastDrives = useDriveStore.getState().pastDrives;

  const drives: ExportedDrive[] = [];
  for (const drive of pastDrives) {
    if (drive.endedAt === null) continue;

    const pins = [];
    for (const pin of drive.pins) {
      const photoBase64 = await FileSystem.readAsStringAsync(pin.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const photoExtension = pin.uri.split(".").pop()?.split("?")[0] || "jpg";

      let thumbnailBase64: string | undefined;
      let thumbnailExtension: string | undefined;
      if (pin.mediaType === "video" && pin.thumbnailUri) {
        thumbnailBase64 = await FileSystem.readAsStringAsync(pin.thumbnailUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        thumbnailExtension = pin.thumbnailUri.split(".").pop()?.split("?")[0] || "jpg";
      }

      pins.push({
        id: pin.id,
        coordinates: pin.coordinates,
        createdAt: pin.createdAt,
        photoBase64,
        photoExtension,
        mediaType: pin.mediaType,
        thumbnailBase64,
        thumbnailExtension,
      });
    }

    drives.push({
      id: drive.id,
      name: drive.name,
      review: drive.review,
      startedAt: drive.startedAt,
      endedAt: drive.endedAt,
      points: drive.points,
      pins,
      notes: drive.notes,
    });
  }

  const exportFile: ExportFile = { schemaVersion: 1, exportedAt: Date.now(), trips: drives };

  const destinationUri = `${FileSystem.cacheDirectory}milemarker-export-${Date.now()}.json`;
  await FileSystem.writeAsStringAsync(destinationUri, JSON.stringify(exportFile));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error("Sharing isn't available on this device.");
  await Sharing.shareAsync(destinationUri, {
    mimeType: "application/json",
    dialogTitle: "Export Mile Marker data",
  });
}

/**
 * Lets the user pick a previously-exported JSON file and merges its drives
 * in. Drives whose id already exists locally are skipped (re-importing the
 * same file, or a file shared back and forth between two devices, doesn't
 * create duplicates). Imported drives are never attached to a Trip — that's
 * a local-only association the export format doesn't carry.
 */
export async function importDataFromFile(): Promise<{ importedCount: number }> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json" });
  if (result.canceled || !result.assets[0]) return { importedCount: 0 };

  const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("That file isn't valid Mile Marker export data.");
  }

  const exportFile = exportFileSchema.safeParse(parsed);
  if (!exportFile.success) {
    throw new Error("That file isn't valid Mile Marker export data.");
  }

  const existingIds = new Set(useDriveStore.getState().pastDrives.map((drive) => drive.id));
  await FileSystem.makeDirectoryAsync(PINS_DIR, { intermediates: true }).catch(() => {});

  let importedCount = 0;
  for (const drive of exportFile.data.trips) {
    if (existingIds.has(drive.id)) continue;

    persistNewDrive(drive.id, drive.startedAt, null);
    persistDriveDetails(drive.id, drive.name, drive.review);
    persistDriveEnded(drive.id, drive.endedAt);
    for (const point of drive.points) persistDrivePoint(drive.id, point);

    for (const pin of drive.pins) {
      const photoUri = `${PINS_DIR}${pin.id}.${pin.photoExtension}`;
      await FileSystem.writeAsStringAsync(photoUri, pin.photoBase64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      let thumbnailUri: string | undefined;
      if (pin.mediaType === "video" && pin.thumbnailBase64 && pin.thumbnailExtension) {
        thumbnailUri = `${PINS_DIR}${pin.id}-thumb.${pin.thumbnailExtension}`;
        await FileSystem.writeAsStringAsync(thumbnailUri, pin.thumbnailBase64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      persistDrivePin(drive.id, {
        id: pin.id,
        uri: photoUri,
        mediaType: pin.mediaType,
        thumbnailUri,
        coordinates: pin.coordinates,
        createdAt: pin.createdAt,
      });
    }

    for (const note of drive.notes) persistDriveNote(drive.id, note);

    importedCount += 1;
  }

  if (importedCount > 0) useDriveStore.getState().reloadFromDatabase();

  return { importedCount };
}
