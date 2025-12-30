/**
 * Global Library Table Manager
 * Registers JLC libraries in KiCad's global sym-lib-table and fp-lib-table
 * Works cross-platform: macOS, Windows, Linux
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import {
  getAllCategories,
  getLibraryFilename,
  getFootprintDirName,
  get3DModelsDirName,
  type LibraryCategory,
} from './category-router.js';
import { libraryExistsInTable, addLibraryToTable } from './lib-table.js';

// KiCad versions to check (newest first)
const KICAD_VERSIONS = ['9.0', '8.0'];

// Library prefix
const LIBRARY_PREFIX = 'JLC';

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
 * Get KiCad global config directory (platform-specific)
 * This is where sym-lib-table and fp-lib-table are stored
 */
function getKicadConfigDir(version: string): string {
  const home = homedir();
  const plat = platform();

  if (plat === 'darwin') {
    return join(home, 'Library', 'Preferences', 'kicad', version);
  } else if (plat === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'kicad', version);
  } else {
    // Linux and others
    return join(home, '.config', 'kicad', version);
  }
}

/**
 * Get KiCad user library directory (where libraries are stored)
 * This is ~/Documents/KiCad/{version}/ on all platforms
 */
function getKicadUserDir(version: string): string {
  const home = homedir();
  return join(home, 'Documents', 'KiCad', version);
}

/**
 * Get absolute path to a JLC symbol library file
 */
function getSymbolLibPath(category: LibraryCategory, version: string): string {
  return join(getKicadUserDir(version), 'symbols', getLibraryFilename(category));
}

/**
 * Get absolute path to JLC footprint library directory
 */
function getFootprintLibPath(version: string): string {
  return join(getKicadUserDir(version), 'footprints', getFootprintDirName());
}

/**
 * Generate standard KiCad symbol library header
 */
function generateEmptySymbolLibrary(): string {
  return `(kicad_symbol_lib
\t(version 20241209)
\t(generator "jlc-mcp")
\t(generator_version "9.0")
)\n`;
}

/**
 * Generate new sym-lib-table content with all JLC libraries
 */
function generateSymLibTable(version: string): string {
  const categories = getAllCategories();
  let content = '(sym_lib_table\n  (version 7)\n';

  for (const category of categories) {
    const name = `${LIBRARY_PREFIX}-${category}`;
    const uri = getSymbolLibPath(category, version);
    const descr = `JLC PCB ${category} Library`;
    content += `  (lib (name "${name}")(type "KiCad")(uri "${uri}")(options "")(descr "${descr}"))\n`;
  }

  content += ')\n';
  return content;
}

/**
 * Generate new fp-lib-table content with JLC footprint library
 */
function generateFpLibTable(version: string): string {
  const name = LIBRARY_PREFIX;
  const uri = getFootprintLibPath(version);
  const descr = 'JLC PCB Footprint Library';

  return `(fp_lib_table
  (version 7)
  (lib (name "${name}")(type "KiCad")(uri "${uri}")(options "")(descr "${descr}"))
)
`;
}

interface TableUpdateResult {
  path: string;
  created: boolean;
  modified: boolean;
  entriesAdded: number;
}

/**
 * Ensure sym-lib-table has all JLC symbol libraries registered
 */
async function ensureGlobalSymLibTable(version: string): Promise<TableUpdateResult> {
  const configDir = getKicadConfigDir(version);
  const tablePath = join(configDir, 'sym-lib-table');
  const categories = getAllCategories();

  // Ensure config directory exists
  await mkdir(configDir, { recursive: true });

  if (!existsSync(tablePath)) {
    // Create new table with all libraries
    const content = generateSymLibTable(version);
    await writeFile(tablePath, content, 'utf-8');
    return {
      path: tablePath,
      created: true,
      modified: false,
      entriesAdded: categories.length,
    };
  }

  // Read existing table and add missing libraries
  let content = await readFile(tablePath, 'utf-8');
  let entriesAdded = 0;

  for (const category of categories) {
    const name = `${LIBRARY_PREFIX}-${category}`;

    if (!libraryExistsInTable(content, name)) {
      const uri = getSymbolLibPath(category, version);
      const descr = `JLC PCB ${category} Library`;
      content = addLibraryToTable(content, name, uri, 'sym', descr);
      entriesAdded++;
    }
  }

  if (entriesAdded > 0) {
    await writeFile(tablePath, content, 'utf-8');
    return {
      path: tablePath,
      created: false,
      modified: true,
      entriesAdded,
    };
  }

  return {
    path: tablePath,
    created: false,
    modified: false,
    entriesAdded: 0,
  };
}

