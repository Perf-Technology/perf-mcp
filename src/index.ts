#!/usr/bin/env node

/**
 * Perf MCP Server
 *
 * AI accuracy layer — intelligent model routing, hallucination detection,
 * schema validation, and output correction.
 *
 * Usage:
 *   PERF_API_KEY=pk_live_xxx npx perf-mcp
 *
 * Transport: stdio (default), for use with Claude Code, Cursor, Windsurf, etc.
 *
 * IMPORTANT: All logging goes to stderr. stdout is reserved for MCP JSON-RPC.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { PerfClient } from "./client.js";
import {
  TOOL_DEFINITIONS,
  chatSchema,
  verifySchema,
  validateSchema,
  correctSchema,
} from "./tools.js";
import { handleChat } from "./tools/chat.js";
import { handleVerify } from "./tools/verify.js";
import { handleValidate } from "./tools/validate.js";
import { handleCorrect } from "./tools/correct.js";

// =============================================================================
// Configuration
// =============================================================================

const API_KEY = process.env.PERF_API_KEY;
const BASE_URL = process.env.PERF_BASE_URL; // Optional override for testing

if (!API_KEY) {
  // stderr only — stdout is sacred for MCP
  console.error(
    "[perf-mcp] Error: PERF_API_KEY environment variable is required.\n" +
    "Get your API key at https://dashboard.withperf.pro\n" +
    "Set it in your MCP config:\n" +
    '  "env": { "PERF_API_KEY": "pk_live_xxx" }'
  );
  process.exit(1);
}

const client = new PerfClient({
  apiKey: API_KEY,
  baseUrl: BASE_URL,
});

// =============================================================================
// MCP Server
// =============================================================================

const server = new McpServer(
  {
    name: "perf-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Register all tools
const toolDefs = TOOL_DEFINITIONS;

server.tool(
  toolDefs[0].name,
  toolDefs[0].description,
  chatSchema.shape,
  async (args) => {
    try {
      const result = await handleChat(client, args);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[perf-mcp] perf_chat error: ${message}`);
      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  }
);

server.tool(
  toolDefs[1].name,
  toolDefs[1].description,
  verifySchema.shape,
  async (args) => {
    try {
      const result = await handleVerify(client, args);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[perf-mcp] perf_verify error: ${message}`);
      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  }
);

server.tool(
  toolDefs[2].name,
  toolDefs[2].description,
  validateSchema.shape,
  async (args) => {
    try {
      const result = await handleValidate(client, args);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[perf-mcp] perf_validate error: ${message}`);
      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  }
);

server.tool(
  toolDefs[3].name,
  toolDefs[3].description,
  correctSchema.shape,
  async (args) => {
    try {
      const result = await handleCorrect(client, args);
      return { content: [{ type: "text" as const, text: result }] };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[perf-mcp] perf_correct error: ${message}`);
      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Start
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[perf-mcp] Server started on stdio transport");
}

main().catch((err) => {
  console.error("[perf-mcp] Fatal error:", err);
  process.exit(1);
});
