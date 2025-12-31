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
import { easyedaCommunityClient } from '../api/easyeda-community.js';
import { jlcClient } from '../api/jlc.js';
import type { EasyEDACommunityComponent, EasyEDAComponentData } from '../common/index.js';
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
  description: `Fetch a component and add it to KiCad libraries.

Accepts:
- LCSC part numbers (e.g., C2040) → global JLC-MCP libraries
- EasyEDA UUIDs (e.g., 8007c710c0b9406db963b55df6990340) → project-local EasyEDA library (requires project_path)

LCSC components are routed to category-based global libraries:
- JLC-MCP-Resistors.kicad_sym, JLC-MCP-Capacitors.kicad_sym, JLC-MCP-ICs.kicad_sym, etc.
- Stored at ~/Documents/KiCad/{version}/3rdparty/jlc_mcp/

EasyEDA community components are stored project-locally:
- <project>/libraries/symbols/EasyEDA.kicad_sym
- <project>/libraries/footprints/EasyEDA.pretty/

Returns symbol_ref and footprint_ref for immediate use with add_schematic_component.`,
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'LCSC part number (e.g., C2040) or EasyEDA community UUID',
      },
      project_path: {
        type: 'string',
        description: 'Project path (required for EasyEDA UUIDs, optional for LCSC IDs)',
      },
      include_3d: {
        type: 'boolean',
        description: 'Include 3D model if available (default: false for LCSC, true for EasyEDA)',
      },
    },
    required: ['id'],
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
  id: z.string().min(1),  // LCSC ID (C2040) or EasyEDA UUID
  project_path: z.string().min(1).optional(),  // Optional - uses global if not provided
  include_3d: z.boolean().optional(),
});

/**
 * Check if ID is an LCSC part number (C followed by digits)
 */
function isLcscId(id: string): boolean {
  return /^C\d+$/.test(id);
}

/**
 * Adapt EasyEDACommunityComponent to EasyEDAComponentData for converters
 */
function adaptCommunityComponent(
  component: EasyEDACommunityComponent
): EasyEDAComponentData {
  // Get component parameters from head
  const symbolHead = component.symbol.head as Record<string, unknown> | undefined;
  const cPara = (symbolHead?.c_para as Record<string, string>) || {};

  return {
    info: {
      name: component.title,
      prefix: cPara.pre || 'U',
      package: component.footprint.name,
      manufacturer: cPara.Manufacturer || cPara.BOM_Manufacturer,
      datasheet: cPara.link,
      lcscId: undefined, // Community components don't have LCSC IDs
      jlcId: undefined,
    },
    symbol: {
      pins: component.symbol.pins,
      rectangles: component.symbol.rectangles,
      circles: component.symbol.circles,
      ellipses: component.symbol.ellipses,
      arcs: component.symbol.arcs,
      polylines: component.symbol.polylines,
      polygons: component.symbol.polygons,
      paths: component.symbol.paths,
      origin: component.symbol.origin,
    },
    footprint: {
      name: component.footprint.name,
      type: component.footprint.type,
      pads: component.footprint.pads,
      tracks: component.footprint.tracks,
      holes: component.footprint.holes,
      circles: component.footprint.circles,
      arcs: component.footprint.arcs,
      rects: component.footprint.rects,
      texts: component.footprint.texts,
      vias: component.footprint.vias,
      origin: component.footprint.origin,
    },
    model3d: component.model3d,
    rawData: component.rawData,
  };
}

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

// EasyEDA community library naming (project-local)
const EASYEDA_SYMBOL_LIBRARY_NAME = 'EasyEDA.kicad_sym';
const EASYEDA_FOOTPRINT_LIBRARY_NAME = 'EasyEDA.pretty';
const EASYEDA_LIBRARY_NAME = 'EasyEDA';
const EASYEDA_LIBRARY_DESCRIPTION = 'EasyEDA Community Component Library';