/**
 * Ensure fp-lib-table has JLC footprint library registered
 */
async function ensureGlobalFpLibTable(version: string): Promise<TableUpdateResult> {
  const configDir = getKicadConfigDir(version);
  const tablePath = join(configDir, 'fp-lib-table');
  const name = LIBRARY_PREFIX;

  // Ensure config directory exists
  await mkdir(configDir, { recursive: true });

  if (!existsSync(tablePath)) {
    // Create new table
    const content = generateFpLibTable(version);
    await writeFile(tablePath, content, 'utf-8');
    return {
      path: tablePath,
      created: true,
      modified: false,
      entriesAdded: 1,
    };
  }

  // Read existing table and add if missing
  let content = await readFile(tablePath, 'utf-8');

  if (!libraryExistsInTable(content, name)) {
    const uri = getFootprintLibPath(version);
    const descr = 'JLC PCB Footprint Library';
    content = addLibraryToTable(content, name, uri, 'fp', descr);
    await writeFile(tablePath, content, 'utf-8');

    return {
      path: tablePath,
      created: false,
      modified: true,
      entriesAdded: 1,
    };
  }

  return {
    path: tablePath,
    created: false,
    modified: false,
    entriesAdded: 0,
  };
}

/**
 * Ensure library directories and empty stub files exist
 */
async function ensureLibraryStubs(version: string): Promise<{
  symbolsCreated: string[];
  directoriesCreated: string[];
}> {
  const userDir = getKicadUserDir(version);
  const symbolsDir = join(userDir, 'symbols');
  const footprintsDir = join(userDir, 'footprints', getFootprintDirName());
  const models3dDir = join(userDir, '3dmodels', get3DModelsDirName());

  const directoriesCreated: string[] = [];
  const symbolsCreated: string[] = [];

  // Create directories
  for (const dir of [symbolsDir, footprintsDir, models3dDir]) {
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      directoriesCreated.push(dir);
    }
  }

  // Create empty symbol library files
  const categories = getAllCategories();
  const emptyContent = generateEmptySymbolLibrary();

  for (const category of categories) {
    const filePath = getSymbolLibPath(category, version);
    if (!existsSync(filePath)) {
      await writeFile(filePath, emptyContent, 'utf-8');
      symbolsCreated.push(filePath);
    }
  }

  return { symbolsCreated, directoriesCreated };
}

export interface GlobalRegistrationResult {
  success: boolean;
  version: string;
  symLibTable: TableUpdateResult;
  fpLibTable: TableUpdateResult;
  libraryStubs: {
    symbolsCreated: string[];
    directoriesCreated: string[];
  };
  errors: string[];
}

/**
 * Main entry point: Ensure JLC libraries are registered in KiCad global tables
 * Call this on MCP server startup
 */
export async function ensureGlobalLibraryTables(): Promise<GlobalRegistrationResult> {
  const errors: string[] = [];
  const version = detectKicadVersion();

  let symLibTable: TableUpdateResult = {
    path: '',
    created: false,
    modified: false,
    entriesAdded: 0,
  };

  let fpLibTable: TableUpdateResult = {
    path: '',
    created: false,
    modified: false,
    entriesAdded: 0,
  };

  let libraryStubs = {
    symbolsCreated: [] as string[],
    directoriesCreated: [] as string[],
  };

  // Step 1: Create library stubs (directories and empty files)
  try {
    libraryStubs = await ensureLibraryStubs(version);
  } catch (error) {
    const msg = `Failed to create library stubs: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(msg);
    // Continue anyway - tables might still work if directories exist
  }

  // Step 2: Update global sym-lib-table
  try {
    symLibTable = await ensureGlobalSymLibTable(version);
  } catch (error) {
    const msg = `Failed to update sym-lib-table: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(msg);
  }

  // Step 3: Update global fp-lib-table
  try {
    fpLibTable = await ensureGlobalFpLibTable(version);
  } catch (error) {
    const msg = `Failed to update fp-lib-table: ${error instanceof Error ? error.message : String(error)}`;
    errors.push(msg);
  }

  // Success if at least the tables were updated (even if stubs failed)
  const success = symLibTable.path !== '' && fpLibTable.path !== '' && errors.length === 0;

  return {
    success,
    version,
    symLibTable,
    fpLibTable,
    libraryStubs,
    errors,
  };
}
