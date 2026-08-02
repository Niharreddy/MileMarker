import { z } from "zod";

export const saveTripSchema = z.object({
  name: z.string().trim().min(1, "Give this trip a name"),
  review: z.string().trim().max(500, "Keep it under 500 characters"),
});

export type SaveTripFormValues = z.infer<typeof saveTripSchema>;
