/**
 * EasyEDA API client for component library fetching
 *
 * Parses all footprint shape types: PAD, TRACK, HOLE, CIRCLE, ARC, RECT, VIA, TEXT
 */

import type {
  EasyEDAComponentData,
  EasyEDAPin,
  EasyEDAPad,
  EasyEDATrack,
  EasyEDAHole,
  EasyEDACircle,
  EasyEDAArc,
  EasyEDARect,
  EasyEDAVia,
  EasyEDAText,
  // Symbol shape types
  EasyEDASymbolRect,
  EasyEDASymbolCircle,
  EasyEDASymbolEllipse,
  EasyEDASymbolArc,
  EasyEDASymbolPolyline,
  EasyEDASymbolPolygon,
  EasyEDASymbolPath,
} from '../common/index.js';
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

// Helper to parse boolean from EasyEDA format (empty string = false, any value = true)
function parseBool(value: string | undefined): boolean {
  return value !== undefined && value !== '' && value !== '0';
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

    // Parse symbol shapes - pins and all decorative elements
    const pins: EasyEDAPin[] = [];
    const symbolRects: EasyEDASymbolRect[] = [];
    const symbolCircles: EasyEDASymbolCircle[] = [];
    const symbolEllipses: EasyEDASymbolEllipse[] = [];
    const symbolArcs: EasyEDASymbolArc[] = [];
    const symbolPolylines: EasyEDASymbolPolyline[] = [];
    const symbolPolygons: EasyEDASymbolPolygon[] = [];
    const symbolPaths: EasyEDASymbolPath[] = [];

    if (dataStr?.shape) {
      for (const line of dataStr.shape) {
        // Get the shape designator (first field before ~)
        const designator = line.split('~')[0];

        switch (designator) {
          case 'P': {
            const pin = this.parseSymbolPin(line);
            if (pin) pins.push(pin);
            break;
          }
          case 'R': {
            const rect = this.parseSymbolRect(line);
            if (rect) symbolRects.push(rect);
            break;
          }
          case 'C': {
            const circle = this.parseSymbolCircle(line);
            if (circle) symbolCircles.push(circle);
            break;
          }
          case 'E': {
            const ellipse = this.parseSymbolEllipse(line);
            if (ellipse) symbolEllipses.push(ellipse);
            break;
          }
          case 'A': {
            const arc = this.parseSymbolArc(line);
            if (arc) symbolArcs.push(arc);
            break;
          }
          case 'PL': {
            const polyline = this.parseSymbolPolyline(line);
            if (polyline) symbolPolylines.push(polyline);
            break;
          }
          case 'PG': {
            const polygon = this.parseSymbolPolygon(line);
            if (polygon) symbolPolygons.push(polygon);
            break;
          }
          case 'PT': {
            const path = this.parseSymbolPath(line);
            if (path) symbolPaths.push(path);
            break;
          }
          case 'T':
            // Text elements - skip for now (we have our own text placement)
            break;
          default:
            // Unknown shape type - log for debugging
            if (designator && designator.length > 0 && designator.length < 10) {
              logger.debug(`Unknown symbol shape type: ${designator}`);
            }
        }
      }
    }

    // Parse ALL footprint shape types
    const pads: EasyEDAPad[] = [];
    const tracks: EasyEDATrack[] = [];
    const holes: EasyEDAHole[] = [];
    const circles: EasyEDACircle[] = [];
    const arcs: EasyEDAArc[] = [];
    const rects: EasyEDARect[] = [];
    const texts: EasyEDAText[] = [];
    const vias: EasyEDAVia[] = [];

    const fpDataStr = packageDetail?.dataStr;
    const fpCPara = fpDataStr?.head?.c_para || {};

    // Get 3D model info
    let model3d: { name: string; uuid: string } | undefined;

    if (fpDataStr?.shape) {
      for (const line of fpDataStr.shape) {
        const designator = line.split('~')[0];

        switch (designator) {
          case 'PAD': {
            const pad = this.parsePad(line);
            if (pad) pads.push(pad);
            break;
          }
          case 'TRACK': {
            const track = this.parseTrack(line);
            if (track) tracks.push(track);
            break;
          }
          case 'HOLE': {
            const hole = this.parseHole(line);
            if (hole) holes.push(hole);
            break;
          }
          case 'CIRCLE': {
            const circle = this.parseCircle(line);
            if (circle) circles.push(circle);
            break;
          }
          case 'ARC': {
            const arc = this.parseArc(line);
            if (arc) arcs.push(arc);
            break;
          }
          case 'RECT': {
            const rect = this.parseRect(line);
            if (rect) rects.push(rect);
            break;
          }
          case 'VIA': {
            const via = this.parseVia(line);
            if (via) vias.push(via);
            break;
          }
          case 'TEXT': {
            const text = this.parseText(line);
            if (text) texts.push(text);
            break;
          }
          case 'SVGNODE': {
            // Extract 3D model info
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
            break;
          }
          case 'SOLIDREGION':
            // Skip for now - complex polygon fills
            break;
          default:
            // Unknown shape type - log for debugging
            if (designator && designator.length > 0) {
              logger.debug(`Unknown footprint shape type: ${designator}`);
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
        rectangles: symbolRects,
        circles: symbolCircles,
        ellipses: symbolEllipses,
        arcs: symbolArcs,
        polylines: symbolPolylines,
        polygons: symbolPolygons,
        paths: symbolPaths,
        origin: symbolOrigin,
      },
      footprint: {
        name: fpCPara?.package || 'Unknown',
        type: result.SMT && !packageDetail?.title?.includes('-TH_') ? 'smd' : 'tht',
        pads,
        tracks,
        holes,
        circles,
        arcs,
        rects,
        texts,
        vias,
        origin: footprintOrigin,
      },
      model3d,
      rawData: result,
    };
  }

  /**
   * Parse EasyEDA symbol pin format
   * Format: P~show~type~number~x~y~rotation~id~locked^^dotData^^pathData^^nameData^^numData^^dot^^clock
   *
   * Segments:
   * [0] = P~show~type~number~x~y~rotation~id~locked (main settings)
   * [1] = dot display data (not inverted indicator)
   * [2] = SVG path for pin line (M x y h LENGTH or v LENGTH)
   * [3] = name text data (1~x~y~rotation~name~fontSize~...)
   * [4] = number text data
   * [5] = inverted bubble (dot) indicator - "1" if inverted
   * [6] = clock triangle indicator - non-empty if clock
   */
  private parseSymbolPin(pinData: string): EasyEDAPin | null {
    try {
      const segments = pinData.split('^^');
      const settings = segments[0].split('~');
      const nameSegment = segments[3]?.split('~') || [];

      // Extract pin length from SVG path segment (segment 2)
      // Path format: "M x y h LENGTH" (horizontal) or "M x y v LENGTH" (vertical)
      let pinLength = 100; // default 100 EasyEDA units
      if (segments[2]) {
        const pathMatch = segments[2].match(/[hv]\s*(-?[\d.]+)/i);
        if (pathMatch) {
          pinLength = Math.abs(parseFloat(pathMatch[1]));
        }
      }

      // Check for inverted (dot/bubble) indicator - segment 5
      // Format: "is_displayed~x~y" where is_displayed=1 means bubble is shown
      const dotFields = segments[5]?.split('~') || [];
      const hasDot = dotFields[0] === '1';

      // Check for clock indicator - segment 6
      // Format: "is_displayed~path" where is_displayed=1 means clock triangle is shown
      const clockFields = segments[6]?.split('~') || [];
      const hasClock = clockFields[0] === '1';

      // Extract rotation from settings
      const rotation = parseFloat(settings[6]) || 0;

      return {
        number: settings[3] || '',
        name: nameSegment[4] || '',
        electricalType: settings[2] || '0',
        x: parseFloat(settings[4]) || 0,
        y: parseFloat(settings[5]) || 0,
        rotation,
        hasDot,
        hasClock,
        pinLength,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Rectangle shape
   * Format: R~x~y~rx~ry~width~height~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolRect(data: string): EasyEDASymbolRect | null {
    try {
      const f = data.split('~');
      return {
        x: parseFloat(f[1]) || 0,
        y: parseFloat(f[2]) || 0,
        rx: parseFloat(f[3]) || 0,        // corner radius X
        ry: parseFloat(f[4]) || 0,        // corner radius Y
        width: parseFloat(f[5]) || 0,
        height: parseFloat(f[6]) || 0,
        strokeColor: f[7] || '#000000',
        strokeWidth: parseFloat(f[8]) || 1,
        fillColor: f[10] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Circle shape
   * Format: C~cx~cy~radius~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolCircle(data: string): EasyEDASymbolCircle | null {
    try {
      const f = data.split('~');
      return {
        cx: parseFloat(f[1]) || 0,
        cy: parseFloat(f[2]) || 0,
        radius: parseFloat(f[3]) || 0,
        strokeColor: f[4] || '#000000',
        strokeWidth: parseFloat(f[5]) || 1,
        fillColor: f[7] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Ellipse shape
   * Format: E~cx~cy~rx~ry~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolEllipse(data: string): EasyEDASymbolEllipse | null {
    try {
      const f = data.split('~');
      return {
        cx: parseFloat(f[1]) || 0,
        cy: parseFloat(f[2]) || 0,
        radiusX: parseFloat(f[3]) || 0,
        radiusY: parseFloat(f[4]) || 0,
        strokeColor: f[5] || '#000000',
        strokeWidth: parseFloat(f[6]) || 1,
        fillColor: f[8] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Arc shape (SVG path format)
   * Format: A~path~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolArc(data: string): EasyEDASymbolArc | null {
    try {
      const f = data.split('~');
      return {
        path: f[1] || '',              // SVG arc path "M x1 y1 A rx ry rotation largeArc sweep x2 y2"
        strokeColor: f[2] || '#000000',
        strokeWidth: parseFloat(f[3]) || 1,
        fillColor: f[5] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Polyline shape (open path)
   * Format: PL~points~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolPolyline(data: string): EasyEDASymbolPolyline | null {
    try {
      const f = data.split('~');
      return {
        points: f[1] || '',             // Space-separated "x1 y1 x2 y2 ..."
        strokeColor: f[2] || '#000000',
        strokeWidth: parseFloat(f[3]) || 1,
        fillColor: f[5] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol Polygon shape (closed filled path)
   * Format: PG~points~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolPolygon(data: string): EasyEDASymbolPolygon | null {
    try {
      const f = data.split('~');
      return {
        points: f[1] || '',             // Space-separated "x1 y1 x2 y2 ..."
        strokeColor: f[2] || '#000000',
        strokeWidth: parseFloat(f[3]) || 1,
        fillColor: f[5] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse symbol SVG Path shape
   * Format: PT~path~strokeColor~strokeWidth~strokeStyle~fillColor~id~locked
   */
  private parseSymbolPath(data: string): EasyEDASymbolPath | null {
    try {
      const f = data.split('~');
      return {
        path: f[1] || '',               // SVG path commands (M/L/Z/C/A)
        strokeColor: f[2] || '#000000',
        strokeWidth: parseFloat(f[3]) || 1,
        fillColor: f[5] || 'none',
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse PAD element - 18 fields
   * Format: PAD~shape~cx~cy~width~height~layerId~net~number~holeRadius~points~rotation~id~holeLength~holePoint~isPlated~isLocked
   */
  private parsePad(data: string): EasyEDAPad | null {
    try {
      const f = data.split('~');
      return {
        shape: f[1] || 'RECT',
        centerX: parseFloat(f[2]) || 0,
        centerY: parseFloat(f[3]) || 0,
        width: parseFloat(f[4]) || 0,
        height: parseFloat(f[5]) || 0,
        layerId: parseInt(f[6]) || 1,
        net: f[7] || '',
        number: f[8] || '',
        holeRadius: parseFloat(f[9]) || 0,
        points: f[10] || '',
        rotation: parseFloat(f[11]) || 0,
        id: f[12] || '',
        holeLength: parseFloat(f[13]) || 0,
        holePoint: f[14] || '',
        isPlated: parseBool(f[15]),
        isLocked: parseBool(f[16]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse TRACK element - silkscreen/fab lines
   * Format: TRACK~strokeWidth~layerId~net~points~id~isLocked
   */
  private parseTrack(data: string): EasyEDATrack | null {
    try {
      const f = data.split('~');
      return {
        strokeWidth: parseFloat(f[1]) || 0,
        layerId: parseInt(f[2]) || 1,
        net: f[3] || '',
        points: f[4] || '',
        id: f[5] || '',
        isLocked: parseBool(f[6]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse HOLE element - NPTH
   * Format: HOLE~cx~cy~radius~id~isLocked
   */
  private parseHole(data: string): EasyEDAHole | null {
    try {
      const f = data.split('~');
      return {
        centerX: parseFloat(f[1]) || 0,
        centerY: parseFloat(f[2]) || 0,
        radius: parseFloat(f[3]) || 0,
        id: f[4] || '',
        isLocked: parseBool(f[5]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse CIRCLE element
   * Format: CIRCLE~cx~cy~radius~strokeWidth~layerId~id~isLocked
   */
  private parseCircle(data: string): EasyEDACircle | null {
    try {
      const f = data.split('~');
      return {
        cx: parseFloat(f[1]) || 0,
        cy: parseFloat(f[2]) || 0,
        radius: parseFloat(f[3]) || 0,
        strokeWidth: parseFloat(f[4]) || 0,
        layerId: parseInt(f[5]) || 1,
        id: f[6] || '',
        isLocked: parseBool(f[7]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse ARC element with SVG path
   * Format: ARC~strokeWidth~layerId~net~path~helperDots~id~isLocked
   */
  private parseArc(data: string): EasyEDAArc | null {
    try {
      const f = data.split('~');
      return {
        strokeWidth: parseFloat(f[1]) || 0,
        layerId: parseInt(f[2]) || 1,
        net: f[3] || '',
        path: f[4] || '',
        helperDots: f[5] || '',
        id: f[6] || '',
        isLocked: parseBool(f[7]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse RECT element
   * Format: RECT~x~y~width~height~strokeWidth~id~layerId~isLocked
   */
  private parseRect(data: string): EasyEDARect | null {
    try {
      const f = data.split('~');
      return {
        x: parseFloat(f[1]) || 0,
        y: parseFloat(f[2]) || 0,
        width: parseFloat(f[3]) || 0,
        height: parseFloat(f[4]) || 0,
        strokeWidth: parseFloat(f[5]) || 0,
        id: f[6] || '',
        layerId: parseInt(f[7]) || 1,
        isLocked: parseBool(f[8]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse VIA element
   * Format: VIA~cx~cy~diameter~net~radius~id~isLocked
   */
  private parseVia(data: string): EasyEDAVia | null {
    try {
      const f = data.split('~');
      return {
        centerX: parseFloat(f[1]) || 0,
        centerY: parseFloat(f[2]) || 0,
        diameter: parseFloat(f[3]) || 0,
        net: f[4] || '',
        radius: parseFloat(f[5]) || 0,
        id: f[6] || '',
        isLocked: parseBool(f[7]),
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse TEXT element
   * Format: TEXT~type~cx~cy~strokeWidth~rotation~mirror~layerId~net~fontSize~text~textPath~isDisplayed~id~isLocked
   */
  private parseText(data: string): EasyEDAText | null {
    try {
      const f = data.split('~');
      return {
        type: f[1] || '',
        centerX: parseFloat(f[2]) || 0,
        centerY: parseFloat(f[3]) || 0,
        strokeWidth: parseFloat(f[4]) || 0,
        rotation: parseFloat(f[5]) || 0,
        mirror: f[6] || '',
        layerId: parseInt(f[7]) || 1,
        net: f[8] || '',
        fontSize: parseFloat(f[9]) || 0,
        text: f[10] || '',
        textPath: f[11] || '',
        isDisplayed: parseBool(f[12]),
        id: f[13] || '',
        isLocked: parseBool(f[14]),
      };
    } catch {
      return null;
    }
  }
}

export const easyedaClient = new EasyEDAClient();
