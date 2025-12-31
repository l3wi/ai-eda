/**
 * Library Service
 * High-level API for installing components to KiCad libraries
 */

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { homedir, platform } from 'os';
import { join } from 'path';

import type { EasyEDAComponentData, EasyEDACommunityComponent } from '../types/index.js';
import type { LibraryCategory } from '../converter/category-router.js';
import { ensureDir, writeText, writeBinary } from '../utils/index.js';
import { easyedaClient } from '../api/easyeda.js';
import { easyedaCommunityClient } from '../api/easyeda-community.js';
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
  getSymbolReference,
  getFootprintReference,
} from '../converter/category-router.js';

// Library naming
const FOOTPRINT_LIBRARY_NAME = getFootprintDirName();
const MODELS_3D_NAME = get3DModelsDirName();
const LIBRARY_NAMESPACE = 'jlc_mcp';

// KiCad versions to check
const KICAD_VERSIONS = ['9.0', '8.0'];

// EasyEDA community library naming
const EASYEDA_LIBRARY_NAME = 'EasyEDA';
const EASYEDA_SYMBOL_LIBRARY_NAME = 'EasyEDA.kicad_sym';
const EASYEDA_FOOTPRINT_LIBRARY_NAME = 'EasyEDA.pretty';
const EASYEDA_LIBRARY_DESCRIPTION = 'EasyEDA Community Component Library';

export interface InstallOptions {
  projectPath?: string;
  include3d?: boolean;
}

export interface InstallResult {
  success: boolean;
  id: string;
  source: 'lcsc' | 'easyeda_community';
  storageMode: 'global' | 'project-local';
  category?: string;
  symbolName: string;
  symbolRef: string;
  footprintRef: string;
  footprintType: 'reference' | 'generated';
  datasheet?: string;
  files: {
    symbolLibrary: string;
    footprint?: string;
    model3d?: string;
  };
  symbolAction: 'created' | 'appended' | 'exists';
  validationData: ValidationData;
}

export interface ValidationData {
  component: {
    name: string;
    description?: string;
    package?: string;
    manufacturer?: string;
    datasheet_url?: string;
  };
  symbol: {
    pin_count: number;
    pins: Array<{ number: string; name: string; electrical_type?: string }>;
  };
  footprint: {
    type: string;
    pad_count: number;
    pads?: Array<{ number: string; shape: string }> | null;
    is_kicad_standard: boolean;
    kicad_ref: string;
  };
  checks: {
    pin_pad_count_match: boolean;
    has_power_pins: boolean;
    has_ground_pins: boolean;
  };
}

export interface InstalledComponent {
  lcscId: string;
  name: string;
  category: LibraryCategory;
  symbolRef: string;
  footprintRef: string;
  library: string;
}

export interface ListOptions {
  category?: LibraryCategory;
  projectPath?: string;
}

export interface UpdateOptions {
  category?: LibraryCategory;
  projectPath?: string;
  dryRun?: boolean;
}

export interface UpdateResult {
  updated: number;
  failed: number;
  skipped: number;
  components: Array<{ id: string; status: 'updated' | 'failed' | 'skipped'; error?: string }>;
}

export interface LibraryService {
  install(id: string, options?: InstallOptions): Promise<InstallResult>;
  listInstalled(options?: ListOptions): Promise<InstalledComponent[]>;
  update(options?: UpdateOptions): Promise<UpdateResult>;
  ensureGlobalTables(): Promise<void>;
}

interface LibraryPaths {
  base: string;
  symbolsDir: string;
  footprintsDir: string;
  models3dDir: string;
  footprintDir: string;
  models3dFullDir: string;
}

function detectKicadVersion(): string {
  const home = homedir();
  const baseDir = join(home, 'Documents', 'KiCad');

  for (const version of KICAD_VERSIONS) {
    if (existsSync(join(baseDir, version))) {
      return version;
    }
  }
  return '9.0';
}

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

function isLcscId(id: string): boolean {
  return /^C\d+$/.test(id);
}

