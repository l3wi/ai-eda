/**
 * EasyEDA Footprint to KiCad Footprint Converter
 * Converts EasyEDA footprint format to KiCad .kicad_mod format
 */

import { randomUUID } from 'crypto';
import type { EasyEDAComponentData, EasyEDAPad } from '@ai-eda/common';
import { KICAD_FOOTPRINT_VERSION, KICAD_DEFAULTS, KICAD_LAYERS, roundTo } from '@ai-eda/common';

// EasyEDA uses 10mil units
const EE_TO_MM = 0.254;

// Generate a UUID for KiCad elements
function uuid(): string {
  return randomUUID();
}

export interface FootprintConversionOptions {
  libraryName?: string;
  include3DModel?: boolean;
  modelPath?: string;
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

    let output = `(footprint "${name}"
\t(version ${KICAD_FOOTPRINT_VERSION})
\t(generator "ai-eda-jlc-mcp")
\t(generator_version "1.0.0")
\t(layer "${KICAD_LAYERS.F_CU}")
\t(descr "${this.escapeString(info.description || name)}")
\t(tags "${this.escapeString(info.category || 'component')}")
`;

    // Add properties
    output += this.generateProperties(info, name);

    // Add attributes
    output += `\t(attr ${footprint.type})\n`;

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

    // Add 3D model reference if available
    if (include3DModel && model3d && options.modelPath) {
      output += this.generate3DModel(options.modelPath);
    }

    output += `)`;

    return output;
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
   */
  private generateProperties(info: EasyEDAComponentData['info'], name: string): string {
    let props = '';

    // Reference (required)
    props += `\t(property "Reference" "REF**"
\t\t(at 0 -3 0)
\t\t(layer "${KICAD_LAYERS.F_SILKS}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Value (required)
    props += `\t(property "Value" "${this.escapeString(this.sanitizeName(info.name))}"
\t\t(at 0 3 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1 1)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Footprint (required, hidden, unlocked)
    props += `\t(property "Footprint" "${name}"
\t\t(at 0 0 0)
\t\t(unlocked yes)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Datasheet (required, hidden, unlocked)
    props += `\t(property "Datasheet" "${this.escapeString(info.datasheet || '')}"
\t\t(at 0 0 0)
\t\t(unlocked yes)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // Description (required, hidden, unlocked)
    props += `\t(property "Description" "${this.escapeString(info.description || '')}"
\t\t(at 0 0 0)
\t\t(unlocked yes)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;

    // LCSC ID (custom property)
    if (info.lcscId) {
      props += `\t(property "LCSC" "${info.lcscId}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
    }

    // Manufacturer property
    if (info.manufacturer) {
      props += `\t(property "Manufacturer" "${this.escapeString(info.manufacturer)}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
\t\t(effects
\t\t\t(font
\t\t\t\t(size 1.27 1.27)
\t\t\t\t(thickness 0.15)
\t\t\t)
\t\t)
\t)\n`;
    }

    // Component attributes as custom properties
    if (info.attributes) {
      for (const [key, value] of Object.entries(info.attributes)) {
        props += `\t(property "${this.escapeString(key)}" "${this.escapeString(value)}"
\t\t(at 0 0 0)
\t\t(layer "${KICAD_LAYERS.F_FAB}")
\t\t(hide yes)
\t\t(uuid "${uuid()}")
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
   * Generate a single pad entry with UUID
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
    }

    output += `\n\t\t(uuid "${uuid()}")
\t)\n`;
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
\t\t(uuid "${uuid()}")
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

    return this.generateOutlineLines(minX, minY, maxX, maxY, KICAD_LAYERS.F_CRTYD, 0.05, 'default');
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
\t\t(uuid "${uuid()}")
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
