/**
 * KiCad layer names and constants
 */

// Standard layer names
export const KICAD_LAYERS = {
  // Copper layers
  F_CU: 'F.Cu',
  B_CU: 'B.Cu',
  IN1_CU: 'In1.Cu',
  IN2_CU: 'In2.Cu',
  IN3_CU: 'In3.Cu',
  IN4_CU: 'In4.Cu',

  // Technical layers - front
  F_ADHES: 'F.Adhes',
  F_PASTE: 'F.Paste',
  F_SILKS: 'F.SilkS',
  F_MASK: 'F.Mask',
  F_CRTYD: 'F.CrtYd',
  F_FAB: 'F.Fab',

  // Technical layers - back
  B_ADHES: 'B.Adhes',
  B_PASTE: 'B.Paste',
  B_SILKS: 'B.SilkS',
  B_MASK: 'B.Mask',
  B_CRTYD: 'B.CrtYd',
  B_FAB: 'B.Fab',

  // Other layers
  EDGE_CUTS: 'Edge.Cuts',
  MARGIN: 'Margin',
  DWGS_USER: 'Dwgs.User',
  CMTS_USER: 'Cmts.User',
  ECO1_USER: 'Eco1.User',
  ECO2_USER: 'Eco2.User',
} as const;

// Layer groups for common operations
export const KICAD_LAYER_GROUPS = {
  ALL_CU: ['*.Cu'],
  ALL_MASK: ['*.Mask'],
  FRONT_LAYERS: ['F.Cu', 'F.Paste', 'F.Mask'],
  BACK_LAYERS: ['B.Cu', 'B.Paste', 'B.Mask'],
  SMD_FRONT: ['F.Cu', 'F.Paste', 'F.Mask'],
  SMD_BACK: ['B.Cu', 'B.Paste', 'B.Mask'],
  THT: ['*.Cu', '*.Mask'],
} as const;

// Default text sizes
export const KICAD_DEFAULTS = {
  TEXT_SIZE: 1.0,      // mm
  TEXT_THICKNESS: 0.15, // mm
  WIRE_WIDTH: 0.25,    // mm (schematic)
  GRID_SCHEMATIC: 2.54, // mm (100 mil)
  GRID_PCB: 0.25,      // mm
  PIN_LENGTH: 2.54,    // mm (100 mil)
  PIN_NAME_OFFSET: 1.016, // mm (40 mil)
} as const;

// Symbol generator version
export const KICAD_SYMBOL_VERSION = '20231120';
export const KICAD_FOOTPRINT_VERSION = '20231120';

// Pin electrical types
export const KICAD_PIN_TYPES = [
  'input',
  'output',
  'bidirectional',
  'tri_state',
  'passive',
  'free',
  'unspecified',
  'power_in',
  'power_out',
  'open_collector',
  'open_emitter',
  'no_connect',
] as const;

// Pad shapes
export const KICAD_PAD_SHAPES = [
  'circle',
  'rect',
  'oval',
  'trapezoid',
  'roundrect',
  'custom',
] as const;

// Pad types
export const KICAD_PAD_TYPES = [
  'thru_hole',
  'smd',
  'connect',
  'np_thru_hole',
] as const;
