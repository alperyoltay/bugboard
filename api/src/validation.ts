import { z } from "zod";
import { SEVERITIES, STATUSES } from "./types";

const text = (max: number) => z.string().trim().max(max);

export const newBugSchema = z.object({
  title: text(120).min(3, "title must be at least 3 characters"),
  description: text(5000).default(""),
  stepsToReproduce: text(5000).default(""),
  severity: z.enum(SEVERITIES).default("medium"),
});

export const bugUpdateSchema = z
  .object({
    title: text(120).min(3),
    description: text(5000),
    stepsToReproduce: text(5000),
    severity: z.enum(SEVERITIES),
    status: z.enum(STATUSES),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "at least one field is required");

export const filterSchema = z.object({
  status: z.enum(STATUSES).optional(),
  severity: z.enum(SEVERITIES).optional(),
  q: text(100).optional(),
});

export const idSchema = z.coerce.number().int().positive();
