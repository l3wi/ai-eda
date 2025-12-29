/**
 * Library fetching and conversion tools for MCP
 * Manages a unified LCSC library that accumulates components
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { easyedaClient } from '../api/easyeda.js';
import { symbolConverter } from '../converter/symbol.js';
import { footprintConverter } from '../converter/footprint.js';
import {
  ensureSymLibTable,
  ensureFpLibTable,
  getSymbolReference,
  getFootprintReference,
} from '../converter/lib-table.js';
import { ensureDir, writeText, writeBinary } from '@ai-eda/common';
import { join, dirname } from 'path';

const SYMBOL_LIBRARY_NAME = 'LCSC.kicad_sym';
const FOOTPRINT_LIBRARY_NAME = 'LCSC.pretty';

export const getSymbolKicadTool: Tool = {
  name: 'library_get_symbol',
  description: 'Get a KiCad-compatible symbol definition for a component. Returns the symbol in .kicad_sym format.',
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number',
      },
    },
    required: ['lcsc_id'],
  },
};

export const getFootprintKicadTool: Tool = {
  name: 'library_get_footprint',
  description: 'Get a KiCad-compatible footprint definition for a component. Returns the footprint in .kicad_mod format.',
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number',
      },
    },
    required: ['lcsc_id'],
  },
};

export const fetchLibraryTool: Tool = {
  name: 'library_fetch',
  description: `Fetch an LCSC component and add it to the project's unified LCSC library.
Creates LCSC.kicad_sym (symbols) and LCSC.pretty/ (footprints) in the libraries folder.
Automatically updates sym-lib-table and fp-lib-table.
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
        description: 'Path to the KiCad project directory (contains .kicad_pro file). Libraries will be created in <project_path>/libraries/',
      },
      include_3d: {
        type: 'boolean',
        description: 'Include 3D model if available (default: false)',
      },
    },
    required: ['lcsc_id', 'project_path'],
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
  project_path: z.string().min(1, 'Project path is required'),
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
  const projectPath = params.project_path;

  // Fetch component data from EasyEDA
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

  // Setup library paths
  const librariesDir = join(projectPath, 'libraries');
  const symbolsDir = join(librariesDir, 'symbols');
  const footprintsDir = join(librariesDir, 'footprints', FOOTPRINT_LIBRARY_NAME);
  const modelsDir = join(librariesDir, '3dmodels', 'LCSC.3dshapes');

  await ensureDir(symbolsDir);
  await ensureDir(footprintsDir);

  // Handle unified symbol library
  const symbolLibPath = join(symbolsDir, SYMBOL_LIBRARY_NAME);
  const symbolName = symbolConverter.getSymbolName(component);

  let symbolContent: string;
  let symbolAction: 'created' | 'appended' | 'exists';

  if (existsSync(symbolLibPath)) {
    // Read existing library
    const existingContent = await readFile(symbolLibPath, 'utf-8');

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
    await writeText(symbolLibPath, symbolContent);
  }

  // Generate and save footprint (individual files in .pretty directory)
  const footprint = footprintConverter.convert(component);
  const footprintName = component.footprint.name.replace(/[^a-zA-Z0-9_-]/g, '_') + '_' + params.lcsc_id;
  const footprintPath = join(footprintsDir, `${footprintName}.kicad_mod`);
  await writeText(footprintPath, footprint);

  // Download 3D model if requested
  let modelPath: string | undefined;
  if (params.include_3d && component.model3d) {
    await ensureDir(modelsDir);
    const model = await easyedaClient.get3DModel(component.model3d.uuid, 'step');
    if (model) {
      modelPath = join(modelsDir, `${params.lcsc_id}.step`);
      await writeBinary(modelPath, model);
    }
  }

  // Update sym-lib-table and fp-lib-table
  const symTableResult = await ensureSymLibTable(projectPath, symbolLibPath);
  const fpTableResult = await ensureFpLibTable(projectPath, join(librariesDir, 'footprints', FOOTPRINT_LIBRARY_NAME));

  // Generate references for immediate use
  const symbolRef = getSymbolReference(symbolName);
  const footprintRef = getFootprintReference(footprintName);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        lcsc_id: params.lcsc_id,
        symbol_name: symbolName,
        symbol_ref: symbolRef,
        footprint_ref: footprintRef,
        datasheet: component.info.datasheet || `https://www.lcsc.com/datasheet/lcsc_datasheet_${params.lcsc_id}.pdf`,
        files: {
          symbol_library: symbolLibPath,
          footprint: footprintPath,
          model_3d: modelPath,
        },
        library_tables: {
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
