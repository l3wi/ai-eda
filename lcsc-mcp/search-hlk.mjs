#!/usr/bin/env node

const LCSC_SEARCH_API = "https://wmsc.lcsc.com/ftms/query/product/search";
const API_ENDPOINT = "https://easyeda.com/api/products/{lcsc_id}/components?version=6.4.19.5";

async function searchLCSC(query) {
  console.log(`Searching LCSC for: ${query}\n`);

  try {
    const response = await fetch(LCSC_SEARCH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
      body: JSON.stringify({
        keyword: query,
        pageNumber: 1,
        pageSize: 10,
      }),
    });

    const data = await response.json();

    if (data.code !== 200 || !data.result?.productList?.length) {
      console.log("LCSC Search API status:", data.code);
      return null;
    }

    return data.result.productList;
  } catch (e) {
    console.log("Search failed:", e.message);
    return null;
  }
}

// Try to get component directly if we know/guess the LCSC ID
async function tryDirectLookup(possibleIds) {
  console.log("Trying direct component lookups...\n");

  for (const lcscId of possibleIds) {
    try {
      const url = API_ENDPOINT.replace("{lcsc_id}", lcscId);
      const response = await fetch(url, {
        headers: { "User-Agent": "lcsc-mcp/1.0.0" }
      });
      const data = await response.json();

      if (data.result) {
        const cPara = data.result.dataStr?.head?.c_para || {};
        const lcscInfo = data.result.lcsc || {};
        console.log(`Found: ${lcscId}`);
        console.log(`  Name: ${cPara.name || 'N/A'}`);
        console.log(`  Package: ${cPara.package || 'N/A'}`);
        console.log(`  Manufacturer: ${cPara.BOM_Manufacturer || 'N/A'}`);
        console.log(`  Datasheet: ${lcscInfo.url || 'N/A'}`);
        return data.result;
      }
    } catch (e) {
      // Continue to next ID
    }
  }
  return null;
}

async function main() {
  const query = "HLK-7621";

  // Try LCSC search first
  const results = await searchLCSC(query);

  if (results && results.length > 0) {
    console.log(`Found ${results.length} results:\n`);
    for (const r of results) {
      console.log(`${r.productCode}: ${r.productModel}`);
      console.log(`  Manufacturer: ${r.brandNameEn}`);
      console.log(`  Package: ${r.encapStandard || 'N/A'}`);
      console.log(`  Price: $${r.productPriceList?.[0]?.productPrice || 'N/A'}`);
      console.log(`  Stock: ${r.stockNumber}`);
      console.log(`  Description: ${r.productIntroEn?.slice(0, 100) || 'N/A'}`);
      console.log();
    }
  } else {
    console.log("LCSC search API unavailable. Trying web search...\n");

    // The HLK-7621 is a Hi-Link module - common LCSC IDs to try
    // Based on web knowledge, trying some possible IDs
    const possibleIds = ["C5765073", "C2904273", "C2904272"];
    await tryDirectLookup(possibleIds);
  }
}

main();
