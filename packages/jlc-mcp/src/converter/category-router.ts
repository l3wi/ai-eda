/**
 * Category Router
 * Routes components to category-based symbol libraries
 * JLC-MCP-Resistors.kicad_sym, JLC-MCP-Capacitors.kicad_sym, etc.
 */

export type LibraryCategory =
  | 'Resistors'
  | 'Capacitors'
  | 'Inductors'
  | 'Diodes'
  | 'Transistors'
  | 'ICs'
  | 'Connectors'
  | 'Misc';

// Library naming prefix - used for KiCad library names and references
const LIBRARY_PREFIX = 'JLC-MCP';

// Prefix to category mapping
const PREFIX_CATEGORY_MAP: Record<string, LibraryCategory> = {
  R: 'Resistors',
  C: 'Capacitors',
  L: 'Inductors',
  D: 'Diodes',
  Q: 'Transistors',
  U: 'ICs',
  J: 'Connectors',
  P: 'Connectors',
  K: 'Misc',      // Relays
  Y: 'Misc',      // Crystals
  X: 'Misc',      // Crystals/Oscillators
  F: 'Misc',      // Fuses
  FB: 'Inductors', // Ferrite beads
};

// LCSC category keywords for fallback detection
const CATEGORY_KEYWORDS: Record<string, LibraryCategory> = {
  resistor: 'Resistors',
  capacitor: 'Capacitors',
  inductor: 'Inductors',
  'ferrite bead': 'Inductors',
  diode: 'Diodes',
  led: 'Diodes',
  transistor: 'Transistors',
  mosfet: 'Transistors',
  bjt: 'Transistors',
  jfet: 'Transistors',
  ic: 'ICs',
  mcu: 'ICs',
  microcontroller: 'ICs',
  'op amp': 'ICs',
  opamp: 'ICs',
  'voltage regulator': 'ICs',
  ldo: 'ICs',
  'dc-dc': 'ICs',
  adc: 'ICs',
  dac: 'ICs',
  sensor: 'ICs',
  driver: 'ICs',
  connector: 'Connectors',
  header: 'Connectors',
  socket: 'Connectors',
  terminal: 'Connectors',
  relay: 'Misc',
  crystal: 'Misc',
  oscillator: 'Misc',
  fuse: 'Misc',
  switch: 'Misc',
  button: 'Misc',
};

/**
 * Determine library category from component prefix and LCSC category
 */
export function getLibraryCategory(
  prefix: string,
  category?: string,
  description?: string
): LibraryCategory {
  // 1. Check prefix first (most reliable)
  const normalizedPrefix = prefix.toUpperCase();
  if (PREFIX_CATEGORY_MAP[normalizedPrefix]) {
    return PREFIX_CATEGORY_MAP[normalizedPrefix];
  }

  // 2. Check LCSC category keywords
  if (category) {
    const lowerCategory = category.toLowerCase();
    for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lowerCategory.includes(keyword)) {
        return cat;
      }
    }
  }

  // 3. Check description for keywords
  if (description) {
    const lowerDesc = description.toLowerCase();
    for (const [keyword, cat] of Object.entries(CATEGORY_KEYWORDS)) {
      if (lowerDesc.includes(keyword)) {
        return cat;
      }
    }
  }

  // 4. Default to Misc
  return 'Misc';
}

/**
 * Get symbol library filename for a category
 * Returns: "JLC-MCP-Resistors.kicad_sym"
 */
export function getLibraryFilename(category: LibraryCategory): string {
  return `${LIBRARY_PREFIX}-${category}.kicad_sym`;
}

/**
 * Get footprint library directory name
 * All footprints go in a single directory
 * Returns: "JLC-MCP.pretty"
 */
export function getFootprintDirName(): string {
  return `${LIBRARY_PREFIX}.pretty`;
}

/**
 * Get 3D models directory name
 * Returns: "JLC-MCP.3dshapes"
 */
export function get3DModelsDirName(): string {
  return `${LIBRARY_PREFIX}.3dshapes`;
}

/**
 * Get full symbol reference for use in schematics
 * Format: "JLC-MCP-Resistors:SymbolName"
 */
export function getSymbolReference(category: LibraryCategory, symbolName: string): string {
  const libraryName = `${LIBRARY_PREFIX}-${category}`;
  return `${libraryName}:${symbolName}`;
}

/**
 * Get full footprint reference for use in schematics/boards
 * Format: "JLC-MCP:FootprintName"
 */
export function getFootprintReference(footprintName: string): string {
  return `${LIBRARY_PREFIX}:${footprintName}`;
}

/**
 * Get all possible library categories
 */
export function getAllCategories(): LibraryCategory[] {
  return ['Resistors', 'Capacitors', 'Inductors', 'Diodes', 'Transistors', 'ICs', 'Connectors', 'Misc'];
}

/**
 * Parse library name to extract category
 * "JLC-MCP-Resistors" -> "Resistors"
 */
export function parseLibraryName(libraryName: string): LibraryCategory | null {
  const match = libraryName.match(/^JLC-MCP-(\w+)$/);
  if (match) {
    const category = match[1] as LibraryCategory;
    if (getAllCategories().includes(category)) {
      return category;
    }
  }
  return null;
}
