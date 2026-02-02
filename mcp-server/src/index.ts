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
  private apiKey: string;

  constructor(astroApiUrl: string, apiKey: string) {
    this.astroApiUrl = astroApiUrl;
    this.apiKey = apiKey;
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

      const astroApiConfig = {
        baseUrl: this.astroApiUrl,
        apiKey: this.apiKey,
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

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is required");
  }

  const server = new CaloriesTrackerMCPServer(astroApiUrl, apiKey);
  await server.init();
  await server.start();
}

// Start the server
main().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
