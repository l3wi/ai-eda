/**
 * EasyEDA API client for component library fetching
 */

import type { EasyEDAComponentData, EasyEDAPin, EasyEDAPad } from '@ai-eda/common';
import { createLogger } from '@ai-eda/common';

const logger = createLogger('easyeda-api');

const API_ENDPOINT = 'https://easyeda.com/api/products/{lcsc_id}/components?version=6.4.19.5';
const ENDPOINT_3D_MODEL_STEP = 'https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}';
const ENDPOINT_3D_MODEL_OBJ = 'https://modules.easyeda.com/3dmodel/{uuid}';

export class EasyEDAClient {
  private userAgent = 'ai-eda-lcsc-mcp/1.0.0';

  /**
   * Fetch component data from EasyEDA API
   */
  async getComponentData(lcscPartNumber: string): Promise<EasyEDAComponentData | null> {
    const url = API_ENDPOINT.replace('{lcsc_id}', lcscPartNumber);

    logger.debug(`Fetching component data for: ${lcscPartNumber}`);

    const response = await fetch(url, {
      headers: {
        'Accept-Encoding': 'gzip, deflate',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch component: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.result) {
      return null;
    }

    return this.parseComponentData(data.result, lcscPartNumber);
  }

  /**
   * Download 3D model for a component
   */
  async get3DModel(uuid: string, format: 'step' | 'obj' = 'step'): Promise<Buffer | null> {
    const url = format === 'step'
      ? ENDPOINT_3D_MODEL_STEP.replace('{uuid}', uuid)
      : ENDPOINT_3D_MODEL_OBJ.replace('{uuid}', uuid);

    const response = await fetch(url, {
      headers: { 'User-Agent': this.userAgent },
    });

    if (!response.ok) {
      return null;
    }

    return Buffer.from(await response.arrayBuffer());
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

    return {
      info: {
        name: cPara.name || lcscId,
        prefix: cPara.pre || 'U',
        package: cPara.package || fpCPara?.package,
        manufacturer: cPara.BOM_Manufacturer,
        datasheet: lcscInfo.url,
        lcscId: lcscInfo.number || lcscId,
        jlcId: cPara['BOM_JLCPCB Part Class'],
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
