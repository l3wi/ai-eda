/**
 * Library fetching and conversion tools for MCP
 * Manages a unified EDA-MCP library that accumulates components
 *
 * By default, components are stored in global KiCad library paths:
 * ~/Documents/KiCad/{version}/symbols/EDA-MCP.kicad_sym
 *
 * This matches kicad-sch-mcp's search pattern for automatic discovery.
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir, platform } from 'os';
import { easyedaClient } from '../api/easyeda.js';
import { symbolConverter } from '../converter/symbol.js';
import { footprintConverter } from '../converter/footprint.js';
import {
  ensureSymLibTable,
  ensureFpLibTable,
  getSymbolReference,
  getFootprintReference,
} from '../converter/lib-table.js';
import { ensureDir, writeText, writeBinary } from 'ai-eda-common';
import { join } from 'path';

// Library naming - matches kicad-sch-mcp search pattern
const LIBRARY_NAME = 'EDA-MCP';
const SYMBOL_LIBRARY_NAME = `${LIBRARY_NAME}.kicad_sym`;
const FOOTPRINT_LIBRARY_NAME = `${LIBRARY_NAME}.pretty`;
const MODELS_3D_NAME = `${LIBRARY_NAME}.3dshapes`;

// KiCad versions to check (newest first)
const KICAD_VERSIONS = ['9.0', '8.0'];

/**
 * Detect KiCad major version from existing user directories
 */
function detectKicadVersion(): string {
  const home = homedir();
  const baseDir = join(home, 'Documents', 'KiCad');

  for (const version of KICAD_VERSIONS) {
    if (existsSync(join(baseDir, version))) {
      return version;
    }
  }
  return '9.0'; // Default
}

/**
 * Get global library paths for the EDA-MCP library
 * These paths match kicad-sch-mcp's search pattern
 */
function getGlobalLibraryPaths(): {
  base: string;
  symbolsDir: string;
  footprintsDir: string;
  models3dDir: string;
  symbolFile: string;
  footprintDir: string;
  models3dFullDir: string;
} {
  const home = homedir();
  const version = detectKicadVersion();
  const base = join(home, 'Documents', 'KiCad', version);

  return {
    base,
    symbolsDir: join(base, 'symbols'),
    footprintsDir: join(base, 'footprints'),
    models3dDir: join(base, '3dmodels'),
    // Full paths to our specific library
    symbolFile: join(base, 'symbols', SYMBOL_LIBRARY_NAME),
    footprintDir: join(base, 'footprints', FOOTPRINT_LIBRARY_NAME),
    models3dFullDir: join(base, '3dmodels', MODELS_3D_NAME),
  };
}

/**
 * Get project-local library paths (legacy mode)
 */
function getProjectLibraryPaths(projectPath: string): {
  base: string;
  symbolsDir: string;
  footprintsDir: string;
  models3dDir: string;
  symbolFile: string;
  footprintDir: string;
  models3dFullDir: string;
} {
  const librariesDir = join(projectPath, 'libraries');

  return {
    base: librariesDir,
    symbolsDir: join(librariesDir, 'symbols'),
    footprintsDir: join(librariesDir, 'footprints'),
    models3dDir: join(librariesDir, '3dmodels'),
    symbolFile: join(librariesDir, 'symbols', SYMBOL_LIBRARY_NAME),
    footprintDir: join(librariesDir, 'footprints', FOOTPRINT_LIBRARY_NAME),
    models3dFullDir: join(librariesDir, '3dmodels', MODELS_3D_NAME),
  };
}

export const getSymbolKicadTool: Tool = {
  name: 'library_get_symbol',
  description: 'Get a KiCad-compatible symbol definition by LCSC part number. Returns the symbol in .kicad_sym format. LCSC is JLC PCB\'s preferred supplier for assembly.',
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number (e.g., C2040)',
      },
    },
    required: ['lcsc_id'],
  },
};

export const getFootprintKicadTool: Tool = {
  name: 'library_get_footprint',
  description: 'Get a KiCad-compatible footprint definition by LCSC part number. Returns the footprint in .kicad_mod format. LCSC is JLC PCB\'s preferred supplier for assembly.',
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number (e.g., C2040)',
      },
    },
    required: ['lcsc_id'],
  },
};

export const fetchLibraryTool: Tool = {
  name: 'library_fetch',
  description: `Fetch an LCSC component and add it to the EDA-MCP library.

Uses LCSC part numbers (e.g., C2040) because LCSC is JLC PCB's preferred supplier for assembly.
Components fetched via LCSC are guaranteed to be available for JLC PCBA service.

By default, saves to global KiCad library at ~/Documents/KiCad/{version}/symbols/EDA-MCP.kicad_sym.
This location is automatically discovered by kicad-sch-mcp (used by kicad-mcp).

Optionally specify project_path for project-local storage.

Returns symbol_ref and footprint_ref for immediate use with add_schematic_component.`,
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number (e.g., C2040, C17414)',
      },
      project_path: {
        type: 'string',
        description: 'Optional: Project path for local storage. If omitted, uses global KiCad library.',
      },
      include_3d: {
        type: 'boolean',
        description: 'Include 3D model if available (default: false)',
      },
    },
    required: ['lcsc_id'],  // project_path is now optional!
  },
};

export const get3DModelTool: Tool = {
  name: 'library_get_3d_model',
  description: 'Download a 3D model for a component. Requires the model UUID from component_get. Returns the model as base64-encoded STEP data.',
  inputSchema: {
    type: 'object',
    properties: {
      uuid: {
        type: 'string',
        description: '3D model UUID from component_get result',
      },
      format: {
        type: 'string',
        enum: ['step', 'obj'],
        description: 'Model format: "step" or "obj" (default: step)',
      },
    },
    required: ['uuid'],
  },
};

