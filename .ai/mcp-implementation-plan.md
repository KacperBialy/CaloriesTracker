### MCP Server Implementation Plan

#### 1. Architecture Overview

The new architecture consists of two separate services:
1.  **Astro Project (Existing)**: The current application, which continues to handle UI, data storage, and core business logic via its API endpoints (`/api/process`, `/api/summary/daily`).
2.  **MCP Server (New)**: A new, standalone Node.js application responsible for exposing MCP tools. It will use the `@modelcontextprotocol/typescript-sdk` and will act as a proxy, translating MCP tool calls into standard HTTP requests to the Astro project's API.

This decoupled approach ensures that the core application logic remains independent of the MCP implementation.

#### 2. MCP Server Project Structure

A new directory, `mcp-server`, will be created at the root of the repository.

-   `mcp-server/`
    -   `package.json`: Defines dependencies, including `@modelcontextprotocol/sdk`, `express`, and `zod`.
    -   `tsconfig.json`: TypeScript configuration for the server.
    -   `src/`
        -   `index.ts`: The main entry point. It will initialize the Express app, configure the `McpServer`, and start listening for requests.
        -   `tools.ts`: Defines the MCP tools (`processProducts`, `getDailySummary`) and their `execute` logic.
        -   `types.ts`: Contains Zod schemas for tool inputs and outputs, ensuring type safety.

#### 3. Key Modules (MCP Server)

-   **`mcp-server/src/index.ts`**:
    -   Initializes an Express server to handle HTTP requests.
    -   Instantiates an `McpServer` from `@modelcontextprotocol/sdk`.
    -   Registers the tools defined in `tools.ts`.
    -   Uses `StreamableHTTPServerTransport` to handle the MCP communication over a single `/mcp` endpoint.
    -   The server will require an `Authorization` header containing the user's Supabase JWT on all incoming requests to securely proxy them to the Astro API.

-   **`mcp-server/src/tools.ts`**:
    -   This module will define and register the MCP tools.
    -   The `execute` function for each tool will be responsible for:
        1.  Receiving the tool input and the user's Supabase JWT from the server context.
        2.  Making a `fetch` call to the appropriate endpoint in the Astro application (e.g., `https://<your-astro-app>/api/process`).
        3.  Forwarding the user's JWT in the `Authorization` header of the `fetch` request.
        4.  Returning the JSON response from the Astro API, wrapped in the MCP-compliant structure.

#### 4. Tool/Resource/Prompt Definitions

-   **Tool: `processProducts`**
    -   **Description**: `Processes a natural language string describing a meal, identifies food items, and logs them for the authenticated user.`
    -   **Input Schema (Zod)**: `ProcessMealCommandSchema` from `mcp-server/src/types.ts`.
    -   **Output Schema (Zod)**: Will conform to the `ProcessResponseDto` returned by the Astro API.
    -   **`execute` Logic**:
        1.  Receives the validated `input` and the `supabaseToken`.
        2.  Sends a POST request to the Astro app's `/api/process` endpoint with the `input` as the JSON body.
        3.  Includes the `Authorization: Bearer ${supabaseToken}` header.
        4.  Parses the JSON response and returns the `content`.

-   **Tool: `getDailySummary`**
    -   **Description**: `Retrieves the authenticated user's aggregated nutritional summary for the current day.`
    -   **Input Schema (Zod)**: An empty object schema (`z.object({})`).
    -   **`execute` Logic**:
        1.  Receives the `supabaseToken`.
        2.  Sends a GET request to the Astro app's `/api/summary/daily` endpoint.
        3.  Includes the `Authorization: Bearer ${supabaseToken}` header.
        4.  Parses the JSON response and returns the `content`.

#### 5. Data Handling

-   The MCP server is stateless and does not interact with the database directly.
-   All data operations are delegated to the Astro application via secure HTTP API calls, ensuring a clear separation of concerns.

#### 6. Server and Deployment Configuration

-   **`McpServer` Configuration**:
    -   The `McpServer` instance in `mcp-server/src/index.ts` will be configured using `StreamableHTTPServerTransport` as recommended by the `@modelcontextprotocol/typescript-sdk`.
-   **Astro API Enhancement**:
    -   A new endpoint, `src/pages/api/summary/daily.ts`, must be created in the Astro project. It will use the `SummaryService` to fetch and return the user's daily summary.
-   **Deployment**:
    -   The MCP server is a standalone Node.js application and must be deployed separately from the Astro project (e.g., on services like Render, Fly.io, or a dedicated server).
    -   The existing Astro project deployment on Cloudflare Pages remains unchanged.
-   **Environment Variables / Secrets**:
    -   The MCP server will require a new environment variable, `ASTRO_API_URL`, to know where to send its requests.

#### 7. Error Handling

-   **Authentication Errors**: If an incoming request to the MCP server lacks a valid `Authorization` header, it will be rejected with an HTTP 401 status.
-   **Network Errors**: The `execute` logic for each tool will include `try...catch` blocks to handle network failures when communicating with the Astro API, returning appropriate MCP error responses.
-   **API Errors**: Errors from the Astro API (e.g., 4xx or 5xx status codes) will be caught and propagated back to the MCP client in a structured format.
-   **Tool-Level Errors**: Business logic errors (e.g., a food item not found) are handled by the Astro API and will be returned transparently through the MCP server as part of a successful (HTTP 200) response payload.
