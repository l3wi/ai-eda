/**
 * EasyEDA to KiCad converters
 */

export { SymbolConverter, symbolConverter, type SymbolConversionOptions } from './symbol.js';
export { FootprintConverter, footprintConverter, type FootprintConversionOptions } from './footprint.js';
export {
  ensureSymLibTable,
  ensureFpLibTable,
  getSymbolReference,
  getFootprintReference,
  libraryExistsInTable,
} from './lib-table.js';
