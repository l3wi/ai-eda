#!/usr/bin/env node

/**
 * Test script to verify HLK-7621 symbol and footprint conversion
 * Tests the full pipeline: EasyEDA API -> Parsing -> KiCad conversion
 */

import { execSync } from 'child_process';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';

// Constants
const HLK_7621_LCSC_ID = 'C3029172';
const API_ENDPOINT = `https://easyeda.com/api/products/${HLK_7621_LCSC_ID}/components?version=6.4.19.5`;

// EasyEDA units are 10mil
const EE_TO_MM = 0.254;

// Output directory
const OUTPUT_DIR = './test-output';

/**
 * Fetch data using curl (works in proxy environments)
 */
function fetchWithCurl(url) {
  console.log(`\nFetching: ${url.slice(0, 60)}...`);
  try {
    const result = execSync(`curl -s -H "Accept: application/json" "${url}"`, {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    });
    return result;
  } catch (error) {
    throw new Error(`Curl failed: ${error.message}`);
  }
}

/**
 * Parse EasyEDA symbol pin format
 * Format: P~show~type~number~x~y~...^^...^^...^^1~x~y~0~NAME~...^^...
 */
function parseSymbolPin(pinData) {
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
    };
  } catch {
    return null;
  }
}

/**
 * Parse EasyEDA footprint pad format
 * Format: PAD~shape~x~y~width~height~layer~[empty]~padNumber~holeType~...
 */
function parseFootprintPad(padData) {
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
    };
  } catch {
    return null;
  }
}

/**
 * Map EasyEDA pin type to KiCad pin type
 */
function mapPinType(eeType) {
  const mapping = {
    '0': 'unspecified',
    '1': 'input',
    '2': 'output',
    '3': 'bidirectional',
    '4': 'power_in',
    '5': 'power_out',
    '6': 'open_collector',
    '7': 'open_emitter',
    '8': 'passive',
    '9': 'no_connect',
  };
  return mapping[eeType] || 'unspecified';
}

/**
 * Map EasyEDA pad shape to KiCad
 */