function adaptCommunityComponent(component: EasyEDACommunityComponent): EasyEDAComponentData {
  const symbolHead = component.symbol.head as Record<string, unknown> | undefined;
  const cPara = (symbolHead?.c_para as Record<string, string>) || {};

  return {
    info: {
      name: component.title,
      prefix: cPara.pre || 'U',
      package: component.footprint.name,
      manufacturer: cPara.Manufacturer || cPara.BOM_Manufacturer,
      datasheet: cPara.link,
      lcscId: undefined,
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

export function createLibraryService(): LibraryService {
  return {
    async install(id: string, options: InstallOptions = {}): Promise<InstallResult> {
      const isCommunityComponent = !isLcscId(id);

      // Community components require projectPath
      if (isCommunityComponent && !options.projectPath) {
        throw new Error('EasyEDA community components require projectPath for local storage');
      }

      // Determine storage location
      const isGlobal = !isCommunityComponent && !options.projectPath;
      const paths = isGlobal
        ? getGlobalLibraryPaths()
        : getProjectLibraryPaths(options.projectPath!);

      // Fetch component data
      let component: EasyEDAComponentData | null = null;

      if (isLcscId(id)) {
        component = await easyedaClient.getComponentData(id);
      } else {
        const communityComponent = await easyedaCommunityClient.getComponent(id);
        if (communityComponent) {
          component = adaptCommunityComponent(communityComponent);
        }
      }

      if (!component) {
        throw new Error(`Component ${id} not found`);
      }

      // Enrich with JLC API data for LCSC components
      if (!isCommunityComponent) {
        try {
          const jlcDetails = await jlcClient.getComponentDetails(id);
          if (jlcDetails) {
            if (jlcDetails.datasheetPdf) {
              component.info.datasheetPdf = jlcDetails.datasheetPdf;
            }
            if (jlcDetails.description && jlcDetails.description !== jlcDetails.name) {
              component.info.description = jlcDetails.description;
            }
            if (jlcDetails.attributes) {
              component.info.attributes = {
                ...component.info.attributes,
                ...jlcDetails.attributes,
              };
            }
          }
        } catch {
          // JLC enrichment is optional
        }
      }

      // Variables for library paths and refs
      let symbolFile: string;
      let symbolName: string;
      let symbolRef: string;
      let footprintPath: string | undefined;
      let footprintRef: string;
      let footprintDir: string;
      let models3dDir: string;
      let category: string | undefined;

      if (isCommunityComponent) {
        // EasyEDA community component → project-local EasyEDA library
        const librariesDir = join(options.projectPath!, 'libraries');
        const symbolsDir = join(librariesDir, 'symbols');
        footprintDir = join(librariesDir, 'footprints', EASYEDA_FOOTPRINT_LIBRARY_NAME);
        models3dDir = join(librariesDir, '3dmodels', 'EasyEDA.3dshapes');

        await ensureDir(symbolsDir);
        await ensureDir(footprintDir);

        symbolFile = join(symbolsDir, EASYEDA_SYMBOL_LIBRARY_NAME);
        symbolName = component.info.name.replace(/[^a-zA-Z0-9_-]/g, '_');

        // Generate custom footprint
        const footprint = footprintConverter.convert(component, { libraryName: EASYEDA_LIBRARY_NAME });
        footprintPath = join(footprintDir, `${symbolName}.kicad_mod`);
        footprintRef = `${EASYEDA_LIBRARY_NAME}:${symbolName}`;
        await writeText(footprintPath, footprint);

        component.info.package = footprintRef;

        // Update lib tables
        await ensureSymLibTable(options.projectPath!, symbolFile, EASYEDA_LIBRARY_NAME, EASYEDA_LIBRARY_DESCRIPTION);
        await ensureFpLibTable(options.projectPath!, footprintDir, EASYEDA_LIBRARY_NAME, EASYEDA_LIBRARY_DESCRIPTION);

        symbolRef = `${EASYEDA_LIBRARY_NAME}:${symbolName}`;
      } else {
        // LCSC component → JLC-MCP category-based library
        category = getLibraryCategory(
          component.info.prefix,
          component.info.category,
          component.info.description
        );

        const symbolLibraryFilename = getLibraryFilename(category as LibraryCategory);
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
          footprintRef = getFootprintReference(footprintResult.name);
          await writeText(footprintPath, footprintResult.content!);
        }

        component.info.package = footprintRef;
        symbolName = symbolConverter.getSymbolName(component);
        symbolRef = getSymbolReference(category as LibraryCategory, symbolName);

        // Update lib tables (project-local only)
        if (!isGlobal && options.projectPath) {
          await ensureSymLibTable(options.projectPath, symbolFile);
          await ensureFpLibTable(options.projectPath, footprintDir);
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

      // Download 3D model if requested
      const include3d = options.include3d ?? isCommunityComponent;
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

      // Build validation data
      const isKicadStandardFootprint = !isCommunityComponent && !footprintPath;
      const footprintType = isKicadStandardFootprint ? 'reference' : 'generated';

      const validationData: ValidationData = {
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
          pads: footprintType === 'generated'
            ? component.footprint.pads.map(p => ({
                number: p.number,
                shape: p.shape,
              }))
            : null,
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
        success: true,
        id,
        source: isCommunityComponent ? 'easyeda_community' : 'lcsc',
        storageMode: isGlobal ? 'global' : 'project-local',
        category,
        symbolName,
        symbolRef,
        footprintRef,
        footprintType,
        datasheet: component.info.datasheet || (!isCommunityComponent ? `https://www.lcsc.com/datasheet/lcsc_datasheet_${id}.pdf` : undefined),
        files: {
          symbolLibrary: symbolFile,
          footprint: footprintPath,
          model3d: modelPath,
        },
        symbolAction,
        validationData,
      };
    },

    async listInstalled(_options: ListOptions = {}): Promise<InstalledComponent[]> {
      // TODO: Implement by parsing symbol libraries
      return [];
    },

    async update(_options: UpdateOptions = {}): Promise<UpdateResult> {
      // TODO: Implement by re-fetching all components in a library
      return { updated: 0, failed: 0, skipped: 0, components: [] };
    },

    async ensureGlobalTables(): Promise<void> {
      // This calls ensureGlobalLibraryTables from global-lib-table.ts
      // which is already done at MCP server startup
    },
  };
}
