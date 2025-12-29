/**
 * EasyEDA Symbol to KiCad Symbol Converter
 * Converts EasyEDA symbol format to KiCad .kicad_sym format (KiCad 9 compatible)
 */

import type { EasyEDAComponentData, EasyEDAPin } from '@ai-eda/common';
import { KICAD_SYMBOL_VERSION, KICAD_DEFAULTS, roundTo } from '@ai-eda/common';

// EasyEDA uses 10mil units (0.254mm per unit)
const EE_TO_MM = 0.254;

export interface SymbolConversionOptions {
  libraryName?: string;
  symbolName?: string;
  includeDatasheet?: boolean;
  includeManufacturer?: boolean;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export class SymbolConverter {
  /**
   * Convert EasyEDA component data to KiCad symbol format string (standalone library)
   */
  convert(
    component: EasyEDAComponentData,
    options: SymbolConversionOptions = {}
  ): string {
    const symbolEntry = this.convertToSymbolEntry(component, options);
    return this.generateHeader() + symbolEntry + ')\n';
  }

  /**
   * Convert component to a symbol entry (without library wrapper)
   * Used for appending to existing libraries
   */
  convertToSymbolEntry(
    component: EasyEDAComponentData,
    options: SymbolConversionOptions = {}
  ): string {
    const { info, symbol } = component;
    const name = options.symbolName ? this.sanitizeName(options.symbolName) : this.sanitizeName(info.name);
    const { origin } = symbol;
    const bbox = this.calculateBoundingBox(symbol.pins, origin);

    let output = this.generateSymbolStart(name);
    output += this.generateProperties(info, name);
    output += this.generateGraphicsUnit(name, bbox);
    output += this.generatePinsUnit(name, symbol.pins, origin);
    output += this.generateSymbolEnd();

    return output;
  }

  /**
   * Create a new library file with multiple symbols
   */
  createLibrary(components: EasyEDAComponentData[]): string {
    let output = this.generateHeader();
    for (const component of components) {
      output += this.convertToSymbolEntry(component);
    }
    output += ')\n';
    return output;
  }

  /**
   * Append a symbol to an existing library file content
   * Returns the updated library content
   */
  appendToLibrary(
    existingLibraryContent: string,
    component: EasyEDAComponentData,
    options: SymbolConversionOptions = {}
  ): string {
    // Remove the closing parenthesis and any trailing whitespace
    const trimmed = existingLibraryContent.trimEnd();
    if (!trimmed.endsWith(')')) {
      throw new Error('Invalid library file format: missing closing parenthesis');
    }

    // Remove the last closing paren
    const withoutClose = trimmed.slice(0, -1);

    // Add the new symbol entry and close the library
    const newSymbol = this.convertToSymbolEntry(component, options);
    return withoutClose + newSymbol + ')\n';
  }

  /**
   * Check if a symbol already exists in a library
   */
  symbolExistsInLibrary(libraryContent: string, componentName: string): boolean {
    const sanitizedName = this.sanitizeName(componentName);
    // Look for (symbol "NAME" pattern
    const pattern = new RegExp(`\\(symbol\\s+"${sanitizedName}"`, 'm');
    return pattern.test(libraryContent);
  }

  /**
   * Get the sanitized symbol name for a component
   */
  getSymbolName(component: EasyEDAComponentData): string {
    return this.sanitizeName(component.info.name);
  }

  /**
   * Generate file header
   */
  private generateHeader(): string {
    return `(kicad_symbol_lib
\t(version ${KICAD_SYMBOL_VERSION})
\t(generator "ai-eda-jlc-mcp")
\t(generator_version "9.0")
`;
  }

  /**
   * Generate symbol start - NO library prefix in symbol name
   */
  private generateSymbolStart(name: string): string {
    return `\t(symbol "${name}"
\t\t(pin_numbers
\t\t\t(hide yes)
\t\t)
\t\t(pin_names
\t\t\t(offset 0)
\t\t)
\t\t(exclude_from_sim no)
\t\t(in_bom yes)
\t\t(on_board yes)
`;
  }

  /**
   * Generate KiCad property entries in KiCad 9 format
   */
  private generateProperties(info: EasyEDAComponentData['info'], name: string): string {
    const ts = KICAD_DEFAULTS.TEXT_SIZE;
    let props = '';

    // Reference property
    props += `\t\t(property "Reference" "${info.prefix}"
\t\t\t(at 2.032 0 90)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t)
\t\t)
`;

    // Value property
    props += `\t\t(property "Value" "${name}"
\t\t\t(at 0 0 90)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t)
\t\t)
`;

    // Footprint property
    props += `\t\t(property "Footprint" "${info.package || ''}"
\t\t\t(at -1.778 0 90)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;

    // Datasheet property
    props += `\t\t(property "Datasheet" "${info.datasheet || '~'}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;

    // Description property - use actual description if available
    const description = info.description || info.name;
    props += `\t\t(property "Description" "${this.sanitizeText(description)}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;

    // LCSC property
    if (info.lcscId) {
      props += `\t\t(property "LCSC" "${info.lcscId}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;
    }

    // Manufacturer property
    if (info.manufacturer) {
      props += `\t\t(property "Manufacturer" "${this.sanitizeText(info.manufacturer)}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;
    }

    // Category property
    if (info.category) {
      props += `\t\t(property "Category" "${this.sanitizeText(info.category)}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;
    }

    // Component attributes as custom properties
    if (info.attributes) {
      for (const [key, value] of Object.entries(info.attributes)) {
        props += `\t\t(property "${this.sanitizeText(key)}" "${this.sanitizeText(value)}"
\t\t\t(at 0 0 0)
\t\t\t(effects
\t\t\t\t(font
\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t)
\t\t\t\t(hide yes)
\t\t\t)
\t\t)
`;
      }
    }

    return props;
  }

  /**
   * Calculate bounding box from pins
   */
  private calculateBoundingBox(pins: EasyEDAPin[], origin: { x: number; y: number }): BoundingBox {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pin of pins) {
      const x = (pin.x - origin.x) * EE_TO_MM;
      const y = -(pin.y - origin.y) * EE_TO_MM;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }

    // If no pins, use default size
    if (!isFinite(minX)) {
      return { minX: -2.54, maxX: 2.54, minY: -2.54, maxY: 2.54 };
    }

    // Add padding and shrink to create body rectangle inside pin positions
    const padding = KICAD_DEFAULTS.PIN_LENGTH + 0.5;
    return {
      minX: roundTo(minX + padding, 3),
      maxX: roundTo(maxX - padding, 3),
      minY: roundTo(minY + padding, 3),
      maxY: roundTo(maxY - padding, 3),
    };
  }

  /**
   * Generate _0_1 unit with graphical elements (rectangle body)
   */
  private generateGraphicsUnit(name: string, bbox: BoundingBox): string {
    // Ensure minimum size
    const width = Math.max(bbox.maxX - bbox.minX, 2.54);
    const height = Math.max(bbox.maxY - bbox.minY, 2.54);

    // Center the rectangle if too small
    let x1 = bbox.minX;
    let x2 = bbox.maxX;
    let y1 = bbox.minY;
    let y2 = bbox.maxY;

    if (width < 2.54) {
      x1 = -1.27;
      x2 = 1.27;
    }
    if (height < 2.54) {
      y1 = -1.27;
      y2 = 1.27;
    }

    return `\t\t(symbol "${name}_0_1"
\t\t\t(rectangle
\t\t\t\t(start ${roundTo(x1, 3)} ${roundTo(y1, 3)})
\t\t\t\t(end ${roundTo(x2, 3)} ${roundTo(y2, 3)})
\t\t\t\t(stroke
\t\t\t\t\t(width 0.254)
\t\t\t\t\t(type default)
\t\t\t\t)
\t\t\t\t(fill
\t\t\t\t\t(type background)
\t\t\t\t)
\t\t\t)
\t\t)
`;
  }

  /**
   * Generate _1_1 unit with pins
   */
  private generatePinsUnit(name: string, pins: EasyEDAPin[], origin: { x: number; y: number }): string {
    let output = `\t\t(symbol "${name}_1_1"
`;

    for (const pin of pins) {
      output += this.generatePin(pin, origin);
    }

    output += `\t\t)
`;
    return output;
  }

  /**
   * Generate a single pin entry in KiCad 9 format
   */
  private generatePin(pin: EasyEDAPin, origin: { x: number; y: number }): string {
    const pinType = this.mapPinType(pin.electricalType);
    const x = roundTo((pin.x - origin.x) * EE_TO_MM, 3);
    const y = roundTo(-(pin.y - origin.y) * EE_TO_MM, 3);
    const rotation = this.calculatePinRotation(x, y);
    const ts = KICAD_DEFAULTS.TEXT_SIZE;
    const pinLength = KICAD_DEFAULTS.PIN_LENGTH;

    return `\t\t\t(pin ${pinType} line
\t\t\t\t(at ${x} ${y} ${rotation})
\t\t\t\t(length ${pinLength})
\t\t\t\t(name "${this.sanitizePinName(pin.name)}"
\t\t\t\t\t(effects
\t\t\t\t\t\t(font
\t\t\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t\t\t)
\t\t\t\t\t)
\t\t\t\t)
\t\t\t\t(number "${pin.number}"
\t\t\t\t\t(effects
\t\t\t\t\t\t(font
\t\t\t\t\t\t\t(size ${ts} ${ts})
\t\t\t\t\t\t)
\t\t\t\t\t)
\t\t\t\t)
\t\t\t)
`;
  }

  /**
   * Generate symbol end (closes the symbol, NOT the library)
   */
  private generateSymbolEnd(): string {
    return `\t\t(embedded_fonts no)
\t)
`;
  }

  /**
   * Map EasyEDA pin type to KiCad pin type
   */
  private mapPinType(eeType: string): string {
    const mapping: Record<string, string> = {
      '0': 'unspecified',
      '1': 'input',
      '2': 'output',
      '3': 'bidirectional',
      '4': 'power_in',
      '5': 'power_out',
      '6': 'open_collector',
      '7': 'open_emitter',
      '8': 'passive',
      '9': 'no_connect',
    };
    return mapping[eeType] || 'passive';
  }

  /**
   * Calculate pin rotation based on position (points inward toward center)
   */
  private calculatePinRotation(x: number, y: number): number {
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 180 : 0;
    } else {
      return y > 0 ? 270 : 90;
    }
  }

  /**
   * Sanitize component name for KiCad (no special chars except underscore/hyphen)
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Sanitize pin name (escape quotes)
   */
  private sanitizePinName(name: string): string {
    if (!name || name.trim() === '') return '~';
    return name.replace(/"/g, "'").replace(/\\/g, '');
  }

  /**
   * Sanitize general text for properties
   */
  private sanitizeText(text: string): string {
    return text.replace(/"/g, "'").replace(/\\/g, '').replace(/\n/g, ' ');
  }
}

export const symbolConverter = new SymbolConverter();
