/**
 * MCP tool definitions and handlers for KiCad MCP server
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

// Import tools
import {
  checkInstallationTool,
  createProjectTool,
  listProjectsTool,
  getProjectInfoTool,
  handleCheckInstallation,
  handleCreateProject,
  handleListProjects,
  handleGetProjectInfo,
} from './project.js';

import {
  exportGerbersTool,
  exportDrillsTool,
  exportBomTool,
  exportPositionTool,
  exportStepTool,
  exportSchematicPdfTool,
  handleExportGerbers,
  handleExportDrills,
  handleExportBom,
  handleExportPosition,
  handleExportStep,
  handleExportSchematicPdf,
} from './export.js';

import {
  runDrcTool,
  runErcTool,
  handleRunDrc,
  handleRunErc,
} from './drc.js';

// Export all tool definitions
export const tools: Tool[] = [
  // Project management
  checkInstallationTool,
  createProjectTool,
  listProjectsTool,
  getProjectInfoTool,
  // Export
  exportGerbersTool,
  exportDrillsTool,
  exportBomTool,
  exportPositionTool,
  exportStepTool,
  exportSchematicPdfTool,
  // DRC/ERC
  runDrcTool,
  runErcTool,
];

// Tool handler map
export const toolHandlers: Record<string, (args: unknown) => Promise<{
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}>> = {
  // Project management
  kicad_check_installation: handleCheckInstallation,
  kicad_create_project: handleCreateProject,
  kicad_list_projects: handleListProjects,
  kicad_get_project_info: handleGetProjectInfo,
  // Export
  kicad_export_gerbers: handleExportGerbers,
  kicad_export_drills: handleExportDrills,
  kicad_export_bom: handleExportBom,
  kicad_export_position: handleExportPosition,
  kicad_export_step: handleExportStep,
  kicad_export_schematic_pdf: handleExportSchematicPdf,
  // DRC/ERC
  kicad_run_drc: handleRunDrc,
  kicad_run_erc: handleRunErc,
};
