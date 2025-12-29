/**
 * Library fetching and conversion tools for MCP
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { easyedaClient } from '../api/easyeda.js';
import { symbolConverter } from '../converter/symbol.js';
import { footprintConverter } from '../converter/footprint.js';
import { ensureDir, writeText, writeBinary } from '@ai-eda/common';
import { join } from 'path';

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
  description: 'Fetch and convert EasyEDA symbol+footprint to KiCad format. Saves files to the specified output directory.',
  inputSchema: {
    type: 'object',
    properties: {
      lcsc_id: {
        type: 'string',
        description: 'LCSC part number',
      },
      output_dir: {
        type: 'string',
        description: 'Output directory for library files (default: ./libraries)',
      },
      include_3d: {
        type: 'boolean',
        description: 'Include 3D model if available',
      },
    },
    required: ['lcsc_id'],
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
  output_dir: z.string().optional(),
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
  const outputDir = params.output_dir || './libraries';

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

  // Create output directories
  const symbolsDir = join(outputDir, 'symbols');
  const footprintsDir = join(outputDir, 'footprints', 'LCSC.pretty');
  const modelsDir = join(outputDir, '3dmodels', 'LCSC.3dshapes');

  await ensureDir(symbolsDir);
  await ensureDir(footprintsDir);

  // Generate and save symbol
  const symbol = symbolConverter.convert(component);
  const symbolPath = join(symbolsDir, `${params.lcsc_id}.kicad_sym`);
  await writeText(symbolPath, symbol);

  // Generate and save footprint
  const footprint = footprintConverter.convert(component);
  const footprintName = component.footprint.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const footprintPath = join(footprintsDir, `${footprintName}_${params.lcsc_id}.kicad_mod`);
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

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        lcsc_id: params.lcsc_id,
        files: {
          symbol: symbolPath,
          footprint: footprintPath,
          model_3d: modelPath,
        },
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
