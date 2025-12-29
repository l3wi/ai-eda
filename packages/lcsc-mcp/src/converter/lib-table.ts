/**
 * KiCad Library Table Management
 * Handles sym-lib-table and fp-lib-table generation and updates
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';

const LIBRARY_NAME = 'LCSC';
const LIBRARY_DESCRIPTION = 'LCSC/EasyEDA Component Library';

/**
 * Generate sym-lib-table content
 */
export function generateSymLibTable(symbolLibPath: string): string {
  return `(sym_lib_table
  (version 7)
  (lib (name "${LIBRARY_NAME}")(type "KiCad")(uri "${symbolLibPath}")(options "")(descr "${LIBRARY_DESCRIPTION}"))
)
`;
}

/**
 * Generate fp-lib-table content
 */
export function generateFpLibTable(footprintLibPath: string): string {
  return `(fp_lib_table
  (version 7)
  (lib (name "${LIBRARY_NAME}")(type "KiCad")(uri "${footprintLibPath}")(options "")(descr "${LIBRARY_DESCRIPTION}"))
)
`;
}

/**
 * Check if a library entry exists in a lib-table file
 */
export function libraryExistsInTable(tableContent: string, libraryName: string): boolean {
  const pattern = new RegExp(`\\(name\\s+"${libraryName}"\\)`, 'm');
  return pattern.test(tableContent);
}

/**
 * Add a library entry to an existing lib-table content
 */
export function addLibraryToTable(
  tableContent: string,
  libraryName: string,
  libraryPath: string,
  type: 'sym' | 'fp'
): string {
  // Check if library already exists
  if (libraryExistsInTable(tableContent, libraryName)) {
    return tableContent; // No change needed
  }

  const trimmed = tableContent.trimEnd();
  if (!trimmed.endsWith(')')) {
    throw new Error('Invalid lib-table format: missing closing parenthesis');
  }

  // Remove the last closing paren
  const withoutClose = trimmed.slice(0, -1);

  // Add new library entry
  const newEntry = `  (lib (name "${libraryName}")(type "KiCad")(uri "${libraryPath}")(options "")(descr "${LIBRARY_DESCRIPTION}"))\n`;

  return withoutClose + newEntry + ')\n';
}

/**
 * Ensure sym-lib-table exists and contains LCSC library
 * @param projectDir - Path to the KiCad project directory
 * @param symbolLibPath - Path to the symbol library file (relative or absolute)
 * @returns true if table was created or modified, false if already correct
 */
export async function ensureSymLibTable(
  projectDir: string,
  symbolLibPath: string
): Promise<{ created: boolean; modified: boolean; path: string }> {
  const tablePath = join(projectDir, 'sym-lib-table');

  // Use ${KIPRJMOD} for project-relative paths
  const relativePath = symbolLibPath.startsWith(projectDir)
    ? '${KIPRJMOD}' + symbolLibPath.slice(projectDir.length)
    : symbolLibPath;

  if (!existsSync(tablePath)) {
    // Create new table
    const content = generateSymLibTable(relativePath);
    await writeFile(tablePath, content, 'utf-8');
    return { created: true, modified: false, path: tablePath };
  }

  // Read existing table
  const existingContent = await readFile(tablePath, 'utf-8');

  if (libraryExistsInTable(existingContent, LIBRARY_NAME)) {
    return { created: false, modified: false, path: tablePath };
  }

  // Add library to existing table
  const updatedContent = addLibraryToTable(existingContent, LIBRARY_NAME, relativePath, 'sym');
  await writeFile(tablePath, updatedContent, 'utf-8');
  return { created: false, modified: true, path: tablePath };
}

/**
 * Ensure fp-lib-table exists and contains LCSC library
 * @param projectDir - Path to the KiCad project directory
 * @param footprintLibPath - Path to the footprint library directory (relative or absolute)
 * @returns true if table was created or modified, false if already correct
 */
export async function ensureFpLibTable(
  projectDir: string,
  footprintLibPath: string
): Promise<{ created: boolean; modified: boolean; path: string }> {
  const tablePath = join(projectDir, 'fp-lib-table');

  // Use ${KIPRJMOD} for project-relative paths
  const relativePath = footprintLibPath.startsWith(projectDir)
    ? '${KIPRJMOD}' + footprintLibPath.slice(projectDir.length)
    : footprintLibPath;

  if (!existsSync(tablePath)) {
    // Create new table
    const content = generateFpLibTable(relativePath);
    await writeFile(tablePath, content, 'utf-8');
    return { created: true, modified: false, path: tablePath };
  }

  // Read existing table
  const existingContent = await readFile(tablePath, 'utf-8');

  if (libraryExistsInTable(existingContent, LIBRARY_NAME)) {
    return { created: false, modified: false, path: tablePath };
  }

  // Add library to existing table
  const updatedContent = addLibraryToTable(existingContent, LIBRARY_NAME, relativePath, 'fp');
  await writeFile(tablePath, updatedContent, 'utf-8');
  return { created: false, modified: true, path: tablePath };
}

/**
 * Get the symbol reference string for use in schematics
 * @param symbolName - The symbol name within the library
 * @returns Full reference like "LCSC:SymbolName"
 */
export function getSymbolReference(symbolName: string): string {
  return `${LIBRARY_NAME}:${symbolName}`;
}

/**
 * Get the footprint reference string for use in symbols/schematics
 * @param footprintName - The footprint filename (without .kicad_mod)
 * @returns Full reference like "LCSC:FootprintName"
 */
export function getFootprintReference(footprintName: string): string {
  return `${LIBRARY_NAME}:${footprintName}`;
}
