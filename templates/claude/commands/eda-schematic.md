---
description: Interactive schematic creation session
argument-hint: [sheet-name or 'start']
allowed-tools: Read, Write, Glob, mcp__kicad__create_schematic, mcp__kicad__add_schematic_component, mcp__kicad__add_wire, mcp__kicad__add_schematic_connection, mcp__kicad__add_schematic_net_label, mcp__kicad__connect_to_net, mcp__kicad__generate_netlist
---

# Schematic Creation: $ARGUMENTS

Interactive schematic capture session.

## Context Loading

Read project context:
- `@docs/design-constraints.json` - Project constraints
- `@docs/component-selections.md` - Selected components
- `@docs/schematic-status.md` - Current progress (if exists)
- `@datasheets/` - Reference circuits from datasheets

### Verify Readiness

Check that components have been selected:
- If `component-selections.md` missing or incomplete:
  - List what's missing
  - Suggest running `/eda-source [role]` first

## Interactive Workflow

### If $ARGUMENTS is 'start':

1. **Plan Sheet Organization**

   Based on complexity, propose sheet structure:
   - Simple (1-2 sheets): Power + Everything else
   - Medium (3-4 sheets): Power, MCU, Interfaces, I/O
   - Complex (5+ sheets): One per major function

   Ask user to confirm or modify structure.

2. **Create Project Structure**
   - Create KiCad project if needed
   - Set up schematic file(s)
   - Configure page sizes

3. **Start with Power Sheet**
   - Usually the first sheet to complete
   - Sets up voltage rails for other sheets

### If $ARGUMENTS is a sheet name:

Work on the specified sheet.

## Sheet Workflow

For each sheet:

### 1. Review Requirements
- What components go on this sheet?
- What reference circuits apply?
- What nets connect to other sheets?

### 2. Place Components
For each component:
- Place symbol
- Set reference designator
- Set value
- Add LCSC part number

Ask user about placement preferences:
- "I'll place the MCU in the center. Any specific orientation preference?"

### 3. Add Power Connections
- Place power symbols (VCC_3V3, GND, etc.)
- Connect power pins
- Add decoupling capacitors near ICs

### 4. Wire Signals
Work through connections logically:
- Start with datasheet reference circuits
- Use net labels for inter-sheet connections
- Ask about any ambiguous connections

### 5. Verify
- List unconnected pins
- Ask about intentional no-connects
- Check against datasheet

## Progress Tracking

Update `docs/schematic-status.md` after each session:

```markdown
# Schematic Status

Project: [name]
Updated: [date]

## Sheets

### Power
- Status: Complete
- Components: [list]
- Notes: [any notes]

### MCU
- Status: In Progress
- Components: [list]
- Remaining: [what's left]

## Next Session
- [What to work on next]
```

## Interactive Elements

Throughout the session:
- Show what you're doing: "Adding U1 (STM32G030) to the MCU sheet..."
- Ask for confirmation on non-obvious choices
- Explain any deviations from typical patterns
- Reference datasheets when making connections

## Next Steps

When schematic is complete:
- Generate netlist
- Run ERC check
- Suggest `/eda-layout` for PCB layout
- Update stage to "pcb"

If partially complete:
- Note where to resume
- Update schematic-status.md
