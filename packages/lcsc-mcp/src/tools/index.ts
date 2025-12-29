/**
 * MCP tool definitions and handlers for LCSC MCP server
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import tools
import { searchComponentsTool, handleSearchComponents } from './search.js';
import { getComponentTool, handleGetComponent } from './details.js';
import {
  getSymbolKicadTool,
  getFootprintKicadTool,
  fetchLibraryTool,
  get3DModelTool,
  handleGetSymbolKicad,
  handleGetFootprintKicad,
  handleFetchLibrary,
  handleGet3DModel,
} from './library.js';

// Export all tool definitions
export const tools: Tool[] = [
  searchComponentsTool,
  getComponentTool,
  getSymbolKicadTool,
  getFootprintKicadTool,
  fetchLibraryTool,
  get3DModelTool,
];

// Tool handler map
export const toolHandlers: Record<string, (args: unknown) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}>> = {
  component_search: handleSearchComponents,
  component_get: handleGetComponent,
  library_get_symbol: handleGetSymbolKicad,
  library_get_footprint: handleGetFootprintKicad,
  library_fetch: handleFetchLibrary,
  library_get_3d_model: handleGet3DModel,
};

// Re-export individual tools
export { searchComponentsTool, handleSearchComponents } from './search.js';
export { getComponentTool, handleGetComponent } from './details.js';
export {
  getSymbolKicadTool,
  getFootprintKicadTool,
  fetchLibraryTool,
  get3DModelTool,
  handleGetSymbolKicad,
  handleGetFootprintKicad,
  handleFetchLibrary,
  handleGet3DModel,
} from './library.js';
