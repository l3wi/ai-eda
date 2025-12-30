# Library Cleanup: Hybrid Footprints, Category Libraries, Value Normalization

**Status: IMPLEMENTED** (2024-12-30)

## Overview

Improve jlc-mcp library generation by implementing patterns from JLCPCB-Kicad-Library:
1. **Hybrid footprints** - Use KiCad standard footprints when available, generate custom for complex parts
2. **Category-based libraries** - Separate symbol files (`JLC-Resistors.kicad_sym`, `JLC-Capacitors.kicad_sym`, etc.)
3. **Value normalization** - Clean component values ("16kΩ ±1%" → "16k")
4. **Library update command** - Parse existing libraries and regenerate all components

## KiCad Spec Compliance (from dev-docs.kicad.org)

- **Units**: All millimeters (already compliant)
- **Version**: YYYYMMDD format (already using `20241209`)
- **Generator**: Should NOT use `pcbnew` - use `ai-eda-jlc-mcp` (already correct)
- **Precision**: 6 decimal places footprints, 4 for symbols

---

## Implementation Plan

### Phase 1: Footprint Mapper (Hybrid Approach)

**New file**: `packages/jlc-mcp/src/converter/footprint-mapper.ts`

```typescript
// Map standard packages to KiCad built-in footprints
export interface FootprintMapping {
  library: string;     // "Resistor_SMD", "Package_SO", etc.
  footprint: string;   // "R_0603_1608Metric", "SOIC-8_3.9x4.9mm_P1.27mm"
}

export function mapToKicadFootprint(
  packageName: string,
  componentPrefix: string
): FootprintMapping | null;
```

**Mappings to implement:**

| Package | Library | Footprint |
|---------|---------|-----------|
| 0201 | Resistor_SMD/Capacitor_SMD | R_0201_0603Metric |
| 0402 | Resistor_SMD/Capacitor_SMD | R_0402_1005Metric |
| 0603 | Resistor_SMD/Capacitor_SMD | R_0603_1608Metric |
| 0805 | Resistor_SMD/Capacitor_SMD | R_0805_2012Metric |
| 1206 | Resistor_SMD/Capacitor_SMD | R_1206_3216Metric |
| SOIC-8 | Package_SO | SOIC-8_3.9x4.9mm_P1.27mm |
| TSSOP-8 | Package_SO | TSSOP-8_3x3mm_P0.65mm |
| QFN-16 | Package_DFN_QFN | QFN-16-1EP_3x3mm_P0.5mm |

**Modify**: `packages/jlc-mcp/src/converter/footprint.ts`

Add method to return either a reference or generated content:
```typescript
interface FootprintResult {
  type: 'reference' | 'generated';
  reference?: string;  // "Resistor_SMD:R_0603_1608Metric"
  content?: string;    // Generated .kicad_mod content
}

getFootprint(component: EasyEDAComponentData): FootprintResult;
```

---

### Phase 2: Value Normalizer

**New file**: `packages/jlc-mcp/src/converter/value-normalizer.ts`

```typescript
export type ComponentType = 'resistor' | 'capacitor' | 'inductor' | 'ic' | 'other';

export interface NormalizedValue {
  displayValue: string;   // For symbol Value property
  originalValue: string;  // Keep for Description
}

export function normalizeValue(
  description: string,
  type: ComponentType
): NormalizedValue;

export function detectComponentType(
  prefix: string,
  category?: string
): ComponentType;
```

**Regex patterns:**

```typescript
// Resistors: "16k Ohm ±1% 0.1W" → "16k"
const RESISTOR = /(\d+(?:\.\d+)?)\s*([kKmMgG]?)\s*(?:ohm|Ohm|Ω)?/i;

// Capacitors: "100nF 50V X7R" → "100n/50V"
const CAPACITOR = /(\d+(?:\.\d+)?)\s*([pnuμmM]?)[Ff]?\s*(?:(\d+)\s*[Vv])?/;

// Inductors: "10uH 2A" → "10uH/2A"
const INDUCTOR = /(\d+(?:\.\d+)?)\s*([nμumM]?)[Hh]\s*(?:(\d+(?:\.\d+)?)\s*[Aa])?/;
```

**Modify**: `packages/jlc-mcp/src/converter/symbol.ts:143-165`

Update `generateProperties()` to use normalized values:
```typescript
const type = detectComponentType(info.prefix, info.category);
const { displayValue } = normalizeValue(info.description || info.name, type);
// Use displayValue for Value property
```

---

### Phase 3: Category-Based Libraries

**New file**: `packages/jlc-mcp/src/converter/category-router.ts`

```typescript
export type LibraryCategory =
  | 'Resistors' | 'Capacitors' | 'Inductors'
  | 'Diodes' | 'Transistors' | 'ICs'
  | 'Connectors' | 'Misc';

export function getLibraryCategory(
  prefix: string,
  category?: string
): LibraryCategory;

export function getLibraryFilename(category: LibraryCategory): string;
// Returns: "JLC-Resistors.kicad_sym"
```

