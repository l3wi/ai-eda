---
name: eda-research
description: Component research and procurement. Search LCSC for components, analyze datasheets, compare options, and document selections with rationale.
allowed-tools: Read, Write, WebFetch, WebSearch, Glob, mcp__lcsc__*
---

# EDA Research Skill

Source and select components for electronics projects.

## Auto-Activation Triggers

This skill activates when:
- User asks to "find a component", "search for", "source"
- User asks about component specifications or comparisons
- User mentions LCSC, datasheets, or part numbers
- User asks "what MCU/regulator/sensor should I use"
- Project has `design-constraints.json` but missing component selections

## Context Requirements

**Requires:**
- `docs/design-constraints.json` (or prompt user for requirements)
- `docs/project-spec.md` (optional, for context)

**Produces:**
- `docs/component-selections.md` - Human-readable selection log
- `docs/bom-draft.json` - Machine-readable BOM
- `datasheets/*.pdf` - Downloaded datasheets for selected components

## Workflow

### 1. Load Context
Read existing project constraints:
```
@docs/design-constraints.json
@docs/project-spec.md
@docs/component-selections.md (if exists)
```

If constraints missing, ask user for minimum requirements:
- What does this component need to do?
- Key specifications (voltage, current, package)?
- Budget constraints?

### 2. Understand Requirements
For the target component role, identify:
- Critical specifications (must-have)
- Preferred specifications (nice-to-have)
- Package preferences (SMD size, through-hole)
- Any specific brands or series to consider/avoid

### 3. Research Options
Use web search to understand:
- Common solutions for this application
- Recommended parts from reference designs
- Known issues or considerations
- Alternative approaches

### 4. Search LCSC
Use `mcp__lcsc__component_search` to find candidates:
- Search with specific parameters
- Filter by stock availability
- Note pricing at target quantity
- Check for "Basic" parts (lower assembly fee at JLCPCB)

### 5. Analyze Candidates
For top 3-5 options:
- Download/fetch datasheets
- Extract key specifications
- Check application circuits
- Note layout requirements
- Identify any gotchas

### 6. Present Comparison
Create a comparison table:

| Part | MPN | Key Specs | Price | Stock | Pros | Cons |
|------|-----|-----------|-------|-------|------|------|
| ... | ... | ... | ... | ... | ... | ... |

Include recommendation with rationale.

### 7. Confirm Selection
- Get user confirmation
- Document selection with rationale
- Update constraint file
- Save datasheet

## Output Format

### component-selections.md Entry

```markdown
### [Role]: [Part Name] ([LCSC Number])

**Selected:** [Date]
**MPN:** [Manufacturer Part Number]
**Manufacturer:** [Name]
**Price:** $X.XX @ [quantity]

**Specifications:**
- Key spec 1: value
- Key spec 2: value

**Rationale:**
[Why this part was chosen over alternatives]

**Alternatives Considered:**
- [Part 2] - rejected because [reason]
- [Part 3] - rejected because [reason]

**Design Notes:**
- [Any layout or application notes from datasheet]

**Datasheet:** `datasheets/[filename].pdf`
```

### bom-draft.json Entry

```json
{
  "role": "regulator-3v3",
  "lcsc": "C6186",
  "mpn": "AMS1117-3.3",
  "manufacturer": "AMS",
  "description": "3.3V 1A LDO Regulator",
  "value": "3.3V",
  "footprint": "SOT-223",
  "quantity": 1,
  "unitPrice": 0.04,
  "extendedPrice": 0.04,
  "category": "power",
  "basic": true
}
```

## Component Role Categories

See `reference/COMPONENT-CATEGORIES.md` for detailed role definitions.

Common roles:
- `mcu` - Main microcontroller
- `regulator-Xv` - Voltage regulators
- `crystal` - Oscillators/crystals
- `connector-*` - Various connectors
- `esd-*` - ESD protection
- `decoupling-*` - Bypass/bulk capacitors
- `led-*` - Indicator LEDs
- `sensor-*` - Various sensors

## Guidelines

- Prefer JLCPCB "Basic" parts when suitable (lower assembly cost)
- Check stock levels - avoid parts with < 100 in stock
- Consider package size vs hand soldering capability
- Note lead times for non-stock items
- Always document why a part was chosen
- Download datasheets for all selected components

## Next Steps

After component selection is complete:
1. Run `/eda-source` for remaining components
2. When all components selected, run `/eda-schematic`
3. Update `design-constraints.json` stage to "schematic"
