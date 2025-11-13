import type { ProcessMealCommandType, ProcessResponseDto, DailySummaryDto } from "./types.js";
import { ProcessResponseDtoSchema, DailySummaryDtoSchema } from "./types.js";

/**
 * Configuration for making requests to the Astro API
 */
interface AstroApiConfig {
  baseUrl: string;
  supabaseToken: string;
}

/**
 * Makes a request to the Astro API with authentication
 */
async function fetchAstroApi<T>(endpoint: string, config: AstroApiConfig, options: RequestInit = {}): Promise<T> {
  const url = `${config.baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.supabaseToken}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new Error(`Astro API error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Tool: processProducts
 * Processes a natural language string describing a meal, identifies food items, and logs them for the authenticated user.
 */
export async function executeProcessProducts(
  input: ProcessMealCommandType,
  astroApiConfig: AstroApiConfig
): Promise<ProcessResponseDto> {
  try {
    const response = await fetchAstroApi<ProcessResponseDto>("/api/process", astroApiConfig, {
      method: "POST",
      body: JSON.stringify(input),
    });

    // Validate the response against the schema
    const validationResult = ProcessResponseDtoSchema.safeParse(response);
    if (!validationResult.success) {
      throw new Error(`Invalid response format from Astro API: ${validationResult.error.message}`);
    }

    return validationResult.data;
  } catch (error) {
    // Re-throw with context for better error handling
    if (error instanceof Error) {
      throw new Error(`Failed to process products: ${error.message}`);
    }
    throw new Error("Failed to process products: Unknown error occurred");
  }
}

/**
 * Tool: getDailySummary
 * Retrieves the authenticated user's aggregated nutritional summary for the current day.
 */
export async function executeGetDailySummary(astroApiConfig: AstroApiConfig): Promise<DailySummaryDto> {
  try {
    const response = await fetchAstroApi<DailySummaryDto>("/api/summary/daily", astroApiConfig, {
      method: "GET",
    });

    // Validate the response against the schema
    const validationResult = DailySummaryDtoSchema.safeParse(response);
    if (!validationResult.success) {
      throw new Error(`Invalid response format from Astro API: ${validationResult.error.message}`);
    }

    return validationResult.data;
  } catch (error) {
    // Re-throw with context for better error handling
    if (error instanceof Error) {
      throw new Error(`Failed to get daily summary: ${error.message}`);
    }
    throw new Error("Failed to get daily summary: Unknown error occurred");
  }
}
