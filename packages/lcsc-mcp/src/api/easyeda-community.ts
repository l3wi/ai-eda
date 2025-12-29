/**
 * EasyEDA Community Library API client
 * For searching and fetching user-contributed components
 */

import type {
  EasyEDACommunitySearchParams,
  EasyEDACommunitySearchResult,
  EasyEDACommunityComponent,
  EasyEDACommunityPin,
  EasyEDACommunityPad,
} from '@ai-eda/common'
import { createLogger } from '@ai-eda/common'
import { execSync } from 'child_process'

const logger = createLogger('easyeda-community-api')

const API_SEARCH_ENDPOINT = 'https://easyeda.com/api/components/search'
const API_COMPONENT_ENDPOINT = 'https://easyeda.com/api/components'
const API_VERSION = '6.5.51'

// Reuse 3D model endpoints from existing easyeda client
const ENDPOINT_3D_MODEL_STEP = 'https://modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}'
const ENDPOINT_3D_MODEL_OBJ = 'https://modules.easyeda.com/3dmodel/{uuid}'

/**
 * Fetch URL with curl fallback for reliability
 */
async function fetchWithCurlFallback(
  url: string,
  options: {
    method?: 'GET' | 'POST'
    body?: string
    contentType?: string
    binary?: boolean
  } = {}
): Promise<string | Buffer> {
  const method = options.method || 'GET'
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  }

  if (options.contentType) {
    headers['Content-Type'] = options.contentType
  }

  // Try native fetch first
  try {
    const fetchOptions: RequestInit = {
      method,
      headers,
    }

    if (options.body) {
      fetchOptions.body = options.body
    }

    const response = await fetch(url, fetchOptions)

    if (response.ok) {
      if (options.binary) {
        return Buffer.from(await response.arrayBuffer())
      }
      return await response.text()
    }
  } catch (error) {
    logger.debug(`Native fetch failed, falling back to curl: ${error}`)
  }

  // Fallback to curl
  try {
    const curlArgs = ['curl', '-s']

    if (method === 'POST') {
      curlArgs.push('-X', 'POST')
    }

    curlArgs.push('-H', '"Accept: application/json"')
    curlArgs.push(
      '-H',
      '"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"'
    )

    if (options.contentType) {
      curlArgs.push('-H', `"Content-Type: ${options.contentType}"`)
    }

    if (options.body) {
      curlArgs.push('-d', `'${options.body}'`)
    }

    curlArgs.push(`"${url}"`)

    if (options.binary) {
      const result = execSync(curlArgs.join(' '), { maxBuffer: 50 * 1024 * 1024 })
      return result
    }

    const result = execSync(curlArgs.join(' '), {
      encoding: 'utf-8',
      maxBuffer: 50 * 1024 * 1024,
    })
    return result
  } catch (error) {
    throw new Error(`Both fetch and curl failed for URL: ${url}`)
  }
}

export class EasyEDACommunityClient {
  /**
   * Search the EasyEDA community library
   */
  async search(
    params: EasyEDACommunitySearchParams
  ): Promise<EasyEDACommunitySearchResult[]> {
    const formData = new URLSearchParams()
    formData.append('type', '3') // Component type
    formData.append('doctype[]', '2') // Symbol+footprint
    formData.append('uid', params.source || 'user')
    formData.append('returnListStyle', 'classifyarr')
    formData.append('wd', params.query)
    formData.append('version', API_VERSION)

    logger.debug(`Searching EasyEDA community: ${params.query}`)

    try {
      const responseText = (await fetchWithCurlFallback(API_SEARCH_ENDPOINT, {
        method: 'POST',
        body: formData.toString(),
        contentType: 'application/x-www-form-urlencoded',
      })) as string

      const data = JSON.parse(responseText)

      if (!data.success || !data.result) {
        logger.warn('EasyEDA search returned no results')
        return []
      }

      return this.parseSearchResults(data.result.lists, params.limit)
    } catch (error) {
      logger.error('EasyEDA search failed:', error)
      throw error
    }
  }

