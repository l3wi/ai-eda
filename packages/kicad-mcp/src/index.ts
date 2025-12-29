#!/usr/bin/env node

/**
 * @ai-eda/kicad-mcp
 * MCP server for KiCad automation - schematic capture, PCB layout, and export
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools, toolHandlers } from './tools/index.js';
import { createLogger } from '@ai-eda/common';

const logger = createLogger('kicad-mcp');

// Create MCP server
const server = new Server(
  {
    name: '@ai-eda/kicad-mcp',
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
  logger.info('KiCad MCP server running on stdio');
}

main().catch((error) => {
  logger.error('Server error', error);
  process.exit(1);
});
