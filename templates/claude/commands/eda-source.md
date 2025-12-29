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

### 2. Research

Use web search to understand:
- Common solutions for this application
- Recommended parts from reference designs
- Known issues or gotchas

### 3. Search LCSC

Use LCSC MCP tools to find candidates:
```
mcp__lcsc__component_search("<search terms>")
```

Focus on:
- In-stock components
- JLCPCB Basic parts (when suitable)
- Good price at target quantity

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
