/**
 * Library fetching and conversion tools for MCP
 * Manages category-based JLC-MCP libraries that accumulate components
 *
 * By default, components are stored in global KiCad 3rd party library paths:
 * ~/Documents/KiCad/{version}/3rdparty/jlc_mcp/symbols/JLC-MCP-Resistors.kicad_sym
 * ~/Documents/KiCad/{version}/3rdparty/jlc_mcp/symbols/JLC-MCP-Capacitors.kicad_sym
 * etc.
 *
 * Uses ${KICAD9_3RD_PARTY} environment variable for portable table entries.
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir, platform } from 'os';
import { easyedaClient } from '../api/easyeda.js';
import { jlcClient } from '../api/jlc.js';
import { symbolConverter } from '../converter/symbol.js';
import { footprintConverter } from '../converter/footprint.js';
import {
  ensureSymLibTable,
  ensureFpLibTable,
} from '../converter/lib-table.js';
import {
  getLibraryCategory,
  getLibraryFilename,
  getFootprintDirName,
  get3DModelsDirName,
  getSymbolReference as getCategorySymbolRef,
  getFootprintReference as getCategoryFootprintRef,
} from '../converter/category-router.js';
import { ensureDir, writeText, writeBinary } from '../common/index.js';
import { join } from 'path';

// Library naming - JLC-MCP prefix for all libraries
const FOOTPRINT_LIBRARY_NAME = getFootprintDirName();  // "JLC-MCP.pretty"
const MODELS_3D_NAME = get3DModelsDirName();           // "JLC-MCP.3dshapes"

// 3rd party library namespace (subfolder under 3rdparty/)
const LIBRARY_NAMESPACE = 'jlc_mcp';

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
 * Library paths structure (no longer includes symbolFile since it's category-based)
 */
interface LibraryPaths {
  base: string;
  symbolsDir: string;
  footprintsDir: string;
  models3dDir: string;
  footprintDir: string;
  models3dFullDir: string;
}

/**
 * Get global library paths for JLC-MCP libraries
 * Platform-specific paths matching where ${KICAD9_3RD_PARTY} resolves:
 * - macOS/Windows: ~/Documents/KiCad/{version}/3rdparty/jlc_mcp/
 * - Linux: ~/.local/share/kicad/{version}/3rdparty/jlc_mcp/
 */
function getGlobalLibraryPaths(): LibraryPaths {
  const home = homedir();
  const version = detectKicadVersion();
  const plat = platform();

  let base: string;
  if (plat === 'linux') {
    base = join(home, '.local', 'share', 'kicad', version, '3rdparty', LIBRARY_NAMESPACE);
  } else {
    base = join(home, 'Documents', 'KiCad', version, '3rdparty', LIBRARY_NAMESPACE);
  }

  return {
    base,
    symbolsDir: join(base, 'symbols'),
    footprintsDir: join(base, 'footprints'),
    models3dDir: join(base, '3dmodels'),
    footprintDir: join(base, 'footprints', FOOTPRINT_LIBRARY_NAME),
    models3dFullDir: join(base, '3dmodels', MODELS_3D_NAME),
  };
}

/**
 * Get project-local library paths
 */