export const LibraryParamsSchema = z.object({
  lcsc_id: z.string().regex(/^C\d+$/, 'Invalid LCSC part number'),
});

export const FetchLibraryParamsSchema = z.object({
  lcsc_id: z.string().regex(/^C\d+$/, 'Invalid LCSC part number'),
  project_path: z.string().min(1).optional(),  // Optional - uses global if not provided
  include_3d: z.boolean().optional(),
});

export const Model3DParamsSchema = z.object({
  uuid: z.string().min(1),
  format: z.enum(['step', 'obj']).default('step'),
});

export async function handleGetSymbolKicad(args: unknown) {
  const params = LibraryParamsSchema.parse(args);

  const component = await easyedaClient.getComponentData(params.lcsc_id);

  if (!component) {
    return {
      content: [{
        type: 'text' as const,
        text: `Component ${params.lcsc_id} not found`,
      }],
      isError: true,
    };
  }

  const symbol = symbolConverter.convert(component);
  return {
    content: [{
      type: 'text' as const,
      text: symbol,
    }],
  };
}

export async function handleGetFootprintKicad(args: unknown) {
  const params = LibraryParamsSchema.parse(args);

  const component = await easyedaClient.getComponentData(params.lcsc_id);

  if (!component) {
    return {
      content: [{
        type: 'text' as const,
        text: `Component ${params.lcsc_id} not found`,
      }],
      isError: true,
    };
  }

  const footprint = footprintConverter.convert(component);
  return {
    content: [{
      type: 'text' as const,
      text: footprint,
    }],
  };
}

export async function handleFetchLibrary(args: unknown) {
  const params = FetchLibraryParamsSchema.parse(args);

  // Determine library location - global (default) or project-local
  const isGlobal = !params.project_path;
  const paths = isGlobal
    ? getGlobalLibraryPaths()
    : getProjectLibraryPaths(params.project_path!);

  // Fetch component data from EasyEDA
  const component = await easyedaClient.getComponentData(params.lcsc_id);

  if (!component) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: `Component ${params.lcsc_id} not found`,
          lcsc_id: params.lcsc_id,
        }),
      }],
      isError: true,
    };
  }

  // Ensure directories exist
  await ensureDir(paths.symbolsDir);
  await ensureDir(paths.footprintDir);

  // Handle unified symbol library
  const symbolName = symbolConverter.getSymbolName(component);

  let symbolContent: string;
  let symbolAction: 'created' | 'appended' | 'exists';

  if (existsSync(paths.symbolFile)) {
    // Read existing library
    const existingContent = await readFile(paths.symbolFile, 'utf-8');

    // Check if symbol already exists
    if (symbolConverter.symbolExistsInLibrary(existingContent, component.info.name)) {
      symbolAction = 'exists';
      symbolContent = existingContent;
    } else {
      // Append new symbol
      symbolContent = symbolConverter.appendToLibrary(existingContent, component);
      symbolAction = 'appended';
    }
  } else {
    // Create new library with this symbol
    symbolContent = symbolConverter.convert(component);
    symbolAction = 'created';
  }

  // Write symbol library if changed
  if (symbolAction !== 'exists') {
    await writeText(paths.symbolFile, symbolContent);
  }

  // Generate and save footprint (individual files in .pretty directory)
  const footprint = footprintConverter.convert(component);
  const footprintName = component.footprint.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + params.lcsc_id;
  const footprintPath = join(paths.footprintDir, `${footprintName}.kicad_mod`);
  await writeText(footprintPath, footprint);

  // Download 3D model if requested
  let modelPath: string | undefined;
  if (params.include_3d && component.model3d) {
    await ensureDir(paths.models3dFullDir);
    const model = await easyedaClient.get3DModel(component.model3d.uuid, 'step');
    if (model) {
      modelPath = join(paths.models3dFullDir, `${params.lcsc_id}.step`);
      await writeBinary(modelPath, model);
    }
  }

  // Update sym-lib-table and fp-lib-table (only for project-local mode)
  let symTableResult = null;
  let fpTableResult = null;
  if (!isGlobal && params.project_path) {
    symTableResult = await ensureSymLibTable(params.project_path, paths.symbolFile);
    fpTableResult = await ensureFpLibTable(params.project_path, paths.footprintDir);
  }

  // Generate references for immediate use
  const symbolRef = getSymbolReference(symbolName);
  const footprintRef = getFootprintReference(footprintName);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        lcsc_id: params.lcsc_id,
        storage_mode: isGlobal ? 'global' : 'project-local',
        symbol_name: symbolName,
        symbol_ref: symbolRef,
        footprint_ref: footprintRef,
        datasheet: component.info.datasheet || `https://www.lcsc.com/datasheet/lcsc_datasheet_${params.lcsc_id}.pdf`,
        files: {
          symbol_library: paths.symbolFile,
          footprint: footprintPath,
          model_3d: modelPath,
        },
        library_tables: isGlobal ? null : {
          sym_lib_table: symTableResult,
          fp_lib_table: fpTableResult,
        },
        symbol_action: symbolAction,
      }, null, 2),
    }],
  };
}

export async function handleGet3DModel(args: unknown) {
  const params = Model3DParamsSchema.parse(args);

  const model = await easyedaClient.get3DModel(params.uuid, params.format);

  if (!model) {
    return {
      content: [{
        type: 'text' as const,
        text: `3D model ${params.uuid} not found`,
      }],
      isError: true,
    };
  }

  return {
    content: [{
      type: 'text' as const,
      text: `3D model downloaded (${model.length} bytes, ${params.format.toUpperCase()} format)\n\nBase64 data:\n${model.toString('base64').slice(0, 500)}...`,
    }],
  };
}
