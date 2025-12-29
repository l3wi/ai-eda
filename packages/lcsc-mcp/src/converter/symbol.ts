/**
 * EasyEDA Symbol to KiCad Symbol Converter
 * Converts EasyEDA symbol format to KiCad .kicad_sym format
 */

import type { EasyEDAComponentData, EasyEDAPin, KiCadSymbol } from '@ai-eda/common';
import { KICAD_SYMBOL_VERSION, KICAD_DEFAULTS, roundTo, easyedaToMm } from '@ai-eda/common';

// EasyEDA uses 10mil units
const EE_TO_MM = 0.254;

export interface SymbolConversionOptions {
  libraryName?: string;
  includeDatasheet?: boolean;
  includeManufacturer?: boolean;
}

export class SymbolConverter {
  /**
   * Convert EasyEDA component data to KiCad symbol format string
   */
  convert(
    component: EasyEDAComponentData,
    options: SymbolConversionOptions = {}
  ): string {
    const { info, symbol } = component;
    const name = this.sanitizeName(info.name);
    const { origin } = symbol;
    const { libraryName = 'LCSC' } = options;

    let output = `(kicad_symbol_lib
  (version ${KICAD_SYMBOL_VERSION})
  (generator "ai-eda-lcsc-mcp")
  (generator_version "1.0.0")
  (symbol "${libraryName}:${name}"
    (pin_names (offset ${KICAD_DEFAULTS.PIN_NAME_OFFSET}))
    (exclude_from_sim no)
    (in_bom yes)
    (on_board yes)
`;

    // Add properties
    output += this.generateProperties(info);

    // Start symbol unit
    output += `    (symbol "${name}_1_1"\n`;

    // Add rectangle body if no shapes
    if (symbol.shapes.length === 0) {
      output += this.generateDefaultBody(symbol.pins, origin);
    }

    // Add pins
    for (const pin of symbol.pins) {
      output += this.generatePin(pin, origin);
    }

    output += `    )
  )
)`;

    return output;
  }

  /**
   * Generate KiCad property entries
   */
  private generateProperties(info: EasyEDAComponentData['info']): string {
    let props = '';

    props += `    (property "Reference" "${info.prefix}" (at 0 ${KICAD_DEFAULTS.TEXT_SIZE + 0.27} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))\n`;
    props += `    (property "Value" "${this.sanitizeName(info.name)}" (at 0 -${KICAD_DEFAULTS.TEXT_SIZE + 0.27} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))\n`;
    props += `    (property "Footprint" "${info.package || ''}" (at 0 -${KICAD_DEFAULTS.TEXT_SIZE * 3} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE})) hide))\n`;

    if (info.datasheet) {
      props += `    (property "Datasheet" "${info.datasheet}" (at 0 -${KICAD_DEFAULTS.TEXT_SIZE * 5} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE})) hide))\n`;
    }

    if (info.lcscId) {
      props += `    (property "LCSC" "${info.lcscId}" (at 0 -${KICAD_DEFAULTS.TEXT_SIZE * 7} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE})) hide))\n`;
    }

    if (info.manufacturer) {
      props += `    (property "Manufacturer" "${info.manufacturer}" (at 0 -${KICAD_DEFAULTS.TEXT_SIZE * 9} 0) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE})) hide))\n`;
    }

    return props;
  }

  /**
   * Generate a default rectangular body for the symbol
   */
  private generateDefaultBody(pins: EasyEDAPin[], origin: { x: number; y: number }): string {
    // Calculate bounding box from pins
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

    // Add padding
    const padding = 2.54; // 100 mil
    minX = roundTo(minX + padding, 3);
    maxX = roundTo(maxX - padding, 3);
    minY = roundTo(minY - padding, 3);
    maxY = roundTo(maxY + padding, 3);

    // Ensure minimum size
    if (maxX - minX < 2.54) {
      minX = -2.54;
      maxX = 2.54;
    }
    if (maxY - minY < 2.54) {
      minY = -2.54;
      maxY = 2.54;
    }

    return `      (rectangle (start ${minX} ${maxY}) (end ${maxX} ${minY})
        (stroke (width 0.254) (type default))
        (fill (type background))
      )\n`;
  }

  /**
   * Generate a single pin entry
   */
  private generatePin(pin: EasyEDAPin, origin: { x: number; y: number }): string {
    const pinType = this.mapPinType(pin.electricalType);
    const x = roundTo((pin.x - origin.x) * EE_TO_MM, 3);
    const y = roundTo(-(pin.y - origin.y) * EE_TO_MM, 3);

    // Determine pin orientation based on position (simplified)
    const rotation = this.calculatePinRotation(x, y);

    return `      (pin ${pinType} line (at ${x} ${y} ${rotation}) (length ${KICAD_DEFAULTS.PIN_LENGTH})
        (name "${this.sanitizePinName(pin.name)}" (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))
        (number "${pin.number}" (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))
      )\n`;
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
    return mapping[eeType] || 'unspecified';
  }

  /**
   * Calculate pin rotation based on position (simplified heuristic)
   */
  private calculatePinRotation(x: number, y: number): number {
    // Pins typically point inward toward center
    // This is a simplified approach
    if (Math.abs(x) > Math.abs(y)) {
      return x > 0 ? 180 : 0;
    } else {
      return y > 0 ? 270 : 90;
    }
  }

  /**
   * Sanitize component name for KiCad
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Sanitize pin name
   */
  private sanitizePinName(name: string): string {
    return name.replace(/"/g, "'").replace(/\\/g, '');
  }
}

export const symbolConverter = new SymbolConverter();