export async function handleFetchLibrary(args: unknown) {
  const params = FetchLibraryParamsSchema.parse(args);
  const isCommunityComponent = !isLcscId(params.id);

  // Community components require project_path (stored locally, not in global JLC-MCP)
  if (isCommunityComponent && !params.project_path) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: 'EasyEDA community components require project_path for local storage',
          id: params.id,
          hint: 'Provide project_path to store in <project>/libraries/EasyEDA.*',
        }),
      }],
      isError: true,
    };
  }

  // Determine library location
  // - LCSC: global (default) or project-local if project_path provided
  // - Community: always project-local (validated above)
  const isGlobal = !isCommunityComponent && !params.project_path;
  const paths = isGlobal
    ? getGlobalLibraryPaths()
    : getProjectLibraryPaths(params.project_path!);

  // Fetch component data - detect ID type and use appropriate client
  let component: EasyEDAComponentData | null = null;

  if (isLcscId(params.id)) {
    // LCSC ID - use official EasyEDA/LCSC API
    component = await easyedaClient.getComponentData(params.id);
  } else {
    // UUID - use EasyEDA community API
    const communityComponent = await easyedaCommunityClient.getComponent(params.id);
    if (communityComponent) {
      component = adaptCommunityComponent(communityComponent);
    }
  }

  if (!component) {
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          success: false,
          error: `Component ${params.id} not found`,
          id: params.id,
          source: isCommunityComponent ? 'easyeda_community' : 'lcsc',
        }),
      }],
      isError: true,
    };
  }

  // Enrich with JLC API data for rich component attributes (LCSC components only)
  // (Operating Temperature, Supply Voltage, PDF datasheet URL, etc.)
  if (!isCommunityComponent) {
    try {
      const jlcDetails = await jlcClient.getComponentDetails(params.id);
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
  }

  // Branch based on component source - different library structures
  let symbolFile: string;
  let symbolName: string;
  let symbolRef: string;
  let footprintPath: string | undefined;
  let footprintRef: string;
  let footprintDir: string;
  let models3dDir: string;
  let category: string | undefined;
  let symTableResult = null;
  let fpTableResult = null;

  if (isCommunityComponent) {
    // EasyEDA community component → project-local EasyEDA library
    const librariesDir = join(params.project_path!, 'libraries');
    const symbolsDir = join(librariesDir, 'symbols');
    footprintDir = join(librariesDir, 'footprints', EASYEDA_FOOTPRINT_LIBRARY_NAME);
    models3dDir = join(librariesDir, '3dmodels', 'EasyEDA.3dshapes');

    await ensureDir(symbolsDir);
    await ensureDir(footprintDir);

    // Symbol library path
    symbolFile = join(symbolsDir, EASYEDA_SYMBOL_LIBRARY_NAME);
    symbolName = component.info.name.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Footprint - always generate custom for community components
    const footprint = footprintConverter.convert(component, { libraryName: EASYEDA_LIBRARY_NAME });
    footprintPath = join(footprintDir, `${symbolName}.kicad_mod`);
    footprintRef = `${EASYEDA_LIBRARY_NAME}:${symbolName}`;
    await writeText(footprintPath, footprint);

    // Update component info
    component.info.package = footprintRef;

    // Update lib tables
    symTableResult = await ensureSymLibTable(
      params.project_path!,
      symbolFile,
      EASYEDA_LIBRARY_NAME,
      EASYEDA_LIBRARY_DESCRIPTION
    );
    fpTableResult = await ensureFpLibTable(
      params.project_path!,
      footprintDir,
      EASYEDA_LIBRARY_NAME,
      EASYEDA_LIBRARY_DESCRIPTION
    );

    // Symbol reference
    symbolRef = `${EASYEDA_LIBRARY_NAME}:${symbolName}`;
  } else {
    // LCSC component → JLC-MCP category-based library (global or project-local)
    category = getLibraryCategory(
      component.info.prefix,
      component.info.category,
      component.info.description
    );

    const symbolLibraryFilename = getLibraryFilename(category);
    symbolFile = join(paths.symbolsDir, symbolLibraryFilename);
    footprintDir = paths.footprintDir;
    models3dDir = paths.models3dFullDir;

    await ensureDir(paths.symbolsDir);
    await ensureDir(paths.footprintDir);

    // Determine footprint (may use KiCad standard)
    const footprintResult = footprintConverter.getFootprint(component);

    if (footprintResult.type === 'reference') {
      footprintRef = footprintResult.reference!;
    } else {
      footprintPath = join(footprintDir, `${footprintResult.name}.kicad_mod`);
      footprintRef = getCategoryFootprintRef(footprintResult.name);
      await writeText(footprintPath, footprintResult.content!);
    }

    component.info.package = footprintRef;
    symbolName = symbolConverter.getSymbolName(component);
    symbolRef = getCategorySymbolRef(category, symbolName);

    // Update lib tables (project-local only)
    if (!isGlobal && params.project_path) {
      symTableResult = await ensureSymLibTable(params.project_path, symbolFile);
      fpTableResult = await ensureFpLibTable(params.project_path, footprintDir);
    }
  }

  // Handle symbol library (append or create)
  let symbolContent: string;
  let symbolAction: 'created' | 'appended' | 'exists';

  if (existsSync(symbolFile)) {
    const existingContent = await readFile(symbolFile, 'utf-8');

    if (symbolConverter.symbolExistsInLibrary(existingContent, component.info.name)) {
      symbolAction = 'exists';
      symbolContent = existingContent;
    } else {
      symbolContent = symbolConverter.appendToLibrary(existingContent, component, {
        libraryName: isCommunityComponent ? EASYEDA_LIBRARY_NAME : undefined,
        symbolName: isCommunityComponent ? symbolName : undefined,
      });
      symbolAction = 'appended';
    }
  } else {
    symbolContent = symbolConverter.convert(component, {
      libraryName: isCommunityComponent ? EASYEDA_LIBRARY_NAME : undefined,
      symbolName: isCommunityComponent ? symbolName : undefined,
    });
    symbolAction = 'created';
  }

  if (symbolAction !== 'exists') {
    await writeText(symbolFile, symbolContent);
  }

  // Download 3D model if requested (default true for community, false for LCSC)
  const include3d = params.include_3d ?? isCommunityComponent;
  let modelPath: string | undefined;

  if (include3d && component.model3d) {
    await ensureDir(models3dDir);
    const model = isCommunityComponent
      ? await easyedaCommunityClient.get3DModel(component.model3d.uuid, 'step')
      : await easyedaClient.get3DModel(component.model3d.uuid, 'step');
    if (model) {
      modelPath = join(models3dDir, `${symbolName}.step`);
      await writeBinary(modelPath, model);
    }
  }

  // Determine footprint type for output
  const isKicadStandardFootprint = !isCommunityComponent && !footprintPath;
  const footprintType = isKicadStandardFootprint ? 'reference' : 'generated';

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
      pads: footprintType === 'generated'
        ? component.footprint.pads.map(p => ({
            number: p.number,
            shape: p.shape,
          }))
        : null,  // Skip for KiCad standard refs
      is_kicad_standard: isKicadStandardFootprint,
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
        id: params.id,
        source: isCommunityComponent ? 'easyeda_community' : 'lcsc',
        storage_mode: isGlobal ? 'global' : 'project-local',
        category,
        symbol_name: symbolName,
        symbol_ref: symbolRef,
        footprint_ref: footprintRef,
        footprint_type: footprintType,
        datasheet: component.info.datasheet || (isCommunityComponent ? undefined : `https://www.lcsc.com/datasheet/lcsc_datasheet_${params.id}.pdf`),
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
