import { OPENROUTER_API_KEY } from "astro:env/server";
import type { ChatCompletionParams, ChatCompletionResponse } from "@/types";
import {
  ConfigurationError,
  ApiError,
  ApiAuthenticationError,
  ApiBadRequestError,
  ApiRateLimitError,
  ApiServerError,
  NetworkError,
  ResponseParsingError,
} from "./errors";
import type { ZodType, ZodTypeDef } from "astro:schema";

/**
// ============================================================================
// Custom Error Classes removed - see ./errors.ts for definitions
// ============================================================================

// ============================================================================
// OpenRouter Service
// ============================================================================

/**
 * Service for interacting with the OpenRouter API
 *
 * This is a server-side only service that must never be exposed to the client.
 * All interactions with this service should happen through server-side code,
 * such as Astro API endpoints.
 *
 * @example
 * ```typescript
 * // In src/pages/api/extract-meal.ts
 * import { OpenRouterService } from '@/lib/services/OpenRouterService';
 *
 * try {
 *   const service = new OpenRouterService();
 *   const result = await service.chatCompletion({
 *     userMessage: "Extract meal info",
 *     jsonSchema: MealSchema,
 *   });
 * } catch (error) {
 *   if (error instanceof ConfigurationError) {
 *     // Handle config error
 *   }
 * }
 * ```
 */
export class OpenRouterService {
  private readonly defaultModel = "openai/gpt-4o-mini";
  private readonly defaultTemperature = 0.7;
  private readonly defaultMaxTokens = 2048;
  private readonly apiUrl = "https://openrouter.ai/api/v1/chat/completions";
  private readonly requestTimeout = 30000; // 30 seconds

  /**
   * Sends a chat completion request to OpenRouter and returns a parsed response
   *
   * @template T - The expected type of the parsed content when using jsonSchema
   * @param params - The chat completion parameters
   * @returns A promise resolving to the chat completion response
   * @throws {ConfigurationError} If the service is not properly configured
   * @throws {ApiAuthenticationError} If the API key is invalid
   * @throws {ApiBadRequestError} If the request parameters are invalid
   * @throws {ApiRateLimitError} If rate limit is exceeded
   * @throws {ApiServerError} If OpenRouter API returns a 5xx error
   * @throws {NetworkError} For network-level errors
   * @throws {ResponseParsingError} If response parsing fails
   */
  public async chatCompletion<T>(params: ChatCompletionParams<T>): Promise<ChatCompletionResponse<T>> {
    // Early validation of input parameters
    if (!params.userMessage || typeof params.userMessage !== "string") {
      throw new ApiBadRequestError("userMessage must be a non-empty string");
    }

    try {
      // Build the request
      const requestBody = this._buildRequest(params);

      // Send the request
      const response = await this._sendRequest(requestBody);

      // Parse the response
      return this._parseResponse(response, params.jsonSchema);
    } catch (error) {
      // Re-throw known error types as-is
      if (
        error instanceof ConfigurationError ||
        error instanceof ApiError ||
        error instanceof NetworkError ||
        error instanceof ResponseParsingError
      ) {
        throw error;
      }

      // Log unexpected errors for debugging
      // eslint-disable-next-line no-console
      console.error("Unexpected error in chatCompletion:", error);
      throw new ResponseParsingError("An unexpected error occurred during chat completion", error);
    }
  }

