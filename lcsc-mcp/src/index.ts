#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// API Endpoints
const API_ENDPOINT = "https://easyeda.com/api/products/{lcsc_id}/components?version=6.4.19.5";
const ENDPOINT_3D_MODEL_OBJ = "https://modules.easyeda.com/3dmodel/{uuid}";
const ENDPOINT_3D_MODEL_STEP = "https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}";
const LCSC_SEARCH_API = "https://wmsc.lcsc.com/ftms/query/product/search";

// Types
interface ComponentInfo {
  name: string;
  prefix: string;
  package?: string;
  manufacturer?: string;
  datasheet?: string;
  lcsc_id?: string;
  jlc_id?: string;
}

interface SymbolPin {
  number: string;
  name: string;
  electrical_type: string;
  x: number;
  y: number;
}

interface FootprintPad {
  number: string;
  shape: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layer: string;
  hole_radius?: number;
}

interface ComponentData {
  info: ComponentInfo;
  symbol: {
    pins: SymbolPin[];
    shapes: string[];
    origin: { x: number; y: number };
  };
  footprint: {
    name: string;
    type: "smd" | "tht";
    pads: FootprintPad[];
    origin: { x: number; y: number };
  };
  model_3d?: {
    name: string;
    uuid: string;
  };
  raw_data: object;
}

// Helper to fetch with proper headers
async function fetchEasyEDA(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      "Accept-Encoding": "gzip, deflate",
      "Accept": "application/json, text/javascript, */*; q=0.01",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      "User-Agent": "lcsc-mcp/1.0.0",
    },
  });
}

// Parse symbol pin data from EasyEDA format
// Format: P~show~type~number~x~y~...^^...^^...^^1~x~y~0~NAME~...^^...
function parseSymbolPin(pinData: string): SymbolPin | null {
  try {
    const segments = pinData.split("^^");
    const settings = segments[0].split("~");
    const nameSegment = segments[3]?.split("~") || [];

    return {
      number: settings[3] || "",
      name: nameSegment[4] || "", // Pin name is at index 4, not 0
      electrical_type: settings[2] || "unspecified",
      x: parseFloat(settings[4]) || 0,
      y: parseFloat(settings[5]) || 0,
    };
  } catch {
    return null;
  }
}

// Parse footprint pad data from EasyEDA format
// Format: PAD~shape~x~y~width~height~layer~[empty]~padNumber~holeType~...
// holeType: 0=no hole (SMD), >0=hole diameter
function parseFootprintPad(padData: string): FootprintPad | null {
  try {
    const fields = padData.split("~");
    const holeValue = parseFloat(fields[9]) || 0;
    return {
      shape: fields[1] || "RECT",
      x: parseFloat(fields[2]) || 0,
      y: parseFloat(fields[3]) || 0,
      width: parseFloat(fields[4]) || 0,
      height: parseFloat(fields[5]) || 0,
      layer: fields[6] || "1",
      number: fields[8] || "",
      hole_radius: holeValue > 0 ? holeValue : undefined,
    };
  } catch {
    return null;
  }
}

