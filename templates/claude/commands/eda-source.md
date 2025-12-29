---
description: Interactive component sourcing session
argument-hint: [component-role]
allowed-tools: Read, Write, Glob, WebFetch, WebSearch, mcp__lcsc__*
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
mcp__lcsc__component_search("<search terms>")
mcp__lcsc__get_component_details("<lcsc_part_number>")
```

**Do NOT use WebSearch for finding components** - the LCSC MCP has real-time stock, pricing, and specifications.

Focus on:
- In-stock components
- JLCPCB Basic parts (when suitable)
- Good price at target quantity

### 3. Supplementary Research (only if needed)

Only use WebSearch/WebFetch if:
- Need application circuit from datasheet
- Looking for reference designs
- LCSC has no suitable options (rare)

### 4. Present Options

Show a comparison table with 3-5 options:

| Option | MPN | Key Specs | Price | Stock | Notes |
|--------|-----|-----------|-------|-------|-------|
| 1 (Rec)| ... | ... | $X.XX | #### | Why recommended |
| 2 | ... | ... | $X.XX | #### | Alternative reason |
| 3 | ... | ... | $X.XX | #### | Budget option |

Include:
- LCSC part number
- Key specifications relevant to the role
- Price at target quantity
- Stock status
- Pros and cons

### 5. Get Selection

Ask user to choose or request more options.

Once selected:
- Confirm the choice
- Download/note datasheet location
- Document any design notes from datasheet

## Output

Update these files:

### docs/component-selections.md

Add entry:
```markdown
### [Role]: [Part Name] ([LCSC#])

**Selected:** [Date]
**MPN:** [Manufacturer Part Number]
**Price:** $X.XX @ [qty]

**Specifications:**
- Key spec 1
- Key spec 2

**Rationale:** [Why chosen]

**Design Notes:** [From datasheet - layout, decoupling, etc.]

**Datasheet:** datasheets/[filename].pdf
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