  /**
   * Builds the request body for the OpenRouter API
   *
   * @private
   * @param params - The chat completion parameters
   * @returns The formatted request body
   */
  private _buildRequest(params: ChatCompletionParams<unknown>): Record<string, unknown> {
    const messages: { role: string; content: string }[] = [];

    // Add system message if provided
    if (params.systemMessage) {
      messages.push({
        role: "system",
        content: params.systemMessage,
      });
    }

    // Add user message
    messages.push({
      role: "user",
      content: params.userMessage,
    });

    // Build base request object
    const body: Record<string, unknown> = {
      model: params.model || this.defaultModel,
      messages,
      temperature: params.temperature ?? this.defaultTemperature,
      max_tokens: params.maxTokens ?? this.defaultMaxTokens,
    };

    // Configure JSON schema if provided
    if (params.jsonSchema) {
      const schema = "parse" in params.jsonSchema ? zodToJsonSchema(params.jsonSchema) : params.jsonSchema;

      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "extracted_data",
          strict: true,
          schema,
        },
      };
    }

    return body;
  }

  /**
   * Sends an HTTP POST request to the OpenRouter API
   *
   * @private
   * @param body - The request body
   * @returns The parsed JSON response
   * @throws {ApiAuthenticationError} For 401 responses
   * @throws {ApiBadRequestError} For 400 responses
   * @throws {ApiRateLimitError} For 429 responses
   * @throws {ApiServerError} For 5xx responses
   * @throws {NetworkError} For network errors
   */
  private async _sendRequest(body: Record<string, unknown>): Promise<unknown> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      try {
        const response = await fetch(this.apiUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle HTTP error responses
        if (!response.ok) {
          return await this._handleErrorResponse(response);
        }

        // Parse successful response
        const data = await response.json();
        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Handle fetch errors (network issues, timeouts, etc.)
      if (error instanceof TypeError) {
        throw new NetworkError("Network error occurred while contacting OpenRouter API", error as Error);
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError(`Request timeout after ${this.requestTimeout}ms`);
      }

      // Re-throw known errors
      if (error instanceof ApiError || error instanceof NetworkError) {
        throw error;
      }

      // Wrap unexpected errors
      throw new NetworkError("Unexpected error during API request", error as Error);
    }
  }

  /**
   * Handles error responses from the OpenRouter API
   *
   * @private
   * @param response - The fetch response object
   * @throws {ApiAuthenticationError} For 401 responses
   * @throws {ApiBadRequestError} For 400 responses
   * @throws {ApiRateLimitError} For 429 responses
   * @throws {ApiServerError} For 5xx responses
   * @throws {ApiError} For other error responses
   */
  private async _handleErrorResponse(response: Response): Promise<never> {
    let errorData: unknown;

    try {
      errorData = await response.json();
    } catch {
      errorData = { error: response.statusText };
    }

    const errorMessage =
      typeof errorData === "object" &&
      errorData !== null &&
      "error" in errorData &&
      typeof (errorData as { error: unknown }).error === "object" &&
      (errorData as { error: { message?: string } }).error !== null &&
      "message" in (errorData as { error: { message?: string } }).error
        ? (errorData as { error: { message: string } }).error.message
        : typeof errorData === "object" && errorData !== null && "message" in errorData
          ? (errorData as { message: string }).message
          : response.statusText;

    switch (response.status) {
      case 401:
        throw new ApiAuthenticationError(`API authentication failed: ${errorMessage}`);

      case 400:
        throw new ApiBadRequestError(`Bad request: ${errorMessage}`, errorData);

      case 429:
        throw new ApiRateLimitError(`Rate limited: ${errorMessage}`, errorData);

      case 500:
      case 502:
      case 503:
      case 504:
        throw new ApiServerError(
          `OpenRouter API server error (${response.status}): ${errorMessage}`,
          response.status,
          errorData
        );

      default:
        throw new ApiError(`API request failed (${response.status}): ${errorMessage}`, response.status, errorData);
    }
  }

  /**
   * Parses and validates the API response content
   *
   * @private
   * @template T - The expected type of the parsed content
   * @param response - The raw API response
   * @param schema - Optional Zod schema or JSON Schema for validation
   * @returns The parsed and validated response
   * @throws {ResponseParsingError} If response parsing or validation fails
   */
  private _parseResponse<T>(response: unknown, schema?: unknown): ChatCompletionResponse<T> {
    // Validate response structure
    if (
      !response ||
      typeof response !== "object" ||
      !("choices" in response) ||
      !Array.isArray((response as { choices: unknown[] }).choices) ||
      (response as { choices: unknown[] }).choices.length === 0
    ) {
      throw new ResponseParsingError("Invalid response structure from OpenRouter API");
    }

    const responseObj = response as {
      choices: { message?: { content?: unknown } }[];
      model?: unknown;
      usage?: unknown;
    };
    const choice = responseObj.choices[0];

    if (!choice || !choice.message || typeof choice.message.content !== "string") {
      throw new ResponseParsingError("Missing or invalid message content in API response");
    }

    let content: T;

    try {
      // Parse JSON content
      content = JSON.parse(choice.message.content);
    } catch (error) {
      throw new ResponseParsingError("Failed to parse response content as JSON", error);
    }

    // Validate against schema if provided
    if (schema) {
      // Check if it's a Zod schema by looking for safeParse method
      if (typeof schema === "object" && schema !== null && "safeParse" in schema) {
        const zodSchema = schema as { safeParse: (data: unknown) => { success?: boolean; data?: T } };
        const validationResult = zodSchema.safeParse(content);

        if (
          validationResult &&
          typeof validationResult === "object" &&
          "success" in validationResult &&
          !validationResult.success
        ) {
          throw new ResponseParsingError("Response content does not match the provided schema", validationResult);
        }

        if (validationResult && typeof validationResult === "object" && "data" in validationResult) {
          content = validationResult.data as T;
        }
      }
    }

    // Validate response metadata
    if (typeof responseObj.model !== "string" || !responseObj.usage || typeof responseObj.usage !== "object") {
      throw new ResponseParsingError("Missing or invalid response metadata (model, usage)");
    }

    const usage = responseObj.usage as {
      prompt_tokens?: unknown;
      completion_tokens?: unknown;
      total_tokens?: unknown;
    };

    if (
      typeof usage.prompt_tokens !== "number" ||
      typeof usage.completion_tokens !== "number" ||
      typeof usage.total_tokens !== "number"
    ) {
      throw new ResponseParsingError("Invalid token usage information in response");
    }

    return {
      content,
      model: responseObj.model,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
      },
    };
  }
}

// Re-export error classes for convenience
export {
  ConfigurationError,
  ApiError,
  ApiAuthenticationError,
  ApiBadRequestError,
  ApiRateLimitError,
  ApiServerError,
  NetworkError,
  ResponseParsingError,
} from "./errors";
function zodToJsonSchema(jsonSchema: ZodType<unknown, ZodTypeDef, unknown>) {
  throw new Error("Function not implemented.");
}
