# OpenRouter Service Implementation Plan

## 1. Service Description

The `OpenRouterService` is a server-side TypeScript class designed to provide a robust, type-safe interface for interacting with the OpenRouter API. It encapsulates the complexities of request formatting, authentication, response parsing, and error handling. The primary goal of this service is to enable other parts of the application to easily leverage LLMs for chat completions, with first-class support for structured JSON responses using JSON schemas.

This service is designed to be a singleton or instantiated as needed within server-side contexts, such as Astro API endpoints. It must not be used or exposed on the client side to protect the API credentials.

## 2. Constructor Description

The service is initialized without any arguments. The constructor is responsible for loading and validating the necessary configuration from environment variables.

**`new OpenRouterService()`**

- **Behavior**:
  - Reads `OPENROUTER_API_KEY` and other optional settings from the environment.
  - Utilizes a configuration module with schema validation (e.g., Zod) to ensure that the required API key is present.
  - If the API key is missing or invalid, the constructor will throw a `ConfigurationError`, causing the application to fail fast. This prevents the service from running in an unconfigured state.

**Example Usage**:

```typescript
// In an Astro API endpoint: src/pages/api/chat.ts
import { OpenRouterService } from "@/lib/services/OpenRouterService";

try {
  const openRouterService = new OpenRouterService();
  // Service is ready to use
} catch (error) {
  console.error("Failed to initialize OpenRouterService:", error);
  // Handle initialization failure
}
```

## 3. Public Methods and Fields

The service exposes a single public method for performing chat completions.

### `async chatCompletion<T>(params: ChatCompletionParams<T>): Promise<ChatCompletionResponse<T>>`

- **Description**: Sends a request to the OpenRouter chat completions endpoint and returns a parsed, type-safe response.
- **Generics**:
  - `T`: An optional generic type that corresponds to the shape of the expected JSON object when a `jsonSchema` is provided. Defaults to `string` for standard text responses.
- **Parameters**:
  - `params`: `ChatCompletionParams<T>` - An object containing all parameters for the API call.

**`ChatCompletionParams<T>` Interface**:

```typescript
import type { JSONSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";

export interface ChatCompletionParams<T> {
  userMessage: string;
  systemMessage?: string;
  model?: string; // Overrides the default model
  temperature?: number; // Overrides the default temperature
  maxTokens?: number; // Overrides the default max_tokens
  jsonSchema?: ZodType<T> | JSONSchema; // A Zod schema or a raw JSON Schema object
}
```

- **Returns**: `Promise<ChatCompletionResponse<T>>`

**`ChatCompletionResponse<T>` Interface**:

```typescript
export interface ChatCompletionResponse<T> {
  content: T; // The parsed content. A string or a typed object if jsonSchema was used.
  model: string; // The model that generated the response.
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

## 4. Private Methods and Fields

- **`private readonly config`**: An object holding the validated configuration, including the API key and default model parameters.
- **`private async _buildRequest(params)`**: Takes the `ChatCompletionParams` and constructs the full request body JSON, including formatting the `messages` array and the `response_format` object if a `jsonSchema` is provided.
- **`private async _sendRequest(body)`**: A wrapper around `fetch` that sends the request to the OpenRouter API. It sets the required `Authorization` and `Content-Type` headers and handles non-2xx responses by throwing custom `ApiError` exceptions.
- **`private async _parseResponse(response, schema)`**: Parses the JSON response from the API. If a `jsonSchema` was provided in the request, this method uses it to validate the structure of the response content, ensuring type safety.

## 5. Error Handling

The service will implement a robust error handling strategy by defining and throwing custom error classes for different failure scenarios. This allows callers to handle specific errors gracefully.

- **`ConfigurationError`**: Thrown by the constructor if the `OPENROUTER_API_KEY` environment variable is not set.
- **`ApiAuthenticationError`**: Thrown for `401 Unauthorized` responses, indicating an invalid API key.
- **`ApiBadRequestError`**: Thrown for `400 Bad Request` responses, indicating a problem with the request payload (e.g., invalid model name).
- **`ApiRateLimitError`**: Thrown for `429 Too Many Requests` responses.
- **`ApiServerError`**: Thrown for `5xx` server-side errors from the API. The service may implement a retry-on-failure policy for these errors.
- **`NetworkError`**: Thrown for network-level issues (e.g., timeouts, DNS failures) when the `fetch` call fails.
- **`ResponseParsingError`**: Thrown if the API response is not valid JSON or if the content does not conform to the provided `jsonSchema`.

## 6. Security Considerations

- **API Key Management**: The `OPENROUTER_API_KEY` must be stored securely in an environment variable (`.env` file, which should be in `.gitignore`).
- **Server-Side Only**: This service must **never** be imported or used in client-side React or Astro components. All interactions with the service must happen through server-side code, such as Astro API endpoints. Exposing it to the client would leak the API key.
- **Input Validation**: While the service handles API interactions, the API endpoints that use this service should still validate and sanitize any user-provided input before passing it to the `userMessage` parameter to prevent prompt injection or other abuse.

## 7. Step-by-Step Implementation Plan

### Step 1: Configuration

1.  **Add `zod` and `zod-to-json-schema` to dependencies**:
    ```bash
    npm install zod zod-to-json-schema
    ```
2.  **Update Environment Variables**:
    Create a `.env` file in the project root (if it doesn't exist) and add your OpenRouter API key. Create a `.env.example` file to document the required variables.

    **.env.example**

    ```
    OPENROUTER_API_KEY="your_api_key_here"
    ```

### Step 2: Directory and File Structure

1.  Create the service file at the following location, as per project structure rules:
    `src/lib/services/OpenRouterService.ts`
2.  Define shared types in `src/types.ts`.

### Step 3: Type Definitions (`src/types.ts`)

Add the following interfaces to your shared types file.

```typescript
// src/types.ts