function getProjectLibraryPaths(projectPath: string): LibraryPaths {
  const librariesDir = join(projectPath, 'libraries');

  return {
    base: librariesDir,
    symbolsDir: join(librariesDir, 'symbols'),
    footprintsDir: join(librariesDir, 'footprints'),
    models3dDir: join(librariesDir, '3dmodels'),
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
  description: `Fetch an LCSC component and add it to category-based JLC-MCP libraries.

Uses LCSC part numbers (e.g., C2040) because LCSC is JLC PCB's preferred supplier for assembly.
Components fetched via LCSC are guaranteed to be available for JLC PCBA service.

Components are routed to category-based libraries:
- JLC-MCP-Resistors.kicad_sym, JLC-MCP-Capacitors.kicad_sym, JLC-MCP-ICs.kicad_sym, etc.

For standard packages (0603, 0805, SOIC-8, etc.), uses KiCad built-in footprints.
Custom footprints are generated for non-standard packages.

By default, saves to global KiCad library at ~/Documents/KiCad/{version}/3rdparty/jlc_mcp/symbols/.
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

  // Enrich with JLC API data for rich component attributes
  // (Operating Temperature, Supply Voltage, PDF datasheet URL, etc.)
  try {
    const jlcDetails = await jlcClient.getComponentDetails(params.lcsc_id);
    if (jlcDetails) {
      // Copy PDF datasheet URL
      if (jlcDetails.datasheetPdf) {
        component.info.datasheetPdf = jlcDetails.datasheetPdf;
      }
      // Use JLC description if it's more detailed (not just the part name)
      if (jlcDetails.description && jlcDetails.description !== jlcDetails.name) {
        component.info.description = jlcDetails.description;
      }
      // Merge attributes
      if (jlcDetails.attributes) {
        component.info.attributes = {
          ...component.info.attributes,
          ...jlcDetails.attributes,
        };
      }
    }
  } catch {
    // JLC enrichment is optional - continue without it
  }

  // Determine component category for library routing
  const category = getLibraryCategory(
    component.info.prefix,
    component.info.category,
    component.info.description
  );

  // Get category-specific symbol library path
  const symbolLibraryFilename = getLibraryFilename(category);
  const symbolFile = join(paths.symbolsDir, symbolLibraryFilename);

  // Ensure directories exist
  await ensureDir(paths.symbolsDir);
  await ensureDir(paths.footprintDir);

  // Determine footprint FIRST (needed for symbol generation)
  const footprintResult = footprintConverter.getFootprint(component);
  let footprintPath: string | undefined;
  let footprintRef: string;

  if (footprintResult.type === 'reference') {
    // Use KiCad standard footprint
    footprintRef = footprintResult.reference!;
  } else {
    // Custom footprint - will be saved later
    const footprintName = footprintResult.name + '_' + params.lcsc_id;
    footprintPath = join(paths.footprintDir, `${footprintName}.kicad_mod`);
    footprintRef = getCategoryFootprintRef(footprintName);
  }

  // Update component info with full footprint reference (including library prefix)
  component.info.package = footprintRef;

  // Handle category-based symbol library
  const symbolName = symbolConverter.getSymbolName(component);

  let symbolContent: string;
  let symbolAction: 'created' | 'appended' | 'exists';

  if (existsSync(symbolFile)) {
    // Read existing library
    const existingContent = await readFile(symbolFile, 'utf-8');

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
    await writeText(symbolFile, symbolContent);
  }

  // Write custom footprint if needed (footprintResult determined earlier)
  if (footprintResult.type === 'generated' && footprintPath) {
    await writeText(footprintPath, footprintResult.content!);
  }

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
    symTableResult = await ensureSymLibTable(params.project_path, symbolFile);
    fpTableResult = await ensureFpLibTable(params.project_path, paths.footprintDir);
  }

  // Generate symbol reference with category
  const symbolRef = getCategorySymbolRef(category, symbolName);

  // Build validation data for Claude to analyze
  const validationData = {
    component: {
      name: component.info.name,
      description: component.info.description,
      package: component.info.package,
      manufacturer: component.info.manufacturer,
      datasheet_url: component.info.datasheetPdf || component.info.datasheet,
    },
    symbol: {
      pin_count: component.symbol.pins.length,
      pins: component.symbol.pins.map(p => ({
        number: p.number,
        name: p.name,
        electrical_type: p.electricalType,
      })),
    },
    footprint: {
      type: component.footprint.type,
      pad_count: component.footprint.pads.length,
      // Only include pads for custom-generated footprints
      pads: footprintResult.type === 'generated'
        ? component.footprint.pads.map(p => ({
            number: p.number,
            shape: p.shape,
          }))
        : null,  // Skip for KiCad standard refs
      is_kicad_standard: footprintResult.type === 'reference',
      kicad_ref: footprintRef,
    },
    checks: {
      pin_pad_count_match: component.symbol.pins.length === component.footprint.pads.length,
      has_power_pins: component.symbol.pins.some(p =>
        p.electricalType === 'power_in' || p.electricalType === 'power_out'
      ),
      has_ground_pins: component.symbol.pins.some(p =>
        p.name.toLowerCase().includes('gnd') || p.name.toLowerCase().includes('vss')
      ),
    },
  };

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        lcsc_id: params.lcsc_id,
        storage_mode: isGlobal ? 'global' : 'project-local',
        category,
        symbol_name: symbolName,
        symbol_ref: symbolRef,
        footprint_ref: footprintRef,
        footprint_type: footprintResult.type,  // 'reference' or 'generated'
        datasheet: component.info.datasheet || `https://www.lcsc.com/datasheet/lcsc_datasheet_${params.lcsc_id}.pdf`,
        files: {
          symbol_library: symbolFile,
          footprint: footprintPath,  // undefined if using KiCad standard
          model_3d: modelPath,
        },
        library_tables: isGlobal ? null : {
          sym_lib_table: symTableResult,
          fp_lib_table: fpTableResult,
        },
        symbol_action: symbolAction,
        validation_data: validationData,
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