  /**
   * Get full component details by UUID
   */
  async getComponent(uuid: string): Promise<EasyEDACommunityComponent | null> {
    const url = `${API_COMPONENT_ENDPOINT}/${uuid}?version=${API_VERSION}&uuid=${uuid}`

    logger.debug(`Fetching component: ${uuid}`)

    try {
      const responseText = (await fetchWithCurlFallback(url)) as string
      const data = JSON.parse(responseText)

      if (!data.success || !data.result) {
        return null
      }

      return this.parseComponent(data.result)
    } catch (error) {
      logger.error(`Failed to fetch component ${uuid}:`, error)
      throw error
    }
  }

  /**
   * Download 3D model for a component
   */
  async get3DModel(
    uuid: string,
    format: 'step' | 'obj' = 'step'
  ): Promise<Buffer | null> {
    const url =
      format === 'step'
        ? ENDPOINT_3D_MODEL_STEP.replace('{uuid}', uuid)
        : ENDPOINT_3D_MODEL_OBJ.replace('{uuid}', uuid)

    try {
      const result = await fetchWithCurlFallback(url, { binary: true })
      return result as Buffer
    } catch {
      return null
    }
  }

  /**
   * Parse search results from the API response
   */
  private parseSearchResults(
    lists: Record<string, unknown[]>,
    limit?: number
  ): EasyEDACommunitySearchResult[] {
    const results: EasyEDACommunitySearchResult[] = []

    // Process all source lists (user, lcsc, easyeda, etc.)
    for (const [_source, items] of Object.entries(lists)) {
      if (!Array.isArray(items)) continue

      for (const item of items) {
        const result = this.parseSearchItem(item)
        if (result) {
          results.push(result)
        }

        if (limit && results.length >= limit) {
          return results
        }
      }
    }

    return results
  }

  /**
   * Parse a single search result item
   */
  private parseSearchItem(item: any): EasyEDACommunitySearchResult | null {
    try {
      const cPara = item.dataStr?.head?.c_para || {}
      const puuid = item.dataStr?.head?.puuid // Package/footprint UUID

      return {
        uuid: item.uuid || '',
        title: item.title || '',
        thumb: item.thumb || '',
        description: item.description || '',
        tags: item.tags || [],
        package: cPara.package || '',
        packageUuid: puuid || undefined,
        manufacturer: cPara.Manufacturer || cPara.BOM_Manufacturer || undefined,
        owner: {
          uuid: item.owner?.uuid || '',
          username: item.owner?.username || '',
          nickname: item.owner?.nickname || '',
          avatar: item.owner?.avatar,
          team: item.owner?.team,
        },
        contributor: cPara.Contributor,
        has3DModel: false, // Will be determined when fetching full component
        docType: item.docType || 2,
        updateTime: item.dataStr?.head?.utime,
      }
    } catch {
      return null
    }
  }