function mapPadShape(eeShape) {
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
 * Sanitize name for KiCad
 */
function sanitizeName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Round to N decimal places
 */
function roundTo(value, places) {
  const mult = Math.pow(10, places);
  return Math.round(value * mult) / mult;
}

/**
 * Convert EasyEDA data to KiCad symbol
 */
function convertToSymbol(component, libraryName = 'LCSC') {
  const { info, symbol } = component;
  const name = sanitizeName(info.name);
  const { origin } = symbol;

  let output = `(kicad_symbol_lib
  (version 20231120)
  (generator "ai-eda-lcsc-mcp")
  (generator_version "1.0.0")
  (symbol "${libraryName}:${name}"
    (pin_names (offset 1.016))
    (exclude_from_sim no)
    (in_bom yes)
    (on_board yes)
`;

  // Properties
  output += `    (property "Reference" "${info.prefix}" (at 0 1.54 0) (effects (font (size 1.27 1.27))))\n`;
  output += `    (property "Value" "${name}" (at 0 -1.54 0) (effects (font (size 1.27 1.27))))\n`;
  output += `    (property "Footprint" "${info.package || ''}" (at 0 -3.81 0) (effects (font (size 1.27 1.27)) hide))\n`;

  if (info.datasheet) {
    output += `    (property "Datasheet" "${info.datasheet}" (at 0 -6.35 0) (effects (font (size 1.27 1.27)) hide))\n`;
  }
  if (info.lcscId) {
    output += `    (property "LCSC" "${info.lcscId}" (at 0 -8.89 0) (effects (font (size 1.27 1.27)) hide))\n`;
  }
  if (info.manufacturer) {
    output += `    (property "Manufacturer" "${info.manufacturer}" (at 0 -11.43 0) (effects (font (size 1.27 1.27)) hide))\n`;
  }

  // Start symbol unit
  output += `    (symbol "${name}_1_1"\n`;

  // Calculate bounding box for rectangle body
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const pin of symbol.pins) {
    const x = (pin.x - origin.x) * EE_TO_MM;
    const y = -(pin.y - origin.y) * EE_TO_MM;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  // Add padding
  const padding = 2.54;
  minX = roundTo(minX + padding, 3);
  maxX = roundTo(maxX - padding, 3);
  minY = roundTo(minY - padding, 3);
  maxY = roundTo(maxY + padding, 3);

  // Add rectangle body
  output += `      (rectangle (start ${minX} ${maxY}) (end ${maxX} ${minY})
        (stroke (width 0.254) (type default))
        (fill (type background))
      )\n`;

  // Add pins
  for (const pin of symbol.pins) {
    const pinType = mapPinType(pin.electricalType);
    const x = roundTo((pin.x - origin.x) * EE_TO_MM, 3);
    const y = roundTo(-(pin.y - origin.y) * EE_TO_MM, 3);

    // Determine pin orientation based on position
    let rotation;
    if (Math.abs(x) > Math.abs(y)) {
      rotation = x > 0 ? 180 : 0;
    } else {
      rotation = y > 0 ? 270 : 90;
    }

    const pinName = (pin.name || '').replace(/"/g, "'").replace(/\\/g, '');
    output += `      (pin ${pinType} line (at ${x} ${y} ${rotation}) (length 2.54)
        (name "${pinName}" (effects (font (size 1.27 1.27))))
        (number "${pin.number}" (effects (font (size 1.27 1.27))))
      )\n`;
  }

  output += `    )
  )
)`;

  return output;
}

/**
 * Convert EasyEDA data to KiCad footprint
 */
function convertToFootprint(component, libraryName = 'LCSC') {
  const { info, footprint, model3d } = component;
  const name = sanitizeName(footprint.name);
  const { origin } = footprint;

  let output = `(footprint "${libraryName}:${name}"
  (version 20231014)
  (generator "ai-eda-lcsc-mcp")
  (generator_version "1.0.0")
  (layer "F.Cu")
`;

  // Properties
  output += `  (property "Reference" "REF**" (at 0 -3 0) (layer "F.SilkS") (effects (font (size 1.27 1.27) (thickness 0.15))))\n`;
  output += `  (property "Value" "${sanitizeName(info.name)}" (at 0 3 0) (layer "F.Fab") (effects (font (size 1.27 1.27) (thickness 0.15))))\n`;
  output += `  (property "Footprint" "${name}" (at 0 0 0) (layer "F.Fab") (hide yes) (effects (font (size 1.27 1.27))))\n`;

  if (info.lcscId) {
    output += `  (property "LCSC" "${info.lcscId}" (at 0 0 0) (layer "F.Fab") (hide yes) (effects (font (size 1.27 1.27))))\n`;
  }

  // Attributes
  output += `  (attr ${footprint.type})\n`;

  // Add pads
  for (const pad of footprint.pads) {
    const padType = pad.holeRadius ? 'thru_hole' : 'smd';
    const shape = mapPadShape(pad.shape);
    const layers = padType === 'smd' ? '"F.Cu" "F.Paste" "F.Mask"' : '"*.Cu" "*.Mask"';

    const x = roundTo((pad.x - origin.x) * EE_TO_MM, 4);
    const y = roundTo(-(pad.y - origin.y) * EE_TO_MM, 4);
    const w = roundTo(pad.width * EE_TO_MM, 4);
    const h = roundTo(pad.height * EE_TO_MM, 4);

    output += `  (pad "${pad.number}" ${padType} ${shape} (at ${x} ${y}) (size ${w} ${h}) (layers ${layers})`;

    if (pad.holeRadius) {
      const drill = roundTo(pad.holeRadius * EE_TO_MM, 4);
      output += ` (drill ${drill})`;
    }

    output += `)\n`;
  }

  // Calculate courtyard
  if (footprint.pads.length > 0) {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    for (const pad of footprint.pads) {
      const x = (pad.x - origin.x) * EE_TO_MM;
      const y = -(pad.y - origin.y) * EE_TO_MM;
      const hw = (pad.width * EE_TO_MM) / 2;
      const hh = (pad.height * EE_TO_MM) / 2;

      minX = Math.min(minX, x - hw);
      maxX = Math.max(maxX, x + hw);
      minY = Math.min(minY, y - hh);
      maxY = Math.max(maxY, y + hh);
    }

    const margin = 0.25;
    minX = roundTo(minX - margin, 3);
    maxX = roundTo(maxX + margin, 3);
    minY = roundTo(minY - margin, 3);
    maxY = roundTo(maxY + margin, 3);

    output += `  (fp_rect (start ${minX} ${minY}) (end ${maxX} ${maxY})
    (stroke (width 0.05) (type solid))
    (fill none)
    (layer "F.CrtYd")
  )\n`;
  }

  output += `)`;

  return output;
}

/**
 * Main test function
 */
async function main() {
  console.log('='.repeat(60));
  console.log('HLK-7621 Symbol & Footprint Conversion Test');
  console.log('='.repeat(60));
  console.log(`LCSC ID: ${HLK_7621_LCSC_ID}`);

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Step 1: Fetch component data from EasyEDA API
  console.log('\n[1/5] Fetching component data from EasyEDA API...');
  let data;
  try {
    const responseText = fetchWithCurl(API_ENDPOINT);
    data = JSON.parse(responseText);
  } catch (error) {
    console.error(`Failed to fetch: ${error.message}`);
    process.exit(1);
  }

  if (!data.result) {
    console.error('No result data in API response');
    console.log('Response:', JSON.stringify(data).slice(0, 500));
    process.exit(1);
  }

  console.log('✓ API request successful');

  // Step 2: Parse component data
  console.log('\n[2/5] Parsing EasyEDA component data...');

  const result = data.result;
  const dataStr = result.dataStr;
  const packageDetail = result.packageDetail;
  const lcscInfo = result.lcsc || {};
  const cPara = dataStr?.head?.c_para || {};
  const fpDataStr = packageDetail?.dataStr;
  const fpCPara = fpDataStr?.head?.c_para || {};

  // Parse symbol pins
  const pins = [];
  if (dataStr?.shape) {
    for (const line of dataStr.shape) {
      if (line.startsWith('P~')) {
        const pin = parseSymbolPin(line);
        if (pin) pins.push(pin);
      }
    }
  }

  // Parse footprint pads
  const pads = [];
  if (fpDataStr?.shape) {
    for (const line of fpDataStr.shape) {
      if (line.startsWith('PAD~')) {
        const pad = parseFootprintPad(line);
        if (pad) pads.push(pad);
      }
    }
  }

  // Get 3D model info
  let model3d;
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

  // Build component object
  const component = {
    info: {
      name: cPara.name || HLK_7621_LCSC_ID,
      prefix: cPara.pre || 'U',
      package: cPara.package || fpCPara?.package,
      manufacturer: cPara.BOM_Manufacturer,
      datasheet: lcscInfo.url,
      lcscId: lcscInfo.number || HLK_7621_LCSC_ID,
    },
    symbol: {
      pins,
      shapes: [],
      origin: {
        x: parseFloat(dataStr?.head?.x) || 0,
        y: parseFloat(dataStr?.head?.y) || 0,
      },
    },
    footprint: {
      name: fpCPara?.package || 'Unknown',
      type: result.SMT && !packageDetail?.title?.includes('-TH_') ? 'smd' : 'tht',
      pads,
      origin: {
        x: parseFloat(fpDataStr?.head?.x) || 0,
        y: parseFloat(fpDataStr?.head?.y) || 0,
      },
    },
    model3d,
  };

  console.log('✓ Parsing complete');
  console.log(`  Component: ${component.info.name}`);
  console.log(`  Manufacturer: ${component.info.manufacturer || 'N/A'}`);
  console.log(`  Package: ${component.info.package || 'N/A'}`);
  console.log(`  Symbol pins: ${pins.length}`);
  console.log(`  Footprint pads: ${pads.length}`);
  console.log(`  3D Model: ${model3d ? model3d.uuid : 'N/A'}`);

  // Step 3: Convert to KiCad symbol
  console.log('\n[3/5] Converting to KiCad symbol format...');
  const symbolContent = convertToSymbol(component);
  const symbolFile = join(OUTPUT_DIR, 'HLK-7621.kicad_sym');
  writeFileSync(symbolFile, symbolContent, 'utf-8');
  console.log(`✓ Symbol saved: ${symbolFile}`);
  console.log(`  Size: ${symbolContent.length} bytes`);

  // Step 4: Convert to KiCad footprint
  console.log('\n[4/5] Converting to KiCad footprint format...');
  const footprintContent = convertToFootprint(component);
  const footprintFile = join(OUTPUT_DIR, 'HLK-7621.kicad_mod');
  writeFileSync(footprintFile, footprintContent, 'utf-8');
  console.log(`✓ Footprint saved: ${footprintFile}`);
  console.log(`  Size: ${footprintContent.length} bytes`);

  // Step 5: Validate output (basic checks)
  console.log('\n[5/5] Validating output...');

  const issues = [];

  // Check symbol has required sections
  if (!symbolContent.includes('(kicad_symbol_lib')) {
    issues.push('Symbol missing kicad_symbol_lib header');
  }
  if (!symbolContent.includes('(property "Reference"')) {
    issues.push('Symbol missing Reference property');
  }
  if (!symbolContent.includes('(property "Value"')) {
    issues.push('Symbol missing Value property');
  }
  if (!symbolContent.includes('(pin ')) {
    issues.push('Symbol has no pins');
  }

  // Check footprint has required sections
  if (!footprintContent.includes('(footprint ')) {
    issues.push('Footprint missing footprint header');
  }
  if (!footprintContent.includes('(property "Reference"')) {
    issues.push('Footprint missing Reference property');
  }
  if (!footprintContent.includes('(pad ')) {
    issues.push('Footprint has no pads');
  }

  // Count pins and pads in output
  const pinMatches = symbolContent.match(/\(pin /g) || [];
  const padMatches = footprintContent.match(/\(pad /g) || [];

  console.log(`  Pins in output: ${pinMatches.length}`);
  console.log(`  Pads in output: ${padMatches.length}`);

  if (pinMatches.length !== pins.length) {
    issues.push(`Pin count mismatch: expected ${pins.length}, got ${pinMatches.length}`);
  }
  if (padMatches.length !== pads.length) {
    issues.push(`Pad count mismatch: expected ${pads.length}, got ${padMatches.length}`);
  }

  if (issues.length === 0) {
    console.log('✓ All validation checks passed');
  } else {
    console.log('✗ Validation issues found:');
    for (const issue of issues) {
      console.log(`  - ${issue}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Component: ${component.info.name} (${HLK_7621_LCSC_ID})`);
  console.log(`Symbol: ${pins.length} pins → ${symbolFile}`);
  console.log(`Footprint: ${pads.length} pads → ${footprintFile}`);
  console.log(`3D Model UUID: ${model3d?.uuid || 'None'}`);
  console.log(`Issues: ${issues.length}`);
  console.log('='.repeat(60));

  if (issues.length > 0) {
    process.exit(1);
  }

  console.log('\n✓ HLK-7621 symbol and footprint conversion successful!');
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
