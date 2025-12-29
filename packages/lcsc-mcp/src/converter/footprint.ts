/**
 * EasyEDA Footprint to KiCad Footprint Converter
 * Converts EasyEDA footprint format to KiCad .kicad_mod format
 */

import type { EasyEDAComponentData, EasyEDAPad, KiCadFootprint } from '@ai-eda/common';
import { KICAD_FOOTPRINT_VERSION, KICAD_DEFAULTS, roundTo } from '@ai-eda/common';

// EasyEDA uses 10mil units
const EE_TO_MM = 0.254;

export interface FootprintConversionOptions {
  libraryName?: string;
  include3DModel?: boolean;
  modelPath?: string;
}

export class FootprintConverter {
  /**
   * Convert EasyEDA component data to KiCad footprint format string
   */
  convert(
    component: EasyEDAComponentData,
    options: FootprintConversionOptions = {}
  ): string {
    const { info, footprint, model3d } = component;
    const name = this.sanitizeName(footprint.name);
    const { origin } = footprint;
    const { libraryName = 'LCSC', include3DModel = false } = options;

    let output = `(footprint "${libraryName}:${name}"
  (version ${KICAD_FOOTPRINT_VERSION})
  (generator "ai-eda-lcsc-mcp")
  (generator_version "1.0.0")
  (layer "F.Cu")
`;

    // Add properties
    output += this.generateProperties(info, name);

    // Add attributes
    output += `  (attr ${footprint.type})\n`;

    // Add pads
    for (const pad of footprint.pads) {
      output += this.generatePad(pad, origin);
    }

    // Add courtyard (calculated from pads)
    output += this.generateCourtyard(footprint.pads, origin);

    // Add 3D model reference if available
    if (include3DModel && model3d && options.modelPath) {
      output += this.generate3DModel(options.modelPath);
    }

    output += `)`;

    return output;
  }

  /**
   * Generate footprint properties
   */
  private generateProperties(info: EasyEDAComponentData['info'], name: string): string {
    let props = '';

    props += `  (property "Reference" "REF**" (at 0 -3 0) (layer "F.SilkS") (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}) (thickness ${KICAD_DEFAULTS.TEXT_THICKNESS}))))\n`;
    props += `  (property "Value" "${this.sanitizeName(info.name)}" (at 0 3 0) (layer "F.Fab") (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}) (thickness ${KICAD_DEFAULTS.TEXT_THICKNESS}))))\n`;
    props += `  (property "Footprint" "${name}" (at 0 0 0) (layer "F.Fab") (hide yes) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))\n`;

    if (info.lcscId) {
      props += `  (property "LCSC" "${info.lcscId}" (at 0 0 0) (layer "F.Fab") (hide yes) (effects (font (size ${KICAD_DEFAULTS.TEXT_SIZE} ${KICAD_DEFAULTS.TEXT_SIZE}))))\n`;
    }

    return props;
  }

  /**
   * Generate a single pad entry
   */
  private generatePad(pad: EasyEDAPad, origin: { x: number; y: number }): string {
    const padType = pad.holeRadius ? 'thru_hole' : 'smd';
    const shape = this.mapPadShape(pad.shape);
    const layers = this.getPadLayers(padType);

    // Convert coordinates
    const x = roundTo((pad.x - origin.x) * EE_TO_MM, 4);
    const y = roundTo(-(pad.y - origin.y) * EE_TO_MM, 4);
    const w = roundTo(pad.width * EE_TO_MM, 4);
    const h = roundTo(pad.height * EE_TO_MM, 4);

    let output = `  (pad "${pad.number}" ${padType} ${shape} (at ${x} ${y}) (size ${w} ${h}) (layers ${layers})`;

    if (pad.holeRadius) {
      const drill = roundTo(pad.holeRadius * EE_TO_MM, 4);
      output += ` (drill ${drill})`;
    }

    output += `)\n`;
    return output;
  }

  /**
   * Generate courtyard outline based on pad bounding box
   */
  private generateCourtyard(pads: EasyEDAPad[], origin: { x: number; y: number }): string {
    if (pads.length === 0) return '';

    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pad of pads) {
      const x = (pad.x - origin.x) * EE_TO_MM;
      const y = -(pad.y - origin.y) * EE_TO_MM;
      const hw = (pad.width * EE_TO_MM) / 2;
      const hh = (pad.height * EE_TO_MM) / 2;

      minX = Math.min(minX, x - hw);
      maxX = Math.max(maxX, x + hw);
      minY = Math.min(minY, y - hh);
      maxY = Math.max(maxY, y + hh);
    }

    // Add courtyard margin (0.25mm)
    const margin = 0.25;
    minX = roundTo(minX - margin, 3);
    maxX = roundTo(maxX + margin, 3);
    minY = roundTo(minY - margin, 3);
    maxY = roundTo(maxY + margin, 3);

    return `  (fp_rect (start ${minX} ${minY}) (end ${maxX} ${maxY})
    (stroke (width 0.05) (type solid))
    (fill none)
    (layer "F.CrtYd")
  )\n`;
  }

  /**
   * Generate 3D model reference
   */
  private generate3DModel(modelPath: string): string {
    return `  (model "${modelPath}"
    (offset (xyz 0 0 0))
    (scale (xyz 1 1 1))
    (rotate (xyz 0 0 0))
  )\n`;
  }

  /**
   * Map EasyEDA pad shape to KiCad pad shape
   */
  private mapPadShape(eeShape: string): string {
    const shape = eeShape.toUpperCase();
    switch (shape) {
      case 'ELLIPSE':
      case 'CIRCLE':
        return 'circle';
      case 'OVAL':
        return 'oval';
      case 'ROUNDRECT':
        return 'roundrect';
      case 'RECT':
      default:
        return 'rect';
    }
  }

  /**
   * Get layers for pad type
   */
  private getPadLayers(padType: string): string {
    if (padType === 'smd') {
      return '"F.Cu" "F.Paste" "F.Mask"';
    } else {
      return '"*.Cu" "*.Mask"';
    }
  }

  /**
   * Sanitize name for KiCad
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
  }
}

export const footprintConverter = new FootprintConverter();
