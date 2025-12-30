/**
 * Types for EasyEDA community library API
 * These are for user-contributed components (not official LCSC parts)
 */

/**
 * Owner information for a community component
 */
export interface EasyEDACommunityOwner {
  uuid: string
  username: string
  nickname: string
  avatar?: string
  team?: boolean
}

/**
 * Search result from EasyEDA community library
 */
export interface EasyEDACommunitySearchResult {
  uuid: string
  title: string
  thumb: string
  description: string
  tags: string[]
  package: string
  packageUuid?: string  // UUID for the footprint/package (for image URL)
  manufacturer?: string
  owner: EasyEDACommunityOwner
  contributor?: string
  has3DModel: boolean
  docType: number
  updateTime?: number
}

/**
 * Search parameters for EasyEDA community library
 */
export interface EasyEDACommunitySearchParams {
  query: string
  source?: 'user' | 'lcsc' | 'easyeda' | 'all'
  limit?: number
  page?: number
}

/**
 * Full component data from EasyEDA community library
 */
export interface EasyEDACommunityComponent {
  uuid: string
  title: string
  description: string
  tags: string[]
  owner: EasyEDACommunityOwner
  creator?: EasyEDACommunityOwner
  updateTime: number
  docType: number
  verify: boolean
  symbol: {
    pins: EasyEDACommunityPin[]
    shapes: string[]
    origin: { x: number; y: number }
    head: Record<string, unknown>
  }
  footprint: {
    uuid: string
    name: string
    pads: EasyEDACommunityPad[]
    shapes: string[]
    origin: { x: number; y: number }
    head: Record<string, unknown>
  }
  model3d?: {
    name: string
    uuid: string
  }
  rawData: object
}

/**
 * Pin definition from EasyEDA community component symbol
 */
export interface EasyEDACommunityPin {
  number: string
  name: string
  electricalType: string
  x: number
  y: number
  rotation: number
}

/**
 * Pad definition from EasyEDA community component footprint
 */
export interface EasyEDACommunityPad {
  number: string
  shape: string
  x: number
  y: number
  width: number
  height: number
  layer: string
  holeRadius?: number
  rotation: number
  points?: Array<{ x: number; y: number }>
}
