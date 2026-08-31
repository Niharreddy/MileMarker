import { z } from "zod";

/** Shown when starting a Trip — captured up front, before recording begins. */
export const startTripSchema = z.object({
  name: z.string().trim().min(1, "Give this trip a name"),
  dateLabel: z.string().trim().max(60, "Keep it short"),
});

export type StartTripFormValues = z.infer<typeof startTripSchema>;

/** Shown when stopping a Trip — lets the name/description be reviewed or adjusted before it's filed away. */
export const saveTripSchema = z.object({
  name: z.string().trim().min(1, "Give this trip a name"),
  review: z.string().trim().max(500, "Keep it under 500 characters"),
});

export type SaveTripFormValues = z.infer<typeof saveTripSchema>;
