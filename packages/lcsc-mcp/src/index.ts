#!/usr/bin/env node

/**
 * @ai-eda/lcsc-mcp
 * MCP server for LCSC/EasyEDA component sourcing and library conversion
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools, toolHandlers } from './tools/index.js';
import { createLogger } from '@ai-eda/common';

const logger = createLogger('lcsc-mcp');

// Create MCP server
const server = new Server(
  {
    name: '@ai-eda/lcsc-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  logger.debug('Listing tools');
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  logger.debug(`Tool call: ${name}`, args);

  const handler = toolHandlers[name];

  if (!handler) {
    return {
      content: [{ type: 'text', text: `Unknown tool: ${name}` }],
      isError: true,
    };
  }

  try {
    return await handler(args);
  } catch (error) {
    logger.error(`Tool error: ${name}`, error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
});

// Run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  logger.info('LCSC MCP server running on stdio');
}

main().catch((error) => {
  logger.error('Server error', error);
  process.exit(1);
});
