/**
 * Browser-side SVG renderer for EasyEDA footprints
 * Renders from both raw shape strings and structured data
 *
 * Coordinate system: EasyEDA uses 10mil units (0.254mm per unit)
 * Transformations: origin subtraction + unit conversion to match KiCad
 */

// EasyEDA to mm conversion factor (10mil = 0.254mm)
const EE_TO_MM = 0.254

// Layers to show in preview (silkscreen and edge cuts)
const VISIBLE_LAYERS = new Set([3, 4, 10, 11])  // F.SilkS, B.SilkS, Edge.Cuts

/**
 * Convert EasyEDA coordinate to mm (origin-relative)
 */
function convertCoord(value: number, origin: number): number {
  return (value - origin) * EE_TO_MM
}

/**
 * Convert EasyEDA size to mm
 */
function toMM(value: number): number {
  return value * EE_TO_MM
}

export interface FootprintDataStr {
  shape?: string[]
  BBox?: { x: number; y: number; width: number; height: number }
  head?: { x?: number; y?: number }
}

export interface StructuredPad {
  centerX: number
  centerY: number
  width: number
  height: number
  shape: string
  holeRadius?: number
  points?: string
  rotation?: number
  layerId?: number
}

export interface StructuredTrack {
  points: string
  strokeWidth: number
  layerId?: number
}

export interface StructuredCircle {
  cx: number
  cy: number
  radius: number
  strokeWidth?: number
  layerId?: number
}

export interface StructuredFootprint {
  pads?: StructuredPad[]
  tracks?: StructuredTrack[]
  circles?: StructuredCircle[]
  origin?: { x: number; y: number }
}

/**
 * Generate SVG from EasyEDA footprint dataStr
 * Renders shapes with proper z-ordering: regions -> tracks -> pads -> holes -> text
 */
export function generateFootprintSvg(dataStr: FootprintDataStr): string {
  if (!dataStr.shape || dataStr.shape.length === 0) {
    return ''
  }

  // Get bounding box or calculate from origin
  const bbox = dataStr.BBox || { x: 0, y: 0, width: 100, height: 100 }
  const padding = 5
  const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`

  // Separate shapes by type for proper z-ordering
  const regions: string[] = []
  const tracks: string[] = []
  const pads: string[] = []
  const holes: string[] = []
  const texts: string[] = []

  for (const shape of dataStr.shape) {
    if (typeof shape !== 'string') continue

    if (shape.startsWith('SOLIDREGION~')) {
      const svg = renderSolidRegion(shape)
      if (svg) regions.push(svg)
    } else if (shape.startsWith('TRACK~')) {
      const svg = renderTrackShape(shape)
      if (svg) tracks.push(svg)
    } else if (shape.startsWith('PAD~')) {
      const result = renderPadShape(shape)
      if (result) {
        pads.push(result.pad)
        if (result.hole) holes.push(result.hole)
      }
    } else if (shape.startsWith('TEXT~')) {
      const svg = renderTextShape(shape)
      if (svg) texts.push(svg)
    }
  }

  const allElements = [...regions, ...tracks, ...pads, ...holes, ...texts]
  if (allElements.length === 0) {
    return ''
  }

  // KiCAD-style colors: black bg, red pads, grey holes, yellow outlines/text
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" style="background:#000000">
  <style>
    .pad { fill: #CC0000; stroke: none; }
    .pad-hole { fill: #666666; }
    .track { fill: none; stroke: #FFFF00; stroke-linecap: round; stroke-linejoin: round; }
    .region { fill: #CC0000; opacity: 0.6; }
    .text-path { fill: none; stroke: #FFFF00; stroke-width: 0.4; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  ${allElements.join('\n  ')}
</svg>`
}

/**
 * Render PAD shape to SVG - returns pad and hole separately for z-ordering
 */
