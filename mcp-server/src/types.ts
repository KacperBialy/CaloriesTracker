import { z } from "zod";

/**
 * Zod schema for ProcessMealCommand input
 * Validates the text field for meal processing
 */
export const ProcessMealCommandSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Meal description cannot be empty")
    .max(1000, "Meal description cannot exceed 1000 characters"),
});

export type ProcessMealCommandType = z.infer<typeof ProcessMealCommandSchema>;

/**
 * Zod schema for ProcessResponseDto output
 * Represents the response from the /api/process endpoint
 */
export const ProcessResponseDtoSchema = z.object({
  successes: z.array(
    z.object({
      entryId: z.string().uuid(),
      productId: z.string().uuid(),
      name: z.string(),
      quantity: z.number(),
      nutrition: z.object({
        calories: z.number(),
        protein: z.number(),
        fat: z.number(),
        carbs: z.number(),
      }),
      consumedAt: z.string(),
    })
  ),
  errors: z.array(
    z.object({
      text: z.string(),
      message: z.string(),
    })
  ),
});

export type ProcessResponseDto = z.infer<typeof ProcessResponseDtoSchema>;

/**
 * Zod schema for DailySummaryDto output
 * Represents the response from the /api/summary/daily endpoint
 */
export const DailySummaryDtoSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  fat: z.number(),
  carbs: z.number(),
  goal: z.number().nullable(),
});

export type DailySummaryDto = z.infer<typeof DailySummaryDtoSchema>;

/**
 * Empty input schema for tools that don't require input
 */
export const EmptyInputSchema = z.object({});

export type EmptyInputType = z.infer<typeof EmptyInputSchema>;
