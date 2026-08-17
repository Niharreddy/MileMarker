import { z } from "zod";

export const saveTripSchema = z.object({
  name: z.string().trim().min(1, "Give this trip a name"),
  review: z.string().trim().max(500, "Keep it under 500 characters"),
});

export type SaveTripFormValues = z.infer<typeof saveTripSchema>;

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
});

const exportedNoteSchema = z.object({
  id: z.string(),
  text: z.string(),
  coordinates: coordinatesSchema,
  createdAt: z.number(),
});

const exportedTripSchema = z.object({
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
  trips: z.array(exportedTripSchema),
});

export type ExportFile = z.infer<typeof exportFileSchema>;
export type ExportedTrip = z.infer<typeof exportedTripSchema>;
export type ExportedPin = z.infer<typeof exportedPinSchema>;
export type ExportedNote = z.infer<typeof exportedNoteSchema>;