function renderPadShape(padData: string): { pad: string; hole: string | null } | null {
  const fields = padData.split('~')
  const shapeType = fields[1]
  const cx = parseFloat(fields[2]) || 0
  const cy = parseFloat(fields[3]) || 0

  if (shapeType === 'POLYGON') {
    const holeDia = parseFloat(fields[9]) || 0
    const pointsStr = fields[10] || ''
    if (!pointsStr) return null

    const coords = pointsStr.split(' ').map(Number)
    if (coords.length < 4) return null

    let pathD = `M ${coords[0]} ${coords[1]}`
    for (let i = 2; i < coords.length; i += 2) {
      pathD += ` L ${coords[i]} ${coords[i + 1]}`
    }
    pathD += ' Z'

    return {
      pad: `<path class="pad" d="${pathD}"/>`,
      hole: holeDia > 0 ? `<circle class="pad-hole" cx="${cx}" cy="${cy}" r="${holeDia}"/>` : null,
    }
  }

  // Standard pads: ELLIPSE, OVAL, RECT, ROUND
  const width = parseFloat(fields[4]) || 0
  const height = parseFloat(fields[5]) || 0
  const holeDia = parseFloat(fields[9]) || 0

  let padSvg = ''

  if (shapeType === 'ELLIPSE' || shapeType === 'OVAL' || shapeType === 'ROUND') {
    const rx = width / 2
    const ry = height / 2
    padSvg = `<ellipse class="pad" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`
  } else {
    // RECT or default
    const rectX = cx - width / 2
    const rectY = cy - height / 2
    padSvg = `<rect class="pad" x="${rectX}" y="${rectY}" width="${width}" height="${height}"/>`
  }

  return {
    pad: padSvg,
    hole: holeDia > 0 ? `<circle class="pad-hole" cx="${cx}" cy="${cy}" r="${holeDia}"/>` : null,
  }
}

/**
 * Render TRACK shape to SVG
 */
function renderTrackShape(trackData: string): string | null {
  const fields = trackData.split('~')
  const strokeWidth = parseFloat(fields[1]) || 0.5
  const pointsStr = fields[4] || ''

  if (!pointsStr) return null

  const coords = pointsStr.split(' ').map(Number)
  if (coords.length < 4) return null

  let pathD = `M ${coords[0]} ${coords[1]}`
  for (let i = 2; i < coords.length; i += 2) {
    pathD += ` L ${coords[i]} ${coords[i + 1]}`
  }

  return `<path class="track" d="${pathD}" stroke-width="${strokeWidth}"/>`
}

/**
 * Render SOLIDREGION shape to SVG
 */
function renderSolidRegion(regionData: string): string | null {
  const fields = regionData.split('~')
  const pathD = fields[3] || ''

  if (!pathD || !pathD.startsWith('M')) return null

  return `<path class="region" d="${pathD}"/>`
}

/**
 * Render TEXT shape to SVG using pre-rendered path
 */
function renderTextShape(textData: string): string | null {
  const fields = textData.split('~')
  const svgPath = fields[11] || ''

  if (!svgPath || !svgPath.startsWith('M')) return null

  return `<path class="text-path" d="${svgPath}"/>`
}

// Symbol shape interfaces
export interface SymbolPin {
  x: number
  y: number
  name?: string
  number?: string
  rotation?: number
  pinLength?: number
}

export interface SymbolRect {
  x: number
  y: number
  width: number
  height: number
  strokeWidth?: number
  rx?: number
  ry?: number
}

export interface SymbolCircle {
  cx: number
  cy: number
  radius: number
  strokeWidth?: number
}

export interface SymbolEllipse {
  cx: number
  cy: number
  radiusX: number
  radiusY: number
  strokeWidth?: number
}

export interface SymbolPolyline {
  points: string
  strokeWidth?: number
}

export interface SymbolPolygon {
  points: string
  strokeWidth?: number
}

export interface SymbolArc {
  path: string
  strokeWidth?: number
}

export interface SymbolPath {
  path: string
  strokeWidth?: number
}

export interface StructuredSymbol {
  pins?: SymbolPin[]
  rectangles?: SymbolRect[]
  circles?: SymbolCircle[]
  ellipses?: SymbolEllipse[]
  polylines?: SymbolPolyline[]
  polygons?: SymbolPolygon[]
  arcs?: SymbolArc[]
  paths?: SymbolPath[]
  origin?: { x: number; y: number }
}

/**
 * Convert symbol X coordinate (origin-relative, scaled to mm)
 */
function convertSymbolX(x: number, originX: number): number {
  return (x - originX) * EE_TO_MM
}

/**
 * Convert symbol Y coordinate (origin-relative, scaled to mm, Y-flipped)
 * EasyEDA: Y+ down, KiCad/SVG: Y+ up
 */
