/**
 * EasyEDA format types for component data from LCSC/EasyEDA API
 */

export interface EasyEDAComponent {
  uuid: string;
  lcsc: string;
  title: string;
  description: string;
  symbol: EasyEDASymbol;
  footprint: EasyEDAFootprint;
  attributes: Record<string, string>;
}

export interface EasyEDASymbol {
  docType: string;
  head: EasyEDAHead;
  canvas: string;
  shape: string[];
}

export interface EasyEDAFootprint {
  docType: string;
  head: EasyEDAHead;
  canvas: string;
  shape: string[];
}

export interface EasyEDAHead {
  x: string;
  y: string;
  c_para?: Record<string, string>;
  [key: string]: unknown;
}

export interface EasyEDAPin {
  number: string;
  name: string;
  electricalType: string;
  x: number;
  y: number;
  rotation: number;
}

export interface EasyEDAPad {
  number: string;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: string;
  holeRadius?: number;
  rotation: number;
}

export interface EasyEDAComponentData {
  info: {
    name: string;
    prefix: string;
    package?: string;
    manufacturer?: string;
    datasheet?: string;        // Product page URL
    datasheetPdf?: string;     // Actual PDF datasheet URL
    lcscId?: string;
    jlcId?: string;
    description?: string;
    category?: string;
    attributes?: Record<string, string>;
    // CDFER parity fields
    stock?: number;
    price?: number;
    minOrderQty?: number;
    process?: 'SMT' | 'THT';
    partClass?: string;
    partNumber?: string;
  };
  symbol: {
    pins: EasyEDAPin[];
    shapes: string[];
    origin: { x: number; y: number };
  };
  footprint: {
    name: string;
    type: 'smd' | 'tht';
    pads: EasyEDAPad[];
    origin: { x: number; y: number };
  };
  model3d?: {
    name: string;
    uuid: string;
  };
  rawData: object;
}