  /**
   * Parse full component data from the API response
   */
  private parseComponent(result: any): EasyEDACommunityComponent {
    const dataStr = result.dataStr || {}
    const packageDetail = result.packageDetail || {}
    const cPara = dataStr.head?.c_para || {}

    // Parse symbol pins
    const pins: EasyEDACommunityPin[] = []
    const symbolShapes: string[] = []

    if (dataStr.shape) {
      for (const line of dataStr.shape) {
        if (typeof line === 'string' && line.startsWith('P~')) {
          const pin = this.parseSymbolPin(line)
          if (pin) pins.push(pin)
        } else if (typeof line === 'string') {
          symbolShapes.push(line)
        }
      }
    }

    // Parse footprint pads
    const pads: EasyEDACommunityPad[] = []
    const footprintShapes: string[] = []
    const fpDataStr = packageDetail.dataStr || {}
    const fpCPara = fpDataStr.head?.c_para || {}

    if (fpDataStr.shape) {
      for (const line of fpDataStr.shape) {
        if (typeof line === 'string' && line.startsWith('PAD~')) {
          const pad = this.parseFootprintPad(line)
          if (pad) pads.push(pad)
        } else if (typeof line === 'string') {
          footprintShapes.push(line)
        }
      }
    }

    // Get 3D model info
    let model3d: { name: string; uuid: string } | undefined
    if (fpDataStr.shape) {
      for (const line of fpDataStr.shape) {
        if (typeof line === 'string' && line.startsWith('SVGNODE~')) {
          try {
            const jsonStr = line.split('~')[1]
            const svgData = JSON.parse(jsonStr)
            if (svgData?.attrs?.uuid) {
              model3d = {
                name: svgData.attrs.title || '3D Model',
                uuid: svgData.attrs.uuid,
              }
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    // Get origins for coordinate normalization
    const symbolOrigin = {
      x: parseFloat(dataStr.head?.x) || 0,
      y: parseFloat(dataStr.head?.y) || 0,
    }
    const footprintOrigin = {
      x: parseFloat(fpDataStr.head?.x) || 0,
      y: parseFloat(fpDataStr.head?.y) || 0,
    }

    return {
      uuid: result.uuid || '',
      title: result.title || cPara.name || '',
      description: result.description || '',
      tags: result.tags || [],
      owner: {
        uuid: result.owner?.uuid || '',
        username: result.owner?.username || '',
        nickname: result.owner?.nickname || '',
        avatar: result.owner?.avatar,
        team: result.owner?.team,
      },
      creator: result.creator
        ? {
            uuid: result.creator.uuid || '',
            username: result.creator.username || '',
            nickname: result.creator.nickname || '',
            avatar: result.creator.avatar,
            team: result.creator.team,
          }
        : undefined,
      updateTime: result.updateTime || fpDataStr.head?.utime || 0,
      docType: result.docType || 2,
      verify: result.verify || false,
      symbol: {
        pins,
        shapes: symbolShapes,
        origin: symbolOrigin,
        head: dataStr.head || {},
      },
      footprint: {
        uuid: packageDetail.uuid || '',
        name: fpCPara.package || packageDetail.title || 'Unknown',
        pads,
        shapes: footprintShapes,
        origin: footprintOrigin,
        head: fpDataStr.head || {},
      },
      model3d,
      rawData: result,
    }
  }

  /**
   * Parse EasyEDA symbol pin format
   * Format: P~show~type~number~x~y~...^^...^^...^^1~x~y~0~NAME~...^^...
   */
  private parseSymbolPin(pinData: string): EasyEDACommunityPin | null {
    try {
      const segments = pinData.split('^^')
      const settings = segments[0].split('~')
      const nameSegment = segments[3]?.split('~') || []

      return {
        number: settings[3] || '',
        name: nameSegment[4] || '',
        electricalType: settings[2] || '0',
        x: parseFloat(settings[4]) || 0,
        y: parseFloat(settings[5]) || 0,
        rotation: 0,
      }
    } catch {
      return null
    }
  }

  /**
   * Parse EasyEDA footprint pad format
   * Format varies - can be simple PAD~ or complex PAD~POLYGON~
   */
  private parseFootprintPad(padData: string): EasyEDACommunityPad | null {
    try {
      const fields = padData.split('~')

      // Handle polygon pads (e.g., PAD~POLYGON~x~y~...)
      if (fields[1] === 'POLYGON') {
        const pointsStr = fields[7] || ''
        const points: Array<{ x: number; y: number }> = []

        // Parse polygon points
        const coordPairs = pointsStr.split(' ')
        for (let i = 0; i < coordPairs.length - 1; i += 2) {
          points.push({
            x: parseFloat(coordPairs[i]) || 0,
            y: parseFloat(coordPairs[i + 1]) || 0,
          })
        }

        return {
          number: fields[8] || '',
          shape: 'POLYGON',
          x: parseFloat(fields[2]) || 0,
          y: parseFloat(fields[3]) || 0,
          width: 0,
          height: 0,
          layer: fields[6] || '1',
          rotation: 0,
          points,
        }
      }

      // Handle standard pads (ELLIPSE, OVAL, RECT, ROUND)
      const holeValue = parseFloat(fields[9]) || 0

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
      }
    } catch {
      return null
    }
  }
}

export const easyedaCommunityClient = new EasyEDACommunityClient()
