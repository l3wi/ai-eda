/**
 * EasyEDA Footprint to KiCad Footprint Converter
 * Converts EasyEDA footprint format to KiCad .kicad_mod format
 */

import type { EasyEDAComponentData, EasyEDAPad } from '../common/index.js';
import { KICAD_FOOTPRINT_VERSION, KICAD_LAYERS, roundTo } from '../common/index.js';
import { mapToKicadFootprint, getKicadFootprintRef } from './footprint-mapper.js';

// EasyEDA uses 10mil units
const EE_TO_MM = 0.254;

export interface FootprintConversionOptions {
  libraryName?: string;
  include3DModel?: boolean;
  modelPath?: string;
}

/**
 * Result of footprint resolution - either a KiCad standard reference or generated content
 */
export interface FootprintResult {
  type: 'reference' | 'generated';
  /** KiCad standard footprint reference (e.g., "Resistor_SMD:R_0603_1608Metric") */
  reference?: string;
  /** Generated .kicad_mod content for custom footprints */
  content?: string;
  /** Footprint name for file naming */
  name: string;
}

interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
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
    const { include3DModel = false } = options;

    // Calculate bounding box once for reuse
    const bounds = this.calculateBounds(footprint.pads, origin);

    // Map footprint type for attr token
    // EasyEDA uses 'tht' or 'thru_hole', KiCad attr uses 'through_hole' or 'smd'
    const attrType = this.mapFootprintAttr(footprint.type);

    let output = `(footprint "${name}"
\t(version ${KICAD_FOOTPRINT_VERSION})
\t(generator "ai-eda-jlc-mcp")
\t(layer "${KICAD_LAYERS.F_CU}")
\t(descr "${this.escapeString(info.description || name)}")
\t(tags "${this.escapeString(info.category || 'component')}")
`;

    // Add properties
    output += this.generateProperties(info, name);

    // Add attributes
    output += `\t(attr ${attrType})\n`;

    // Add pads
    for (const pad of footprint.pads) {
      output += this.generatePad(pad, origin);
    }

    // Add silkscreen outline
    output += this.generateSilkscreen(bounds);

    // Add fab outline
    output += this.generateFabOutline(bounds);

    // Add fab reference text
    output += this.generateFabReference();

    // Add courtyard (calculated from pads)
    output += this.generateCourtyard(bounds);

    // Add embedded_fonts declaration
    output += `\t(embedded_fonts no)\n`;

    // Add 3D model reference if available
    if (include3DModel && model3d && options.modelPath) {
      output += this.generate3DModel(options.modelPath);
    }

    output += `)`;

    return output;
  }

  /**
   * Get footprint using hybrid approach:
   * - Use KiCad standard footprint if available (for common packages)
   * - Generate custom footprint if no standard mapping exists
   */
  getFootprint(
    component: EasyEDAComponentData,
    options: FootprintConversionOptions = {}
  ): FootprintResult {
    const { info, footprint } = component;
    const packageName = footprint.name;
    const prefix = info.prefix;

    // Try to map to KiCad standard footprint
    const mapping = mapToKicadFootprint(packageName, prefix);

    if (mapping) {
      // Use KiCad standard footprint - no need to generate custom
      return {
        type: 'reference',
        reference: getKicadFootprintRef(mapping),
        name: mapping.footprint,
      };
    }

    // Generate custom footprint from EasyEDA data
    const content = this.convert(component, options);
    const name = this.sanitizeName(footprint.name);

    return {
      type: 'generated',
      content,
      name,
    };
  }

  /**
   * Calculate bounding box from pads
   */
  private calculateBounds(pads: EasyEDAPad[], origin: { x: number; y: number }): BoundingBox {
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

    // Handle empty pads case
    if (!isFinite(minX)) {
      return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Generate footprint properties with proper KiCad format
   * Only Reference and Value are visible; custom properties are hidden
   */
  private generateProperties(info: EasyEDAComponentData['info'], name: string): string {
    let props = '';

    // Reference (required, visible on silkscreen)
    props += `\t(property "Reference" "REF**"
\t\t(at 0 -3 0)
\t\t(layer "${KICAD_LAYERS.F_SILKS}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Value (required, visible on fab layer)
    props += `\t(property "Value" "${this.escapeString(this.sanitizeName(info.name))}"
\t\t(at 0 3 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Description (hidden custom property)
    if (info.description) {
      props += `\t(property "Description" "${this.escapeString(info.description)}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\thide
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
    }

    // LCSC ID (custom property, hidden)
    if (info.lcscId) {
      props += `\t(property "LCSC" "${info.lcscId}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\thide
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
    }

    // Manufacturer property (hidden)
    if (info.manufacturer) {
      props += `\t(property "Manufacturer" "${this.escapeString(info.manufacturer)}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\thide
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
    }

    // Component attributes as custom properties (hidden)
    if (info.attributes) {
      for (const [key, value] of Object.entries(info.attributes)) {
        props += `\t(property "${this.escapeString(key)}" "${this.escapeString(String(value))}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\thide
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
      }
    }

    return props;
  }

  /**
   * Generate a single pad entry
   */
  private generatePad(pad: EasyEDAPad, origin: { x: number; y: number }): string {
    const padType = pad.holeRadius ? 'thru_hole' : 'smd';
    // Use roundrect for SMD pads, map shape for THT
    const shape = padType === 'smd' ? 'roundrect' : this.mapPadShape(pad.shape);
    const layers = this.getPadLayers(padType);

    // Convert coordinates
    const x = roundTo((pad.x - origin.x) * EE_TO_MM, 4);
    const y = roundTo(-(pad.y - origin.y) * EE_TO_MM, 4);
    const w = roundTo(pad.width * EE_TO_MM, 4);
    const h = roundTo(pad.height * EE_TO_MM, 4);

    let output = `\t(pad "${pad.number}" ${padType} ${shape}
\t\t(at ${x} ${y})
\t\t(size ${w} ${h})
\t\t(layers ${layers})`;

    if (shape === 'roundrect') {
      output += `\n\t\t(roundrect_rratio 0.25)`;
    }

    if (pad.holeRadius) {
      // holeRadius is radius, drill expects diameter
      const drill = roundTo(pad.holeRadius * 2 * EE_TO_MM, 4);
      output += `\n\t\t(drill ${drill})`;
      // THT pads need remove_unused_layers
      output += `\n\t\t(remove_unused_layers no)`;
    }

    output += `\n\t)\n`;
    return output;
  }

  /**
   * Generate silkscreen outline on F.SilkS layer
   */
  private generateSilkscreen(bounds: BoundingBox): string {
    // Silkscreen should be slightly outside the pads
    const margin = 0.15;
    const minX = roundTo(bounds.minX - margin, 2);
    const maxX = roundTo(bounds.maxX + margin, 2);
    const minY = roundTo(bounds.minY - margin, 2);
    const maxY = roundTo(bounds.maxY + margin, 2);

    return this.generateOutlineLines(minX, minY, maxX, maxY, KICAD_LAYERS.F_SILKS, 0.12);
  }

  /**
   * Generate fab layer body outline
   */
  private generateFabOutline(bounds: BoundingBox): string {
    // Fab outline represents the actual component body
    const minX = roundTo(bounds.minX, 2);
    const maxX = roundTo(bounds.maxX, 2);
    const minY = roundTo(bounds.minY, 2);
    const maxY = roundTo(bounds.maxY, 2);

    return this.generateOutlineLines(minX, minY, maxX, maxY, KICAD_LAYERS.F_FAB, 0.1);
  }

  /**
   * Generate fab reference text
   */
  private generateFabReference(): string {
    return `\t(fp_text user "\${REFERENCE}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 0.5 0.5)
\t\t\t\t(thickness 0.08)
\t\t\t)
\t\t)
\t)\n`;
  }

  /**
   * Generate courtyard outline using fp_line elements
   */
  private generateCourtyard(bounds: BoundingBox): string {
    // Courtyard margin per IPC-7351
    const margin = 0.25;
    const minX = roundTo(bounds.minX - margin, 2);
    const maxX = roundTo(bounds.maxX + margin, 2);
    const minY = roundTo(bounds.minY - margin, 2);
    const maxY = roundTo(bounds.maxY + margin, 2);

    return this.generateOutlineLines(minX, minY, maxX, maxY, KICAD_LAYERS.F_CRTYD, 0.05);
  }

  /**
   * Generate 4 fp_line elements forming a rectangle
   */
  private generateOutlineLines(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    layer: string,
    strokeWidth: number,
    strokeType: string = 'solid'
  ): string {
    const lines = [
      { start: [minX, minY], end: [maxX, minY] }, // top
      { start: [maxX, minY], end: [maxX, maxY] }, // right
      { start: [maxX, maxY], end: [minX, maxY] }, // bottom
      { start: [minX, maxY], end: [minX, minY] }, // left
    ];

    let output = '';
    for (const line of lines) {
      output += `\t(fp_line
\t\t(start ${line.start[0]} ${line.start[1]})
\t\t(end ${line.end[0]} ${line.end[1]})
\t\t(stroke
\t\t\t(width ${strokeWidth})
\t\t\t(type ${strokeType})
\t\t)
\t\t(layer "${layer}")
\t)\n`;
    }

    return output;
  }

  /**
   * Generate 3D model reference
   */
  private generate3DModel(modelPath: string): string {
    return `\t(model "${modelPath}"
\t\t(offset
\t\t\t(xyz 0 0 0)
\t\t)
\t\t(scale
\t\t\t(xyz 1 1 1)
\t\t)
\t\t(rotate
\t\t\t(xyz 0 0 0)
\t\t)
\t)\n`;
  }

  /**
   * Map EasyEDA footprint type to KiCad attr token
   * KiCad valid values: through_hole, smd, virtual, board_only
   */
  private mapFootprintAttr(eeType: string): string {
    const type = eeType.toLowerCase();
    switch (type) {
      case 'tht':
      case 'thru_hole':
      case 'through_hole':
        return 'through_hole';
      case 'smd':
      case 'smt':
        return 'smd';
      default:
        // Default to smd if unknown
        return 'smd';
    }
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
   * Layer order: Cu, Mask, Paste (per KiCad standard)
   */
  private getPadLayers(padType: string): string {
    if (padType === 'smd') {
      return '"F.Cu" "F.Mask" "F.Paste"';
    } else {
      return '"*.Cu" "*.Mask"';
    }
  }

  /**
   * Sanitize name for KiCad
   */
  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  }

  /**
   * Escape special characters for KiCad strings
   */
  private escapeString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }
}

export const footprintConverter = new FootprintConverter();
