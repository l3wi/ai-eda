---
description: Interactive component sourcing session
argument-hint: [component-role]
allowed-tools: Read, Write, Glob, WebFetch, mcp__lcsc__component_search, mcp__lcsc__component_get, mcp__lcsc__library_fetch, mcp__lcsc__library_get_symbol, mcp__lcsc__library_get_footprint
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

### 2. Search LCSC (PRIMARY SOURCE)

**ALWAYS use LCSC MCP tools first** - this is your primary component database:

```
# Step 1: Search for components
mcp__lcsc__component_search("<search terms>")

# Step 2: Get details for promising candidates (includes datasheet URL)
mcp__lcsc__component_get("<lcsc_part_number>")
```

**Do NOT use WebSearch for finding components** - the LCSC MCP has real-time stock, pricing, and specifications.

Focus on:
- In-stock components (check `stock` field)
- Note pricing at quantity (`price` field)
- JLCPCB Basic parts (when suitable)

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

Show a comparison table with 3-5 options:

| Option | LCSC # | MPN | Key Specs | Price | Stock | Datasheet |
|--------|--------|-----|-----------|-------|-------|-----------|
| 1 (Rec)| C##### | ... | ... | $X.XX | #### | [link] |
| 2 | C##### | ... | ... | $X.XX | #### | [link] |
| 3 | C##### | ... | ... | $X.XX | #### | [link] |

Include for each option:
- **LCSC part number** (required for ordering)
- Key specifications relevant to the role
- Price at target quantity
- Current stock level
- Link to downloaded datasheet
- Pros and cons

### 5. Get Selection

Ask user to choose or request more options.

Once selected:
- Confirm the choice
- Download datasheet if not already done
- Document design notes from datasheet

### 6. Fetch KiCad Libraries

After user confirms selection, fetch the KiCad symbol and footprint:

```
mcp__lcsc__library_fetch({
  "lcsc_id": "C#####",
  "output_dir": "./libraries",
  "include_3d": true
})
```

This saves:
- `libraries/symbols/<LCSC_ID>.kicad_sym` - Schematic symbol
- `libraries/footprints/LCSC.pretty/<NAME>_<LCSC_ID>.kicad_mod` - PCB footprint
- `libraries/3dmodels/LCSC.3dshapes/<LCSC_ID>.step` - 3D model (if available)

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

**KiCad Libraries:**
- Symbol: `libraries/symbols/C#####.kicad_sym`
- Footprint: `libraries/footprints/LCSC.pretty/[NAME]_C#####.kicad_mod`
- 3D Model: `libraries/3dmodels/LCSC.3dshapes/C#####.step`
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
