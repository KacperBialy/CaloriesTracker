import "dotenv/config";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { executeProcessProducts, executeGetDailySummary } from "./tools.js";
import { ProcessMealCommandSchema, EmptyInputSchema } from "./types.js";

/**
 * Main MCP Server class
 * Handles initialization and tool registration
 */
class CaloriesTrackerMCPServer {
  private server: Server;
  private astroApiUrl: string;

  constructor(astroApiUrl: string) {
    this.astroApiUrl = astroApiUrl;
    this.server = new Server(
      {
        name: "calories-tracker-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
  }

  /**
   * Initialize the server and register all tools
   */
  async init(): Promise<void> {
    // Register processProducts tool
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "processProducts",
          description:
            "Processes a natural language string describing a meal, identifies food items, and logs them for the authenticated user.",
          inputSchema: {
            type: "object",
            properties: {
              text: {
                type: "string",
                description: "Raw meal description, e.g. 'chicken 200g and rice 100g'",
              },
            },
            required: ["text"],
          },
        },
        {
          name: "getDailySummary",
          description: "Retrieves the authenticated user's aggregated nutritional summary for the current day.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ],
    }));

    // Register tool execution handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      // Extract Supabase JWT from request context
      // Note: In a real implementation, this would come from the MCP client's context
      // For now, we'll need to handle this through the transport layer
      const supabaseToken = this.extractTokenFromContext(request);

      if (!supabaseToken) {
        throw new Error("Missing Authorization header: Supabase JWT required");
      }

      const astroApiConfig = {
        baseUrl: this.astroApiUrl,
        supabaseToken,
      };

      try {
        switch (name) {
          case "processProducts": {
            // Validate input
            const inputValidation = ProcessMealCommandSchema.safeParse(args);
            if (!inputValidation.success) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      error: "Invalid input",
                      details: inputValidation.error.errors,
                    }),
                  },
                ],
                isError: true,
              };
            }

            const result = await executeProcessProducts(inputValidation.data, astroApiConfig);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          case "getDailySummary": {
            // Validate input (should be empty object)
            const inputValidation = EmptyInputSchema.safeParse(args || {});
            if (!inputValidation.success) {
              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify({
                      error: "Invalid input",
                      details: inputValidation.error.errors,
                    }),
                  },
                ],
                isError: true,
              };
            }

            const result = await executeGetDailySummary(astroApiConfig);

            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(result),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : "Unknown error",
              }),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Extract Supabase JWT token from request context
   * The token should be passed in the request metadata under 'authorization' or 'supabaseToken'
   */
  private extractTokenFromContext(request: any): string | null {
    // Try to extract from metadata (MCP protocol supports metadata in requests)
    const metadata = (request as any).meta;
    if (metadata) {
      // Check for Authorization header in metadata
      const authHeader = metadata.authorization || metadata.Authorization;
      if (authHeader) {
        // Extract Bearer token if present
        if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
          return authHeader.substring(7);
        }
        return authHeader;
      }
      // Check for direct token in metadata
      if (metadata.supabaseToken) {
        return metadata.supabaseToken;
      }
    }

    // If using HTTP transport, token would come from Express request headers
    // This would be handled by Express middleware before reaching the MCP handler

    return null;
  }

  /**
   * Start the server with stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Calories Tracker MCP Server running on stdio");
  }
}

/**
 * Main entry point
 */
async function main() {
  const astroApiUrl = process.env.ASTRO_API_URL;
  if (!astroApiUrl) {
    throw new Error("ASTRO_API_URL environment variable is required");
  }

  const server = new CaloriesTrackerMCPServer(astroApiUrl);
  await server.init();
  await server.start();
}

// Start the server
main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
