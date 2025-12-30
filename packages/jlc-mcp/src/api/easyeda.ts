/**
 * EasyEDA API client for component library fetching
 */

import type { EasyEDAComponentData, EasyEDAPin, EasyEDAPad } from '../common/index.js';
import { createLogger } from '../common/index.js';
import { execSync } from 'child_process';

const logger = createLogger('easyeda-api');

const API_ENDPOINT = 'https://easyeda.com/api/products/{lcsc_id}/components?version=6.4.19.5';
const ENDPOINT_3D_MODEL_STEP = 'https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}';
const ENDPOINT_3D_MODEL_OBJ = 'https://modules.easyeda.com/3dmodel/{uuid}';

/**
 * Fetch URL using curl as fallback when Node fetch fails (e.g., proxy issues)
 */
async function fetchWithCurlFallback(url: string, options: { binary?: boolean } = {}): Promise<string | Buffer> {
  // Try native fetch first
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
    });

    if (response.ok) {
      if (options.binary) {
        return Buffer.from(await response.arrayBuffer());
      }
      return await response.text();
    }
  } catch (error) {
    logger.debug(`Native fetch failed, falling back to curl: ${error}`);
  }

  // Fallback to curl
  try {
    const curlArgs = [
      'curl',
      '-s',
      '-H', '"Accept: application/json"',
      '-H', '"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"',
      `"${url}"`,
    ];

    if (options.binary) {
      const result = execSync(curlArgs.join(' '), { maxBuffer: 50 * 1024 * 1024 });
      return result;
    }

    const result = execSync(curlArgs.join(' '), { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    return result;
  } catch (error) {
    throw new Error(`Both fetch and curl failed for URL: ${url}`);
  }
}

export class EasyEDAClient {
  private userAgent = 'ai-eda-lcsc-mcp/1.0.0';

  /**
   * Fetch component data from EasyEDA API
   */
  async getComponentData(lcscPartNumber: string): Promise<EasyEDAComponentData | null> {
    const url = API_ENDPOINT.replace('{lcsc_id}', lcscPartNumber);

    logger.debug(`Fetching component data for: ${lcscPartNumber}`);

    try {
      const responseText = await fetchWithCurlFallback(url) as string;
      const data = JSON.parse(responseText);

      if (!data.result) {
        return null;
      }

      return this.parseComponentData(data.result, lcscPartNumber);
    } catch (error) {
      logger.error(`Failed to fetch component ${lcscPartNumber}:`, error);
      throw error;
    }
  }

  /**
   * Download 3D model for a component
   */
  async get3DModel(uuid: string, format: 'step' | 'obj' = 'step'): Promise<Buffer | null> {
    const url = format === 'step'
      ? ENDPOINT_3D_MODEL_STEP.replace('{uuid}', uuid)
      : ENDPOINT_3D_MODEL_OBJ.replace('{uuid}', uuid);

    try {
      const result = await fetchWithCurlFallback(url, { binary: true });
      return result as Buffer;
    } catch {
      return null;
    }
  }

  /**
   * Parse raw EasyEDA API response into structured data
   */
  private parseComponentData(result: any, lcscId: string): EasyEDAComponentData {
    const dataStr = result.dataStr;
    const packageDetail = result.packageDetail;
    const lcscInfo = result.lcsc || {};
    const cPara = dataStr?.head?.c_para || {};

    // Parse symbol pins
    const pins: EasyEDAPin[] = [];
    const shapes: string[] = [];

    if (dataStr?.shape) {
      for (const line of dataStr.shape) {
        if (line.startsWith('P~')) {
          const pin = this.parseSymbolPin(line);
          if (pin) pins.push(pin);
        } else {
          shapes.push(line);
        }
      }
    }

    // Parse footprint pads
    const pads: EasyEDAPad[] = [];
    const fpDataStr = packageDetail?.dataStr;
    const fpCPara = fpDataStr?.head?.c_para || {};

    if (fpDataStr?.shape) {
      for (const line of fpDataStr.shape) {
        if (line.startsWith('PAD~')) {
          const pad = this.parseFootprintPad(line);
          if (pad) pads.push(pad);
        }
      }
    }

    // Get 3D model info
    let model3d: { name: string; uuid: string } | undefined;
    if (fpDataStr?.shape) {
      for (const line of fpDataStr.shape) {
        if (line.startsWith('SVGNODE~')) {
          try {
            const jsonStr = line.split('~')[1];
            const svgData = JSON.parse(jsonStr);
            if (svgData?.attrs?.uuid) {
              model3d = {
                name: svgData.attrs.title || '3D Model',
                uuid: svgData.attrs.uuid,
              };
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Get origins for coordinate normalization
    const symbolOrigin = {
      x: parseFloat(dataStr?.head?.x) || 0,
      y: parseFloat(dataStr?.head?.y) || 0,
    };
    const footprintOrigin = {
      x: parseFloat(fpDataStr?.head?.x) || 0,
      y: parseFloat(fpDataStr?.head?.y) || 0,
    };

    // Extract attributes from c_para (BOM_ prefixed fields)
    const attributes: Record<string, string> = {};
    for (const [key, value] of Object.entries(cPara)) {
      if (key.startsWith('BOM_') && value && typeof value === 'string') {
        // Clean up key name: "BOM_Resistance" -> "Resistance"
        const cleanKey = key.replace(/^BOM_/, '');
        if (cleanKey !== 'Manufacturer' && cleanKey !== 'JLCPCB Part Class') {
          attributes[cleanKey] = value;
        }
      }
    }

    return {
      info: {
        name: cPara.name || lcscId,
        prefix: cPara.pre || 'U',
        package: cPara.package || fpCPara?.package,
        manufacturer: cPara.BOM_Manufacturer || cPara.Manufacturer,
        datasheet: lcscInfo.url,
        lcscId: lcscInfo.number || lcscId,
        jlcId: cPara['BOM_JLCPCB Part Class'],
        description: result.title || cPara.name,
        category: result.category || undefined,
        attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
        // CDFER parity fields
        stock: lcscInfo.stock,
        price: lcscInfo.price,
        minOrderQty: lcscInfo.min,
        process: result.SMT ? 'SMT' : 'THT',
        partClass: cPara['JLCPCB Part Class'],
        partNumber: cPara['Manufacturer Part'],
      },
      symbol: {
        pins,
        shapes,
        origin: symbolOrigin,
      },
      footprint: {
        name: fpCPara?.package || 'Unknown',
        type: result.SMT && !packageDetail?.title?.includes('-TH_') ? 'smd' : 'tht',
        pads,
        origin: footprintOrigin,
      },
      model3d,
      rawData: result,
    };
  }

  /**
   * Parse EasyEDA symbol pin format
   * Format: P~show~type~number~x~y~...^^...^^...^^1~x~y~0~NAME~...^^...
   */
  private parseSymbolPin(pinData: string): EasyEDAPin | null {
    try {
      const segments = pinData.split('^^');
      const settings = segments[0].split('~');
      const nameSegment = segments[3]?.split('~') || [];

      return {
        number: settings[3] || '',
        name: nameSegment[4] || '',
        electricalType: settings[2] || '0',
        x: parseFloat(settings[4]) || 0,
        y: parseFloat(settings[5]) || 0,
        rotation: 0,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse EasyEDA footprint pad format
   * Format: PAD~shape~x~y~width~height~layer~[empty]~padNumber~holeType~...
   */
  private parseFootprintPad(padData: string): EasyEDAPad | null {
    try {
      const fields = padData.split('~');
      const holeValue = parseFloat(fields[9]) || 0;

      return {
        number: fields[8] || '',
        shape: fields[1] || 'RECT',
        x: parseFloat(fields[2]) || 0,
        y: parseFloat(fields[3]) || 0,
        width: parseFloat(fields[4]) || 0,
        height: parseFloat(fields[5]) || 0,
        layer: fields[6] || '1',
        holeRadius: holeValue > 0 ? holeValue : undefined,
        rotation: 0,
      };
    } catch {
      return null;
    }
  }
}

export const easyedaClient = new EasyEDAClient();