// ... existing types
import type { JSONSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";

// For OpenRouterService
export interface ChatCompletionParams<T = unknown> {
  userMessage: string;
  systemMessage?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  jsonSchema?: ZodType<T> | JSONSchema;
}

export interface ChatCompletionResponse<T> {
  content: T;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Step 4: Service Implementation (`src/lib/services/OpenRouterService.ts`)

Below is a skeleton implementation of the service. The developer should fill in the logic for each method.

```typescript
// src/lib/services/OpenRouterService.ts

import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import type { ChatCompletionParams, ChatCompletionResponse } from "@/types";

// Define Custom Errors
export class ConfigurationError extends Error {
  /* ... */
}
export class ApiError extends Error {
  /* ... */
}
// ... other custom error classes

// Environment Schema
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
});

export class OpenRouterService {
  private readonly apiKey: string;
  private readonly defaultModel = "openai/gpt-4o";

  constructor() {
    const parsedEnv = envSchema.safeParse(import.meta.env);
    if (!parsedEnv.success) {
      throw new ConfigurationError("Invalid environment variables: OPENROUTER_API_KEY is missing.");
    }
    this.apiKey = parsedEnv.data.OPENROUTER_API_KEY;
  }

  public async chatCompletion<T>(params: ChatCompletionParams<T>): Promise<ChatCompletionResponse<T>> {
    const requestBody = this._buildRequest(params);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // TODO: Implement specific ApiError handling based on status code
      throw new ApiError(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // TODO: Implement response parsing and validation
    const content = JSON.parse(data.choices[0].message.content);

    if (params.jsonSchema && "parse" in params.jsonSchema) {
      // It's a Zod schema, so we can parse and validate
      const validationResult = params.jsonSchema.safeParse(content);
      if (!validationResult.success) {
        // TODO: Throw ResponseParsingError
      }
      return {
        content: validationResult.data,
        model: data.model,
        usage: data.usage,
      };
    }

    return {
      content: content as T,
      model: data.model,
      usage: data.usage,
    };
  }

  private _buildRequest(params: ChatCompletionParams<unknown>): Record<string, any> {
    const messages = [];
    if (params.systemMessage) {
      messages.push({ role: "system", content: params.systemMessage });
    }
    messages.push({ role: "user", content: params.userMessage });

    const body: Record<string, any> = {
      model: params.model || this.defaultModel,
      messages,
    };

    if (params.jsonSchema) {
      const schema = "parse" in params.jsonSchema ? zodToJsonSchema(params.jsonSchema) : params.jsonSchema;

      body.response_format = {
        type: "json_schema",
        json_schema: {
          name: "extracted_data", // Or derive from schema
          strict: true,
          schema: schema,
        },
      };
    }

    // Add other optional parameters like temperature, maxTokens
    if (params.temperature) body.temperature = params.temperature;
    if (params.maxTokens) body.max_tokens = params.maxTokens;

    return body;
  }
}
```

### Step 5: Usage Example (Astro API Endpoint)

Create an API endpoint to demonstrate how to use the service.

**`src/pages/api/extract-meal.ts`**

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import { OpenRouterService } from "@/lib/services/OpenRouterService";
import { ConfigurationError } from "@/lib/services/OpenRouterService"; // Assuming errors are exported

const MealSchema = z.object({
  mealName: z.string().describe("The name of the meal, e.g., 'Scrambled eggs and toast'"),
  calories: z.number().describe("The estimated total calories for the meal"),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "Invalid input" }), { status: 400 });
    }

    const openRouterService = new OpenRouterService();

    const result = await openRouterService.chatCompletion({
      userMessage: `Extract the meal name and estimated calories from the following text: "${text}"`,
      systemMessage:
        "You are an expert nutrition data extractor. Respond only with the JSON object that matches the requested schema.",
      jsonSchema: MealSchema,
    });

    return new Response(JSON.stringify(result.content), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ConfigurationError) {
      console.error(error);
      return new Response(JSON.stringify({ error: "Server configuration error." }), { status: 500 });
    }
    // Handle other specific errors
    console.error(error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred." }), { status: 500 });
  }
};
```
