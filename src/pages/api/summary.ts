import type { APIRoute } from "astro";
import { z } from "zod";
import type { DailySummaryDto } from "../../types";
import { isValidIsoDate } from "../../lib/utils";
import { getDailySummary } from "@/lib/services/SummaryService";

export const prerender = false;

// Define and validate query parameters
const GetSummaryQuerySchema = z.object({
  date: z
    .string()
    .optional()
    .refine((str) => !str || isValidIsoDate(str), { message: "Invalid date format, expected YYYY-MM-DD" }),
});

export const GET: APIRoute = async ({ request, locals }) => {
  // Parse and validate query parameters
  const url = new URL(request.url);
  const parseResult = GetSummaryQuerySchema.safeParse({
    date: url.searchParams.get("date") ?? undefined,
  });

  if (!parseResult.success) {
    return new Response(JSON.stringify({ error: parseResult.error.flatten() }), { status: 400 });
  }

  const { date } = parseResult.data;

  if (!locals.supabase || !locals.user) {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }

  try {
    const summary: DailySummaryDto = await getDailySummary(locals.supabase, locals.user.id, date);
    return new Response(JSON.stringify(summary), { status: 200 });
  } catch {
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
