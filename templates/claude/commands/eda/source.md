---
description: Interactive component sourcing session
argument-hint: [component-role]
allowed-tools: Read, Write, Glob, WebFetch, mcp__jlc__*, mcp__kicad-sch__search_symbols, mcp__kicad-sch__list_symbol_libraries, mcp__kicad-sch__get_symbol_info
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

### 1.5 Check Architecture Constraints

Review `design-constraints.json` before searching:
- **Power topology:** If sourcing regulator, was LDO or buck decided?
- **Thermal budget:** Check `thermal.hotComponents` for power limit
- **DFM targets:** Assembly method affects package options
- **Layer count:** May indicate design complexity

For power components, reference `eda-research/reference/REGULATOR-SELECTION.md`.

### 2. Search Components

**ALWAYS search LOCAL libraries first, then online.**

Available MCP tools:
- `/mcp__kicad-sch__search_symbols` - Search local KiCad symbol libraries (JLCPCB, etc.)
- `/mcp__jlc__component_search` - Search JLC online with `query`, `basic_only`, `in_stock`, `limit`
- `/mcp__jlc__component_get` - Get online component details with `lcsc_id`
- `/mcp__jlc__library_fetch` - Fetch KiCad symbol/footprint from online (returns `validation_data`)
- `/mcp__jlc__library_fix` - Fix symbol issues (add pins, rename, change types)

**Do NOT use Bash. Do NOT use WebSearch for components.**

**Search Strategy (in order):**

1. **First: Local Libraries** - Search installed KiCad libraries
   ```
   /mcp__kicad-sch__search_symbols query="ESP32" library="JLCPCB"
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

1. **Download datasheet** from JLC (URL pattern: `https://www.lcsc.com/datasheet/<LCSC_NUMBER>.pdf`):
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

### 4.5 Validate Before Presenting

For each candidate, verify:

**Thermal check (power components):**
```
P_loss = (Vin - Vout) × I_load  [for LDO]
P_loss = (1 - efficiency) × P_out  [for buck]

Compare to thermal budget from design-constraints.json
Flag if P_loss > allocated budget
```

**Assembly check:**
| Assembly Method | Package OK? |
|----------------|-------------|
| Hand | 0603+, no QFN/BGA |
| Reflow | 0402+, QFN OK |
| Turnkey | Any, but check JLC stock |

**Architecture check:**
- Regulator type matches LDO/buck decision
- Noise spec appropriate for rail type
- Efficiency acceptable for battery apps

Include validation status in the options table (✓ or ⚠ with note).

### 5. Get Selection

Ask user to choose or request more options.

Once selected, handle based on source:

**If LOCAL component selected (L1, L2, etc.):**
- Use the symbol reference directly (e.g., `PCM_JLCPCB-MCUs:STM32F103C8T6`)
- **Skip library_fetch** - component is already in KiCad libraries
- Get datasheet URL from symbol info if needed
- Note: Verify current stock/price on JLC website before ordering

**If ONLINE component selected (O1, O2, etc.):**
- Confirm the choice
- Download datasheet if not already done
- Proceed to fetch KiCad libraries (section 6)

### 6. Fetch KiCad Libraries (Online Components Only)

**Skip this step if user selected a local library component.**

For online components, fetch the KiCad symbol and footprint:

```
/mcp__jlc__library_fetch lcsc_id="C#####" include_3d=true
```

This saves to the **global JLC library** (automatically discovered by kicad-mcp):
- `~/Documents/KiCad/9.0/symbols/JLC-*.kicad_sym` - Category-based symbol libraries
- `~/Documents/KiCad/9.0/footprints/JLC.pretty/<NAME>_<LCSC_ID>.kicad_mod` - PCB footprint
- `~/Documents/KiCad/9.0/3dmodels/JLC.3dshapes/<LCSC_ID>.step` - 3D model (if available)

The response includes:
- `symbol_ref`: Reference for kicad-mcp (e.g., `JLC-ICs:ESP32-C3`)
- `footprint_ref`: Footprint reference (e.g., `Package_DFN_QFN:QFN-56-1EP_7x7mm_P0.4mm`)
- `validation_data`: Symbol/footprint quality data for analysis (see below)

**For project-local storage** (optional):
```
/mcp__jlc__library_fetch lcsc_id="C#####" project_path="/path/to/project" include_3d=true
```

### 6.5 Validate Symbol Quality

After fetching, **analyze the `validation_data`** in the response:

```json
{
  "validation_data": {
    "symbol": { "pin_count": 39, "pins": [...] },
    "footprint": { "pad_count": 57, "is_kicad_standard": true },
    "checks": {
      "pin_pad_count_match": false,
      "has_power_pins": true,
      "has_ground_pins": true
    }
  }
}
```

**Quick checks:**
- `pin_pad_count_match: false` ⚠️ - Pin/pad mismatch, investigate
- `has_power_pins: false` ⚠️ - IC missing power pin types
- `has_ground_pins: false` ⚠️ - IC missing ground pins

**Common issues and fixes:**

| Issue | Cause | Fix Action |
|-------|-------|------------|
| Pin count < Pad count | QFN/BGA exposed pad (EP) not in symbol | Add EP pin |
| Power pins marked passive | Source data incorrect | Modify pin type |
| Pin names wrong | Source data error | Rename pins |

### 6.6 Fix Symbol Issues (library_fix)

If validation issues detected, use `library_fix` to regenerate with corrections:

```
/mcp__jlc__library_fix lcsc_id="C#####" corrections='{
  "pins": [
    { "action": "add", "number": "EP", "name": "GND", "type": "passive" },
    { "action": "modify", "number": "1", "set_type": "power_in" },
    { "action": "modify", "number": "2", "rename": "VDD", "set_type": "power_in" }
  ]
}'
```

**Correction actions:**
- `add` - Add missing pin (e.g., exposed thermal pad)
- `modify` - Rename pin or change electrical type
- `swap` - Swap positions of two pins
- `remove` - Remove incorrect pin

**Example: ESP32-S3 QFN-56 with missing EP:**
```
Response shows: 39 symbol pins vs 57 footprint pads (pin_pad_count_match: false)
Analysis: QFN-56 has exposed thermal pad (EP) for heat dissipation, not in symbol

Fix:
/mcp__jlc__library_fix lcsc_id="C2913199" corrections='{"pins":[{"action":"add","number":"EP","name":"GND","type":"passive"}]}'
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
- Source: LOCAL (existing library) or FETCHED (from JLC)
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
