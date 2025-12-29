/**
 * LCSC API client for component search and details
 */

import type { LCSCSearchOptions, ComponentSearchResult } from '@ai-eda/common';
import { createLogger } from '@ai-eda/common';

const logger = createLogger('lcsc-api');

const LCSC_SEARCH_API = 'https://wmsc.lcsc.com/ftms/query/product/search';

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

    const response = await fetch(LCSC_SEARCH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify({
        keyword: query,
        pageNumber: page,
        pageSize: Math.min(limit, 50),
        stockFlag: inStock ? true : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`LCSC search failed: ${response.statusText}`);
    }

    const data = await response.json();
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