**Category mapping by prefix:**
- R → Resistors
- C → Capacitors
- L → Inductors
- D → Diodes
- Q → Transistors
- U → ICs
- J/P → Connectors
- Other → Misc

**Modify**: `packages/jlc-mcp/src/tools/library.ts:252-365`

Update `handleFetchLibrary()`:
1. Determine category from component prefix
2. Use category-specific library file path
3. Handle hybrid footprint result (reference vs generated)

---

### Phase 4: Library Update Command

**New file**: `packages/jlc-mcp/src/tools/library-update.ts`

```typescript
export const updateLibraryTool: Tool = {
  name: 'library_update',
  description: 'Parse existing JLC-* libraries and regenerate all components with latest data and normalization',
  inputSchema: {
    type: 'object',
    properties: {
      project_path: {
        type: 'string',
        description: 'Optional: Project path. If omitted, uses global KiCad library.',
      },
      dry_run: {
        type: 'boolean',
        description: 'Preview changes without writing files (default: false)',
      },
    },
  },
};

export async function handleUpdateLibrary(args: unknown) {
  // 1. Find all JLC-*.kicad_sym files in symbols directory
  // 2. Parse each file to extract LCSC IDs from symbol properties
  // 3. For each LCSC ID:
  //    - Fetch fresh data from EasyEDA
  //    - Apply value normalization
  //    - Apply hybrid footprint logic
  //    - Regenerate symbol entry
  // 4. Rebuild category-based libraries from scratch
  // 5. Regenerate footprints (only custom ones, skip KiCad standard refs)
  // 6. Return summary of changes
}
```

**Parser logic** (extract LCSC IDs from existing library):

```typescript
function extractLcscIdsFromLibrary(content: string): string[] {
  // Find all (property "LCSC" "C12345") entries
  const pattern = /\(property\s+"LCSC"\s+"(C\d+)"/g;
  const ids: string[] = [];
  let match;
  while ((match = pattern.exec(content)) !== null) {
    ids.push(match[1]);
  }
  return ids;
}
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `packages/jlc-mcp/src/converter/footprint-mapper.ts` | KiCad standard footprint mappings |
| `packages/jlc-mcp/src/converter/value-normalizer.ts` | Value extraction and cleanup |
| `packages/jlc-mcp/src/converter/category-router.ts` | Component categorization |
| `packages/jlc-mcp/src/tools/library-update.ts` | Library update/regenerate command |

## Files to Modify

| File | Changes |
|------|---------|
| `packages/jlc-mcp/src/converter/footprint.ts` | Add `getFootprint()` hybrid method |
| `packages/jlc-mcp/src/converter/symbol.ts` | Use normalized values in properties |
| `packages/jlc-mcp/src/tools/library.ts` | Category routing + hybrid footprints + rename to JLC-* |
| `packages/jlc-mcp/src/converter/index.ts` | Export new modules |
| `packages/jlc-mcp/src/tools/index.ts` | Register library_update tool |

---

## Implementation Order

1. **footprint-mapper.ts** - Create with SMD passive mappings (0201-2512)
2. **value-normalizer.ts** - Create with R/C/L regex patterns
3. **category-router.ts** - Create with prefix-based routing
4. **symbol.ts** - Integrate value normalizer
5. **footprint.ts** - Add hybrid `getFootprint()` method
6. **library.ts** - Integrate category routing + hybrid footprints + JLC-* naming
7. **library-update.ts** - Create update command with parser
8. **index.ts** - Register new tool
9. **Test** - Manual test with common LCSC parts (C2040, C17414, etc.)

---

## Library Naming Convention

| Category | Symbol Library | Footprint Dir |
|----------|---------------|---------------|
| Resistors | `JLC-Resistors.kicad_sym` | `JLC.pretty/` |
| Capacitors | `JLC-Capacitors.kicad_sym` | `JLC.pretty/` |
| Inductors | `JLC-Inductors.kicad_sym` | `JLC.pretty/` |
| Diodes | `JLC-Diodes.kicad_sym` | `JLC.pretty/` |
| Transistors | `JLC-Transistors.kicad_sym` | `JLC.pretty/` |
| ICs | `JLC-ICs.kicad_sym` | `JLC.pretty/` |
| Connectors | `JLC-Connectors.kicad_sym` | `JLC.pretty/` |
| Misc | `JLC-Misc.kicad_sym` | `JLC.pretty/` |

**Note:** Footprints stay in a single `.pretty` dir since they're referenced by full name including LCSC ID.

---

## Out of Scope (Keep Simple)

- No archival system (not needed for our use case)
- No GitHub Actions automation
- No IC package mappings initially (focus on passives first)
