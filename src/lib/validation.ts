import { z } from "zod";

export const STATUSES = ["NEW", "CONTACTED", "REPLIED", "MEETING_SCHEDULED", "CLOSED"] as const;

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  company: z.string().trim().max(120).optional().nullable().transform((v) => v || null),
  email: z.string().trim().email("Enter a valid email address").max(200),
  event: z.string().trim().min(1, "Event is required").max(160),
  notes: z.string().max(5000).default(""),
  status: z.enum(STATUSES).default("NEW"),
});

// PATCH accepts any subset of fields
export const leadPatchSchema = leadSchema.partial();

export type LeadInput = z.infer<typeof leadSchema>;