function convertSymbolY(y: number, originY: number): number {
  return -(y - originY) * EE_TO_MM
}

/**
 * Convert space-separated point string to SVG path with Y-flip
 */
function convertPointsToPath(pointsStr: string, originX: number, originY: number, close: boolean): string {
  const coords = pointsStr.split(' ').map(Number)
  if (coords.length < 4) return ''

  const x0 = convertSymbolX(coords[0], originX)
  const y0 = convertSymbolY(coords[1], originY)
  let path = `M ${x0} ${y0}`

  for (let i = 2; i < coords.length; i += 2) {
    const x = convertSymbolX(coords[i], originX)
    const y = convertSymbolY(coords[i + 1] ?? 0, originY)
    path += ` L ${x} ${y}`
  }

  if (close) path += ' Z'
  return path
}

/**
 * Transform SVG path string with Y-flip and origin offset
 * Handles M, L, A commands (basic SVG path operations)
 */
function transformSvgPath(pathStr: string, originX: number, originY: number): string {
  // Parse path commands and transform coordinates
  // Simple transformation: flip Y coordinates and apply origin offset
  let result = ''
  let i = 0

  while (i < pathStr.length) {
    // Skip whitespace
    while (i < pathStr.length && /\s/.test(pathStr[i])) i++
    if (i >= pathStr.length) break

    const cmd = pathStr[i]
    i++

    // Skip whitespace after command
    while (i < pathStr.length && /\s/.test(pathStr[i])) i++

    if (cmd === 'M' || cmd === 'L') {
      // Move/Line: 2 coordinates
      const match = pathStr.slice(i).match(/^(-?[\d.]+)\s+(-?[\d.]+)/)
      if (match) {
        const x = convertSymbolX(parseFloat(match[1]), originX)
        const y = convertSymbolY(parseFloat(match[2]), originY)
        result += `${cmd} ${x} ${y} `
        i += match[0].length
      }
    } else if (cmd === 'A') {
      // Arc: rx ry rotation large-arc sweep x y
      const match = pathStr.slice(i).match(/^(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+([01])\s+([01])\s+(-?[\d.]+)\s+(-?[\d.]+)/)
      if (match) {
        const rx = parseFloat(match[1]) * EE_TO_MM
        const ry = parseFloat(match[2]) * EE_TO_MM
        const rotation = parseFloat(match[3])
        const largeArc = match[4]
        // Flip sweep direction when Y is flipped
        const sweep = match[5] === '0' ? '1' : '0'
        const x = convertSymbolX(parseFloat(match[6]), originX)
        const y = convertSymbolY(parseFloat(match[7]), originY)
        result += `A ${rx} ${ry} ${rotation} ${largeArc} ${sweep} ${x} ${y} `
        i += match[0].length
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      result += 'Z '
    } else if (cmd === 'C') {
      // Cubic bezier: x1 y1 x2 y2 x y
      const match = pathStr.slice(i).match(/^(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/)
      if (match) {
        const x1 = convertSymbolX(parseFloat(match[1]), originX)
        const y1 = convertSymbolY(parseFloat(match[2]), originY)
        const x2 = convertSymbolX(parseFloat(match[3]), originX)
        const y2 = convertSymbolY(parseFloat(match[4]), originY)
        const x = convertSymbolX(parseFloat(match[5]), originX)
        const y = convertSymbolY(parseFloat(match[6]), originY)
        result += `C ${x1} ${y1} ${x2} ${y2} ${x} ${y} `
        i += match[0].length
      }
    } else if (cmd === 'Q') {
      // Quadratic bezier: x1 y1 x y
      const match = pathStr.slice(i).match(/^(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)/)
      if (match) {
        const x1 = convertSymbolX(parseFloat(match[1]), originX)
        const y1 = convertSymbolY(parseFloat(match[2]), originY)
        const x = convertSymbolX(parseFloat(match[3]), originX)
        const y = convertSymbolY(parseFloat(match[4]), originY)
        result += `Q ${x1} ${y1} ${x} ${y} `
        i += match[0].length
      }
    } else {
      // Unknown command, skip numbers
      const match = pathStr.slice(i).match(/^[\s\d.,+-]+/)
      if (match) i += match[0].length
    }
  }

  return result.trim()
}

/**
 * Generate SVG from symbol data with all shape types
 * Renders: pins, rectangles, circles, ellipses, polylines, polygons, arcs, paths
 */
export function generateSymbolSvg(symbol: StructuredSymbol): string {
  const origin = symbol.origin || { x: 0, y: 0 }
  const pins = symbol.pins || []
  const rects = symbol.rectangles || []
  const circles = symbol.circles || []
  const ellipses = symbol.ellipses || []
  const polylines = symbol.polylines || []
  const polygons = symbol.polygons || []
  const arcs = symbol.arcs || []
  const paths = symbol.paths || []

  // Calculate bounding box from all shapes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  // Helper to expand bounds
  const expandBounds = (x: number, y: number) => {
    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  // Pins
  for (const pin of pins) {
    const x = convertSymbolX(pin.x, origin.x)
    const y = convertSymbolY(pin.y, origin.y)
    expandBounds(x, y)
  }

  // Rectangles
  for (const rect of rects) {
    const x1 = convertSymbolX(rect.x, origin.x)
    const y1 = convertSymbolY(rect.y, origin.y)
    const x2 = x1 + toMM(rect.width)
    const y2 = y1 - toMM(rect.height)
    expandBounds(x1, y1)
    expandBounds(x2, y2)
  }

  // Circles
  for (const circle of circles) {
    const cx = convertSymbolX(circle.cx, origin.x)
    const cy = convertSymbolY(circle.cy, origin.y)
    const r = toMM(circle.radius)
    expandBounds(cx - r, cy - r)
    expandBounds(cx + r, cy + r)
  }

  // Ellipses
  for (const ellipse of ellipses) {
    const cx = convertSymbolX(ellipse.cx, origin.x)
    const cy = convertSymbolY(ellipse.cy, origin.y)
    const rx = toMM(ellipse.radiusX)
    const ry = toMM(ellipse.radiusY)
    expandBounds(cx - rx, cy - ry)
    expandBounds(cx + rx, cy + ry)
  }

  // Polylines and polygons
  for (const shape of [...polylines, ...polygons]) {
    const coords = shape.points.split(' ').map(Number)
    for (let i = 0; i < coords.length; i += 2) {
      const x = convertSymbolX(coords[i], origin.x)
      const y = convertSymbolY(coords[i + 1] ?? 0, origin.y)
      expandBounds(x, y)
    }
  }

  // Arcs and paths - estimate bounds from path
  for (const shape of [...arcs, ...paths]) {
    // Extract coordinates from path for rough bounds
    const numbers = shape.path.match(/-?[\d.]+/g)?.map(Number) || []
    for (let i = 0; i < numbers.length; i += 2) {
      if (i + 1 < numbers.length) {
        const x = convertSymbolX(numbers[i], origin.x)
        const y = convertSymbolY(numbers[i + 1], origin.y)
        expandBounds(x, y)
      }
    }
  }

  // Default bounds if nothing found
  if (!isFinite(minX)) {
    minX = -10; minY = -10; maxX = 10; maxY = 10
  }

  const padding = 2
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`

  const bodyElements: string[] = []
  const pinElements: string[] = []

  // Render rectangles
  for (const rect of rects) {
    const x = convertSymbolX(rect.x, origin.x)
    const y = convertSymbolY(rect.y, origin.y)
    const w = toMM(rect.width)
    const h = toMM(rect.height)
    const strokeW = toMM(rect.strokeWidth || 2)
    const rx = rect.rx ? toMM(rect.rx) : 0
    const ry = rect.ry ? toMM(rect.ry) : 0
    const rxAttr = rx > 0 ? ` rx="${rx}"` : ''
    const ryAttr = ry > 0 ? ` ry="${ry}"` : ''
    bodyElements.push(`<rect x="${x}" y="${y - h}" width="${w}" height="${h}"${rxAttr}${ryAttr} class="body" stroke-width="${strokeW}"/>`)
  }

  // Render circles
  for (const circle of circles) {
    const cx = convertSymbolX(circle.cx, origin.x)
    const cy = convertSymbolY(circle.cy, origin.y)
    const r = toMM(circle.radius)
    const strokeW = toMM(circle.strokeWidth || 2)
    bodyElements.push(`<circle cx="${cx}" cy="${cy}" r="${r}" class="body" stroke-width="${strokeW}"/>`)
  }

  // Render ellipses
  for (const ellipse of ellipses) {
    const cx = convertSymbolX(ellipse.cx, origin.x)
    const cy = convertSymbolY(ellipse.cy, origin.y)
    const rx = toMM(ellipse.radiusX)
    const ry = toMM(ellipse.radiusY)
    const strokeW = toMM(ellipse.strokeWidth || 2)
    bodyElements.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" class="body" stroke-width="${strokeW}"/>`)
  }

  // Render polylines (open paths)
  for (const polyline of polylines) {
    const path = convertPointsToPath(polyline.points, origin.x, origin.y, false)
    if (path) {
      const strokeW = toMM(polyline.strokeWidth || 2)
      bodyElements.push(`<path d="${path}" class="body" stroke-width="${strokeW}"/>`)
    }
  }

  // Render polygons (closed filled paths)
  for (const polygon of polygons) {
    const path = convertPointsToPath(polygon.points, origin.x, origin.y, true)
    if (path) {
      const strokeW = toMM(polygon.strokeWidth || 2)
      bodyElements.push(`<path d="${path}" class="filled" stroke-width="${strokeW}"/>`)
    }
  }

  // Render arcs
  for (const arc of arcs) {
    const transformedPath = transformSvgPath(arc.path, origin.x, origin.y)
    if (transformedPath) {
      const strokeW = toMM(arc.strokeWidth || 2)
      bodyElements.push(`<path d="${transformedPath}" class="body" stroke-width="${strokeW}"/>`)
    }
  }

  // Render paths
  for (const pathShape of paths) {
    const transformedPath = transformSvgPath(pathShape.path, origin.x, origin.y)
    if (transformedPath) {
      const strokeW = toMM(pathShape.strokeWidth || 2)
      bodyElements.push(`<path d="${transformedPath}" class="body" stroke-width="${strokeW}"/>`)
    }
  }

  // Render pins as circles (on top of body)
  for (const pin of pins) {
    const x = convertSymbolX(pin.x, origin.x)
    const y = convertSymbolY(pin.y, origin.y)
    pinElements.push(`<circle cx="${x}" cy="${y}" r="0.5" class="pin"/>`)
  }

  const allElements = [...bodyElements, ...pinElements]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" style="background:#000000">
  <style>
    .body { fill: none; stroke: #00AAFF; stroke-linecap: round; stroke-linejoin: round; }
    .filled { fill: #00AAFF; fill-opacity: 0.3; stroke: #00AAFF; stroke-linecap: round; stroke-linejoin: round; }
    .pin { fill: #CC0000; stroke: none; }
  </style>
  ${allElements.join('\n  ')}
</svg>`
}

/**
 * Generate SVG from structured footprint data (pads, tracks, circles)
 * Used when the API returns parsed footprint data instead of raw shapes
 *
 * Applies KiCad-style transformations:
 * - Origin subtraction (center footprint at 0,0)
 * - Unit conversion (10mil → mm)
 * - Pad rotation
 * - Layer filtering (show only silkscreen and edge cuts)
 */
export function generateFootprintSvgFromStructured(footprint: StructuredFootprint): string {
  const pads = footprint.pads || []
  const tracks = footprint.tracks || []
  const circles = footprint.circles || []
  const origin = footprint.origin || { x: 0, y: 0 }

  if (pads.length === 0 && tracks.length === 0) {
    return ''
  }

  // Filter tracks to only show silkscreen and edge cuts
  const visibleTracks = tracks.filter(t => !t.layerId || VISIBLE_LAYERS.has(t.layerId))
  const visibleCircles = circles.filter(c => !c.layerId || VISIBLE_LAYERS.has(c.layerId))

  // Calculate bounding box in converted coordinates (mm, origin-relative)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

  for (const pad of pads) {
    const cx = convertCoord(pad.centerX, origin.x)
    const cy = convertCoord(pad.centerY, origin.y)
    const halfW = toMM(pad.width) / 2
    const halfH = toMM(pad.height) / 2
    minX = Math.min(minX, cx - halfW)
    minY = Math.min(minY, cy - halfH)
    maxX = Math.max(maxX, cx + halfW)
    maxY = Math.max(maxY, cy + halfH)
  }

  for (const track of visibleTracks) {
    const rawCoords = track.points.split(' ').map(Number)
    for (let i = 0; i < rawCoords.length; i += 2) {
      const x = convertCoord(rawCoords[i], origin.x)
      const y = convertCoord(rawCoords[i + 1] ?? 0, origin.y)
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
  }

  // Default bounds if nothing found
  if (!isFinite(minX)) {
    return ''
  }

  const padding = 0.5  // mm padding
  const width = maxX - minX + padding * 2
  const height = maxY - minY + padding * 2
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`

  const trackElements: string[] = []
  const padElements: string[] = []
  const holeElements: string[] = []

  // Render tracks (converted coordinates)
  for (const track of visibleTracks) {
    const rawCoords = track.points.split(' ').map(Number)
    if (rawCoords.length >= 4) {
      const x0 = convertCoord(rawCoords[0], origin.x)
      const y0 = convertCoord(rawCoords[1], origin.y)
      let pathD = `M ${x0} ${y0}`
      for (let i = 2; i < rawCoords.length; i += 2) {
        const x = convertCoord(rawCoords[i], origin.x)
        const y = convertCoord(rawCoords[i + 1] ?? 0, origin.y)
        pathD += ` L ${x} ${y}`
      }
      const strokeW = toMM(track.strokeWidth)
      trackElements.push(`<path class="track" d="${pathD}" stroke-width="${strokeW}"/>`)
    }
  }

  // Render pads (converted coordinates with rotation support)
  for (const pad of pads) {
    const cx = convertCoord(pad.centerX, origin.x)
    const cy = convertCoord(pad.centerY, origin.y)
    const w = toMM(pad.width)
    const h = toMM(pad.height)
    const rotation = pad.rotation || 0

    // Build rotation transform if needed
    const transform = rotation !== 0 ? ` transform="rotate(${rotation} ${cx} ${cy})"` : ''

    if (pad.shape === 'ELLIPSE' || pad.shape === 'OVAL' || pad.shape === 'ROUND') {
      const rx = w / 2
      const ry = h / 2
      padElements.push(`<ellipse class="pad" cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${transform}/>`)
    } else if (pad.shape === 'POLYGON' && pad.points) {
      // Polygon pads - convert points relative to pad center
      const rawPts = pad.points.split(' ').map(Number)
      if (rawPts.length >= 4) {
        let pathD = ''
        for (let i = 0; i < rawPts.length; i += 2) {
          // Points are relative to pad center in converted coords
          const px = convertCoord(rawPts[i], origin.x)
          const py = convertCoord(rawPts[i + 1] ?? 0, origin.y)
          pathD += i === 0 ? `M ${px} ${py}` : ` L ${px} ${py}`
        }
        pathD += ' Z'
        padElements.push(`<path class="pad" d="${pathD}"${transform}/>`)
      }
    } else {
      // RECT or default
      const rectX = cx - w / 2
      const rectY = cy - h / 2
      padElements.push(`<rect class="pad" x="${rectX}" y="${rectY}" width="${w}" height="${h}"${transform}/>`)
    }

    // Add hole if present (converted size)
    if (pad.holeRadius && pad.holeRadius > 0) {
      const holeR = toMM(pad.holeRadius)
      holeElements.push(`<circle class="pad-hole" cx="${cx}" cy="${cy}" r="${holeR}"/>`)
    }
  }

  // Render circles (converted coordinates)
  for (const circle of visibleCircles) {
    const cx = convertCoord(circle.cx, origin.x)
    const cy = convertCoord(circle.cy, origin.y)
    const r = toMM(circle.radius)
    const strokeW = toMM(circle.strokeWidth || 2)
    trackElements.push(`<circle class="track" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke-width="${strokeW}"/>`)
  }

  const allElements = [...trackElements, ...padElements, ...holeElements]

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" style="background:#000000">
  <style>
    .pad { fill: #CC0000; stroke: none; }
    .pad-hole { fill: #666666; }
    .track { fill: none; stroke: #FFFF00; stroke-linecap: round; stroke-linejoin: round; }
  </style>
  ${allElements.join('\n  ')}
</svg>`
}
