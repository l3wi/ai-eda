/**
 * Component search tools for MCP
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { lcscClient } from '../api/lcsc.js';

export const searchComponentsTool: Tool = {
  name: 'component_search',
  description: 'Search the LCSC component database by keyword. Returns a list of matching components with their LCSC IDs, prices, and stock levels.',
  inputSchema: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query (e.g., "ESP32", "STM32F103", "0805 100nF")',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 10, max: 50)',
      },
      in_stock: {
        type: 'boolean',
        description: 'Only show in-stock items',
      },
    },
    required: ['query'],
  },
};

export const SearchParamsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().min(1).max(50).default(10),
  in_stock: z.boolean().optional(),
});

export async function handleSearchComponents(args: unknown) {
  const params = SearchParamsSchema.parse(args);

  const results = await lcscClient.search(params.query, {
    limit: params.limit,
    inStock: params.in_stock,
  });

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(results, null, 2),
    }],
  };
}
