import { z } from "zod";

export const saveDriveSchema = z.object({
  name: z.string().trim().min(1, "Give this drive a name"),
  review: z.string().trim().max(500, "Keep it under 500 characters"),
});

export type SaveDriveFormValues = z.infer<typeof saveDriveSchema>;

const coordinatesSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
});

const exportedPinSchema = z.object({
  id: z.string(),
  coordinates: coordinatesSchema,
  createdAt: z.number(),
  photoBase64: z.string(),
  photoExtension: z.string(),
  // Older export files predate video support and have neither field — default to "photo".
  mediaType: z.enum(["photo", "video"]).default("photo"),
  thumbnailBase64: z.string().optional(),
  thumbnailExtension: z.string().optional(),
});

const exportedNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  coordinates: coordinatesSchema,
  createdAt: z.number(),
});

// Field name stays "trips" (a Drive was called a Trip pre-bundles) so JSON
// files exported before Trip bundles existed still import correctly.
const exportedDriveSchema = z.object({
  id: z.string(),
  name: z.string(),
  review: z.string(),
  startedAt: z.number(),
  endedAt: z.number(),
  points: z.array(z.object({ latitude: z.number(), longitude: z.number(), timestamp: z.number() })),
  pins: z.array(exportedPinSchema),
  notes: z.array(exportedNoteSchema),
});

/** Shape of a Mile Marker data-export file, validated on import before touching the database. */
export const exportFileSchema = z.object({
  schemaVersion: z.literal(1),
  exportedAt: z.number(),
  trips: z.array(exportedDriveSchema),
});

export type ExportFile = z.infer<typeof exportFileSchema>;
export type ExportedDrive = z.infer<typeof exportedDriveSchema>;
export type ExportedPin = z.infer<typeof exportedPinSchema>;
export type ExportedNote = z.infer<typeof exportedNoteSchema>;
