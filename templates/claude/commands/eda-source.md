---
description: Interactive component sourcing session
argument-hint: [component-role]
allowed-tools: Read, Write, Glob, WebFetch, mcp__lcsc__*, mcp__kicad__search_symbols, mcp__kicad__list_symbol_libraries, mcp__kicad__get_symbol_info
---

# Component Sourcing: $ARGUMENTS

Guide the user through sourcing components for role: **$ARGUMENTS**

## Context Loading

Read project context:
- `@docs/design-constraints.json` - Project requirements
- `@docs/project-spec.md` - Full specification
- `@docs/component-selections.md` - Already selected components (if exists)

### If context missing:

Ask user for minimum information needed:
1. What does this component need to do?
2. Key specifications (voltage, current, package)?
3. Any specific preferences or constraints?

## Interactive Workflow

### 1. Clarify Requirements

For the role **$ARGUMENTS**, ask:
- What are the must-have specifications?
- Any nice-to-have features?
- Package size preferences? (Easy to hand-solder? Compact?)
- Any brands or series to prefer or avoid?

### 2. Search Components

**ALWAYS search LOCAL libraries first, then online.**

Available MCP tools:
- `/mcp__kicad__search_symbols` - Search local KiCad symbol libraries (JLCPCB, etc.)
- `/mcp__lcsc__component_search` - Search LCSC online with `query`, `basic_only`, `in_stock`, `limit`
- `/mcp__lcsc__component_get` - Get online component details with `lcsc_id`
- `/mcp__lcsc__library_fetch` - Fetch KiCad symbol/footprint from online

**Do NOT use Bash. Do NOT use WebSearch for components.**

**Search Strategy (in order):**

1. **First: Local Libraries** - Search installed KiCad libraries
   ```
   /mcp__kicad__search_symbols query="ESP32" library="JLCPCB"
   ```
   - Searches JLCPCB-KiCad-Library and other installed PCM libraries
   - Components are ready to use immediately (no fetch needed)
   - Note: Stock/price data from library files may be outdated

2. **Then: Online (LCSC)** - Search for additional options
   - **Basic + In-Stock**: `basic_only: true, in_stock: true`
     - JLCPCB Basic parts = no setup fee ($3 savings)
   - **Extended + In-Stock**: `basic_only: false, in_stock: true`
     - Wider selection but setup fee applies
   - **Last Resort**: `in_stock: false` for out-of-stock items

### 3. Download and Analyze Datasheets

For each promising candidate:

1. **Download datasheet** from LCSC (URL pattern: `https://www.lcsc.com/datasheet/<LCSC_NUMBER>.pdf`):
   ```
   WebFetch("https://www.lcsc.com/datasheet/C12345.pdf", "Download and analyze datasheet")
   ```
2. **Save locally** to `datasheets/<LCSC_NUMBER>_<MPN>.pdf`
3. **Read and extract** key info:
   - Typical application circuit
   - Recommended external components
   - Layout guidelines (thermal pads, decoupling placement)
   - Absolute maximum ratings
   - Key electrical specs

### 4. Present Options

Show results in two groups:

**Already in Local Library (Ready to Use):**
| # | Library | Symbol | LCSC | Description |
|---|---------|--------|------|-------------|
| L1 | PCM_JLCPCB-MCUs | STM32F103C8T6 | C8734 | ARM Cortex-M3 MCU |
| L2 | PCM_JLCPCB-Extended | ESP32-C3 | C2838500 | WiFi+BLE RISC-V MCU |

**Available Online (Needs Fetch):**
| # | LCSC # | MPN | Key Specs | Price | Stock |
|---|--------|-----|-----------|-------|-------|
| O1 | C##### | ... | ... | $X.XX | #### |
| O2 | C##### | ... | ... | $X.XX | #### |

Include for each option:
- **Symbol reference** (for local) or **LCSC part number** (for online)
- Key specifications relevant to the role
- Price/stock (note: local library data may be stale)
- Pros and cons

### 5. Get Selection

Ask user to choose or request more options.

Once selected, handle based on source:

**If LOCAL component selected (L1, L2, etc.):**
- Use the symbol reference directly (e.g., `PCM_JLCPCB-MCUs:STM32F103C8T6`)
- **Skip library_fetch** - component is already in KiCad libraries
- Get datasheet URL from symbol info if needed
- Note: Verify current stock/price on LCSC website before ordering

**If ONLINE component selected (O1, O2, etc.):**
- Confirm the choice
- Download datasheet if not already done
- Proceed to fetch KiCad libraries (section 6)

### 6. Fetch KiCad Libraries (Online Components Only)

**Skip this step if user selected a local library component.**

For online components, fetch the KiCad symbol and footprint:

```
/mcp__lcsc__library_fetch lcsc_id="C#####" include_3d=true
```

This saves to the **global EDA-MCP library** (automatically discovered by kicad-mcp):
- `~/Documents/KiCad/9.0/symbols/EDA-MCP.kicad_sym` - Unified symbol library
- `~/Documents/KiCad/9.0/footprints/EDA-MCP.pretty/<NAME>_<LCSC_ID>.kicad_mod` - PCB footprint
- `~/Documents/KiCad/9.0/3dmodels/EDA-MCP.3dshapes/<LCSC_ID>.step` - 3D model (if available)

The response includes:
- `symbol_ref`: Reference for kicad-mcp (e.g., `EDA-MCP:ESP32-C3`)
- `footprint_ref`: Footprint reference (e.g., `EDA-MCP:QFN-32_C2838386`)

**For project-local storage** (optional):
```
/mcp__lcsc__library_fetch lcsc_id="C#####" project_path="/path/to/project" include_3d=true
```

## Output

Update these files:

### docs/component-selections.md

Add entry:
```markdown
### [Role]: [Part Name]

**LCSC:** C##### (link to LCSC page)
**MPN:** [Manufacturer Part Number]
**Manufacturer:** [Name]
**Package:** [Package type]

**Stock:** #### units (as of [date])
**Price:** $X.XX @ [qty] | $X.XX @ [qty]

**Key Specifications:**
- Spec 1: value
- Spec 2: value

**Rationale:** [Why chosen over alternatives]

**Design Notes:** (from datasheet)
- Application circuit components
- Layout recommendations
- Thermal considerations

**Datasheet:** `datasheets/C#####_[MPN].pdf`

**KiCad References:**
- Symbol: `[Library]:[SymbolName]` (e.g., `PCM_JLCPCB-MCUs:STM32F103C8T6` or `EDA-MCP:ESP32-C3`)
- Footprint: `[Library]:[FootprintName]`
- Source: LOCAL (existing library) or FETCHED (from LCSC)
```

### docs/design-constraints.json

Update the `components` section:
- Move role from `pending` to `selected`
- Add component details

### Datasheet

Save datasheet to `datasheets/` folder if not already present.

## Next Steps

After selection, ask:
- "Would you like to source another component?"
- Suggest logical next component based on dependencies

When all components sourced:
- Suggest `/eda-schematic` to begin schematic capture
- Update stage to "schematic"