// Get component data from LCSC ID
async function getComponentByLCSC(lcscId: string): Promise<ComponentData | null> {
  const url = API_ENDPOINT.replace("{lcsc_id}", lcscId);
  
  const response = await fetchEasyEDA(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch component: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.result) {
    return null;
  }
  
  const result = data.result;
  const dataStr = result.dataStr;
  const packageDetail = result.packageDetail;
  const lcscInfo = result.lcsc || {};
  const cPara = dataStr?.head?.c_para || {};
  
  // Parse symbol pins
  const pins: SymbolPin[] = [];
  const shapes: string[] = [];
  
  if (dataStr?.shape) {
    for (const line of dataStr.shape) {
      if (line.startsWith("P~")) {
        const pin = parseSymbolPin(line);
        if (pin) pins.push(pin);
      } else {
        shapes.push(line);
      }
    }
  }
  
  // Parse footprint pads
  const pads: FootprintPad[] = [];
  const fpDataStr = packageDetail?.dataStr;
  const fpCPara = fpDataStr?.head?.c_para || {};
  
  if (fpDataStr?.shape) {
    for (const line of fpDataStr.shape) {
      if (line.startsWith("PAD~")) {
        const pad = parseFootprintPad(line);
        if (pad) pads.push(pad);
      }
    }
  }
  
  // Get 3D model info
  let model3d: { name: string; uuid: string } | undefined;
  if (fpDataStr?.shape) {
    for (const line of fpDataStr.shape) {
      if (line.startsWith("SVGNODE~")) {
        try {
          const jsonStr = line.split("~")[1];
          const svgData = JSON.parse(jsonStr);
          if (svgData?.attrs?.uuid) {
            model3d = {
              name: svgData.attrs.title || "3D Model",
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
      prefix: cPara.pre || "U",
      package: cPara.package || fpCPara?.package,
      manufacturer: cPara.BOM_Manufacturer,
      datasheet: lcscInfo.url,
      lcsc_id: lcscInfo.number || lcscId,
      jlc_id: cPara["BOM_JLCPCB Part Class"],
    },
    symbol: {
      pins,
      shapes,
      origin: symbolOrigin,
    },
    footprint: {
      name: fpCPara?.package || "Unknown",
      type: result.SMT && !packageDetail?.title?.includes("-TH_") ? "smd" : "tht",
      pads,
      origin: footprintOrigin,
    },
    model_3d: model3d,
    raw_data: result,
  };
}

// Get 3D model data
async function get3DModel(uuid: string, format: "obj" | "step" = "step"): Promise<Buffer | null> {
  const url = format === "step" 
    ? ENDPOINT_3D_MODEL_STEP.replace("{uuid}", uuid)
    : ENDPOINT_3D_MODEL_OBJ.replace("{uuid}", uuid);
  
  const response = await fetch(url, {
    headers: { "User-Agent": "lcsc-mcp/1.0.0" },
  });
  
  if (!response.ok) {
    return null;
  }
  
  return Buffer.from(await response.arrayBuffer());
}

// Search LCSC for components
async function searchLCSC(query: string, limit: number = 10): Promise<object[]> {
  const response = await fetch(LCSC_SEARCH_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "lcsc-mcp/1.0.0",
    },
    body: JSON.stringify({
      keyword: query,
      pageNumber: 1,
      pageSize: limit,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.result?.productList || [];
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "get_component",
    description: "Get component information from LCSC/EasyEDA by LCSC part number (e.g., C2040). Returns symbol pins, footprint pads, manufacturer info, datasheet URL, and 3D model reference.",
    inputSchema: {
      type: "object",
      properties: {
        lcsc_id: {
          type: "string",
          description: "LCSC part number (e.g., C2040, C14663)",
        },
      },
      required: ["lcsc_id"],
    },
  },
  {
    name: "search_components",
    description: "Search the LCSC component database by keyword. Returns a list of matching components with their LCSC IDs.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (e.g., 'ESP32', 'STM32F103', '0805 100nF')",
        },
        limit: {
          type: "number",
          description: "Maximum number of results (default: 10, max: 50)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "get_3d_model",
    description: "Download a 3D model for a component. Requires the model UUID from get_component. Returns the model as base64-encoded data.",
    inputSchema: {
      type: "object",
      properties: {
        uuid: {
          type: "string",
          description: "3D model UUID from get_component result",
        },
        format: {
          type: "string",
          enum: ["step", "obj"],
          description: "Model format: 'step' for STEP file, 'obj' for OBJ file (default: step)",
        },
      },
      required: ["uuid"],
    },
  },
  {
    name: "get_symbol_kicad",
    description: "Get a KiCad-compatible symbol definition for a component. This provides the symbol in a format ready for use in KiCad.",
    inputSchema: {
      type: "object",
      properties: {
        lcsc_id: {
          type: "string",
          description: "LCSC part number",
        },
      },
      required: ["lcsc_id"],
    },
  },
  {
    name: "get_footprint_kicad",
    description: "Get a KiCad-compatible footprint definition for a component. This provides the footprint in a format ready for use in KiCad.",
    inputSchema: {
      type: "object",
      properties: {
        lcsc_id: {
          type: "string",
          description: "LCSC part number",
        },
      },
      required: ["lcsc_id"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "lcsc-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    switch (name) {
      case "get_component": {
        const lcscId = (args as { lcsc_id: string }).lcsc_id;
        const component = await getComponentByLCSC(lcscId);
        
        if (!component) {
          return {
            content: [{ type: "text", text: `Component ${lcscId} not found` }],
            isError: true,
          };
        }
        
        // Return a clean summary
        const summary = {
          info: component.info,
          symbol: {
            pin_count: component.symbol.pins.length,
            pins: component.symbol.pins,
          },
          footprint: {
            name: component.footprint.name,
            type: component.footprint.type,
            pad_count: component.footprint.pads.length,
            pads: component.footprint.pads,
          },
          has_3d_model: !!component.model_3d,
          model_3d_uuid: component.model_3d?.uuid,
        };
        
        return {
          content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
        };
      }
      
      case "search_components": {
        const { query, limit = 10 } = args as { query: string; limit?: number };
        const results = await searchLCSC(query, Math.min(limit, 50));
        
        const simplified = results.map((r: any) => ({
          lcsc_id: r.productCode,
          name: r.productModel,
          manufacturer: r.brandNameEn,
          package: r.encapStandard,
          price: r.productPriceList?.[0]?.productPrice,
          stock: r.stockNumber,
          description: r.productIntroEn,
        }));
        
        return {
          content: [{ type: "text", text: JSON.stringify(simplified, null, 2) }],
        };
      }
      
      case "get_3d_model": {
        const { uuid, format = "step" } = args as { uuid: string; format?: "step" | "obj" };
        const model = await get3DModel(uuid, format);
        
        if (!model) {
          return {
            content: [{ type: "text", text: `3D model ${uuid} not found` }],
            isError: true,
          };
        }
        
        return {
          content: [
            { 
              type: "text", 
              text: `3D model downloaded (${model.length} bytes, ${format.toUpperCase()} format)\n\nBase64 data:\n${model.toString("base64").slice(0, 500)}...` 
            },
          ],
        };
      }
      
      case "get_symbol_kicad": {
        const lcscId = (args as { lcsc_id: string }).lcsc_id;
        const component = await getComponentByLCSC(lcscId);
        
        if (!component) {
          return {
            content: [{ type: "text", text: `Component ${lcscId} not found` }],
            isError: true,
          };
        }
        
        // Generate basic KiCad symbol
        const symbol = generateKiCadSymbol(component);
        return {
          content: [{ type: "text", text: symbol }],
        };
      }
      
      case "get_footprint_kicad": {
        const lcscId = (args as { lcsc_id: string }).lcsc_id;
        const component = await getComponentByLCSC(lcscId);
        
        if (!component) {
          return {
            content: [{ type: "text", text: `Component ${lcscId} not found` }],
            isError: true,
          };
        }
        
        // Generate basic KiCad footprint
        const footprint = generateKiCadFootprint(component);
        return {
          content: [{ type: "text", text: footprint }],
        };
      }
      
      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

// EasyEDA to mm conversion: divide by 10
const EE_TO_MM = 0.1;

// Generate KiCad symbol (simplified)
function generateKiCadSymbol(component: ComponentData): string {
  const { info, symbol } = component;
  const name = info.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const { origin } = symbol;

  let output = `(kicad_symbol_lib
  (version 20231120)
  (generator "lcsc-mcp")
  (generator_version "1.0.0")
  (symbol "${name}"
    (pin_names (offset 1.016))
    (exclude_from_sim no)
    (in_bom yes)
    (on_board yes)
    (property "Reference" "${info.prefix}" (at 0 1.27 0) (effects (font (size 1.27 1.27))))
    (property "Value" "${name}" (at 0 -1.27 0) (effects (font (size 1.27 1.27))))
    (property "Footprint" "${info.package || ""}" (at 0 -3.81 0) (effects (font (size 1.27 1.27)) hide))
    (property "Datasheet" "${info.datasheet || ""}" (at 0 -6.35 0) (effects (font (size 1.27 1.27)) hide))
    (property "LCSC" "${info.lcsc_id || ""}" (at 0 -8.89 0) (effects (font (size 1.27 1.27)) hide))
    (property "Manufacturer" "${info.manufacturer || ""}" (at 0 -11.43 0) (effects (font (size 1.27 1.27)) hide))
    (symbol "${name}_1_1"
`;

  // Add pins with normalized coordinates
  for (const pin of symbol.pins) {
    const pinType = mapPinType(pin.electrical_type);
    // Normalize to origin and convert to mm
    const x = ((pin.x - origin.x) * EE_TO_MM).toFixed(3);
    const y = (-(pin.y - origin.y) * EE_TO_MM).toFixed(3);
    output += `      (pin ${pinType} line (at ${x} ${y} 180) (length 2.54)
        (name "${pin.name}" (effects (font (size 1.27 1.27))))
        (number "${pin.number}" (effects (font (size 1.27 1.27))))
      )\n`;
  }

  output += `    )
  )
)`;

  return output;
}

// Map EasyEDA pin types to KiCad
function mapPinType(eeType: string): string {
  const mapping: Record<string, string> = {
    "0": "unspecified",
    "1": "input",
    "2": "output",
    "3": "bidirectional",
    "4": "power_in",
  };
  return mapping[eeType] || "unspecified";
}

// Generate KiCad footprint (simplified)
function generateKiCadFootprint(component: ComponentData): string {
  const { info, footprint } = component;
  const name = footprint.name.replace(/[^a-zA-Z0-9_-]/g, "_");
  const { origin } = footprint;

  let output = `(footprint "${name}"
  (version 20231120)
  (generator "lcsc-mcp")
  (generator_version "1.0.0")
  (layer "F.Cu")
  (property "Reference" "REF**" (at 0 -3 0) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))
  (property "Value" "${info.name}" (at 0 3 0) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))
  (property "LCSC" "${info.lcsc_id || ""}" (at 0 0 0) (layer "F.Fab") (hide yes) (effects (font (size 1 1))))
  (attr ${footprint.type})
`;

  // Add pads with normalized coordinates
  for (const pad of footprint.pads) {
    const padType = pad.hole_radius ? "thru_hole" : "smd";
    const shape = pad.shape.toLowerCase() === "ellipse" ? "circle" : "rect";
    const layers =
      padType === "smd"
        ? '(layers "F.Cu" "F.Paste" "F.Mask")'
        : '(layers "*.Cu" "*.Mask")';

    // Normalize to origin and convert to mm
    const x = ((pad.x - origin.x) * EE_TO_MM).toFixed(4);
    const y = (-(pad.y - origin.y) * EE_TO_MM).toFixed(4);
    const w = (pad.width * EE_TO_MM).toFixed(4);
    const h = (pad.height * EE_TO_MM).toFixed(4);

    output += `  (pad "${pad.number}" ${padType} ${shape} (at ${x} ${y}) (size ${w} ${h}) ${layers}`;
    if (pad.hole_radius) {
      const drill = (pad.hole_radius * EE_TO_MM).toFixed(4);
      output += ` (drill ${drill})`;
    }
    output += `)\n`;
  }

  output += `)`;

  return output;
}

// Run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("LCSC MCP server running on stdio");
}

main().catch(console.error);
