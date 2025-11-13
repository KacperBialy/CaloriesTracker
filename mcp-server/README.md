# Calories Tracker MCP Server

MCP (Model Context Protocol) server for the Calories Tracker application. This server acts as a proxy, translating MCP tool calls into HTTP requests to the Astro application's API.

## Project Structure

```
mcp-server/
├── src/
│   ├── index.ts      # Main server entry point
│   ├── tools.ts      # Tool definitions and execute functions
│   └── types.ts      # Zod schemas and TypeScript types
├── package.json
├── tsconfig.json
└── README.md
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set environment variables:
```bash
export ASTRO_API_URL=https://your-astro-app.com
```

3. Build the project:
```bash
npm run build
```

4. Run the server:
```bash
npm start
```

## Tools

### processProducts
Processes a natural language string describing a meal, identifies food items, and logs them for the authenticated user.

**Input:**
```json
{
  "text": "chicken 200g and rice 100g"
}
```

**Output:**
```json
{
  "successes": [...],
  "errors": [...]
}
```

### getDailySummary
Retrieves the authenticated user's aggregated nutritional summary for the current day.

**Input:** `{}` (empty object)

**Output:**
```json
{
  "calories": 1500,
  "protein": 100,
  "fat": 50,
  "carbs": 200,
  "goal": 2000
}
```

## Authentication

The server requires a Supabase JWT token to be passed with each request. The token is forwarded to the Astro API in the `Authorization` header.

**Note:** The current implementation uses stdio transport. For HTTP transport with Express (as mentioned in the plan), additional implementation is needed to extract the Authorization header from HTTP requests.

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

