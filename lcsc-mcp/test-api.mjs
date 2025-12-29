#!/usr/bin/env node

/**
 * Test script to fetch HLK-7621 component data from EasyEDA API
 * Testing the API endpoints found in easyeda2kicad.py
 */

const API_ENDPOINT = "https://easyeda.com/api/products/{lcsc_id}/components?version=6.4.19.5";
const ENDPOINT_3D_MODEL_STEP = "https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}";

// Known LCSC ID for HLK-7621 (found via web search)
const HLK_7621_LCSC_ID = "C3029172";

async function fetchComponentData(lcscId) {
  const url = API_ENDPOINT.replace("{lcsc_id}", lcscId);
  console.log(`\nFetching from: ${url}\n`);

  try {
    const response = await fetch(url, {
      headers: {
        "Accept-Encoding": "gzip, deflate",
        "Accept": "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers));

    if (!response.ok) {
      console.log(`HTTP Error: ${response.statusText}`);
      const text = await response.text();
      console.log(`Response body: ${text.slice(0, 500)}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Fetch error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Testing EasyEDA API for HLK-7621 ===");
  console.log(`LCSC ID: ${HLK_7621_LCSC_ID}`);

  const data = await fetchComponentData(HLK_7621_LCSC_ID);

  if (!data) {
    console.log("\nFailed to fetch component data");
    return;
  }

  console.log("\n=== API Response ===");
  console.log(`Success: ${data.success !== false}`);

  if (data.result) {
    const result = data.result;
    const dataStr = result.dataStr;
    const packageDetail = result.packageDetail;
    const lcscInfo = result.lcsc || {};
    const cPara = dataStr?.head?.c_para || {};

    console.log("\n--- Component Info ---");
    console.log(`Name: ${cPara.name || 'N/A'}`);
    console.log(`Prefix: ${cPara.pre || 'N/A'}`);
    console.log(`Package: ${cPara.package || 'N/A'}`);
    console.log(`Manufacturer: ${cPara.BOM_Manufacturer || 'N/A'}`);
    console.log(`Datasheet: ${lcscInfo.url || 'N/A'}`);
    console.log(`LCSC Number: ${lcscInfo.number || 'N/A'}`);

    // Symbol info
    if (dataStr?.shape) {
      const pins = dataStr.shape.filter(s => s.startsWith('P~'));
      console.log(`\n--- Symbol ---`);
      console.log(`Total shapes: ${dataStr.shape.length}`);
      console.log(`Pin count: ${pins.length}`);
    }

    // Footprint info
    if (packageDetail?.dataStr?.shape) {
      const pads = packageDetail.dataStr.shape.filter(s => s.startsWith('PAD~'));
      console.log(`\n--- Footprint ---`);
      console.log(`Name: ${packageDetail.dataStr.head?.c_para?.package || packageDetail.title || 'N/A'}`);
      console.log(`Total shapes: ${packageDetail.dataStr.shape.length}`);
      console.log(`Pad count: ${pads.length}`);

      // Check for 3D model
      for (const line of packageDetail.dataStr.shape) {
        if (line.startsWith('SVGNODE~')) {
          try {
            const jsonStr = line.split('~')[1];
            const svgData = JSON.parse(jsonStr);
            if (svgData?.attrs?.uuid) {
              console.log(`\n--- 3D Model ---`);
              console.log(`UUID: ${svgData.attrs.uuid}`);
              console.log(`Title: ${svgData.attrs.title || 'N/A'}`);
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }

    // Save raw data for inspection
    const fs = await import('fs');
    fs.writeFileSync('hlk-7621-raw.json', JSON.stringify(data, null, 2));
    console.log(`\nRaw data saved to hlk-7621-raw.json`);
  } else {
    console.log("\nNo result data in response");
    console.log("Full response:", JSON.stringify(data, null, 2).slice(0, 1000));
  }
}

main().catch(console.error);
