/**
 * LCSC API client for component search and details
 */

import type { LCSCSearchOptions, ComponentSearchResult } from '@ai-eda/common';
import { createLogger } from '@ai-eda/common';
import { execSync } from 'child_process';

const logger = createLogger('lcsc-api');

const LCSC_SEARCH_API = 'https://wmsc.lcsc.com/ftms/query/product/search';

/**
 * Fetch URL using curl as fallback when Node fetch fails (e.g., proxy issues)
 */
async function fetchWithCurlFallback(
  url: string,
  options: { method?: string; body?: string; headers?: Record<string, string> } = {}
): Promise<string> {
  const { method = 'GET', body, headers = {} } = options;

  // Try native fetch first
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ai-eda-lcsc-mcp/1.0.0',
        ...headers,
      },
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    logger.debug(`Native fetch failed, falling back to curl: ${error}`);
  }

  // Fallback to curl
  try {
    const curlArgs: string[] = ['curl', '-s'];

    if (method !== 'GET') {
      curlArgs.push('-X', method);
    }

    // Add headers
    curlArgs.push('-H', '"Accept: application/json"');
    curlArgs.push('-H', '"User-Agent: ai-eda-lcsc-mcp/1.0.0"');
    for (const [key, value] of Object.entries(headers)) {
      curlArgs.push('-H', `"${key}: ${value}"`);
    }

    // Add body for POST requests
    if (body) {
      curlArgs.push('-d', `'${body}'`);
    }

    curlArgs.push(`"${url}"`);

    const result = execSync(curlArgs.join(' '), {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    return result;
  } catch (error) {
    throw new Error(`Both fetch and curl failed for URL: ${url}`);
  }
}

export interface LCSCProduct {
  productCode: string;
  productModel: string;
  brandNameEn: string;
  encapStandard: string;
  productPriceList: Array<{
    ladder: number;
    productPrice: number;
    currencySymbol: string;
  }>;
  stockNumber: number;
  productIntroEn: string;
}

export class LCSCClient {
  private userAgent = 'ai-eda-lcsc-mcp/1.0.0';

  /**
   * Search for components on LCSC
   */
  async search(
    query: string,
    options: LCSCSearchOptions = {}
  ): Promise<ComponentSearchResult[]> {
    const { limit = 10, page = 1, inStock } = options;

    logger.debug(`Searching LCSC for: ${query}`);

    const body = JSON.stringify({
      keyword: query,
      pageNumber: page,
      pageSize: Math.min(limit, 50),
      stockFlag: inStock ? true : undefined,
    });

    const responseText = await fetchWithCurlFallback(LCSC_SEARCH_API, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = JSON.parse(responseText);
    const products: LCSCProduct[] = data.result?.productList || [];

    return products.map((p) => ({
      lcscId: p.productCode,
      name: p.productModel,
      manufacturer: p.brandNameEn,
      package: p.encapStandard,
      price: p.productPriceList?.[0]?.productPrice,
      stock: p.stockNumber,
      description: p.productIntroEn,
    }));
  }

  /**
   * Get stock and pricing information for a component
   */
  async getStock(lcscPartNumber: string): Promise<{
    stock: number;
    priceBreaks: Array<{ quantity: number; price: number }>;
  }> {
    // Re-search to get current stock info
    const results = await this.search(lcscPartNumber, { limit: 1 });

    if (results.length === 0) {
      throw new Error(`Component ${lcscPartNumber} not found`);
    }

    const product = results[0];
    return {
      stock: product.stock,
      priceBreaks: [{ quantity: 1, price: product.price || 0 }],
    };
  }
}

export const lcscClient = new LCSCClient();
