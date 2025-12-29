---
description: Interactive schematic creation session
argument-hint: [sheet-name or 'start']
allowed-tools: Read, Write, Glob, mcp__kicad-sch__create_schematic, mcp__kicad-sch__add_component, mcp__kicad-sch__search_components, mcp__kicad-sch__add_wire, mcp__kicad-sch__add_hierarchical_sheet, mcp__kicad-sch__add_sheet_pin, mcp__kicad-sch__add_hierarchical_label, mcp__kicad-sch__list_components, mcp__kicad-sch__get_schematic_info
---

# Schematic Creation: $ARGUMENTS

Interactive schematic capture session.

## Tool Reference (kicad-sch MCP)

### Create Schematic
```
mcp__kicad-sch__create_schematic path="/path/to/project.kicad_sch"
```

### Search Components
```
mcp__kicad-sch__search_components query="resistor" library="Device"
```

### Add Component
```
mcp__kicad-sch__add_component schematic_path="/path/to/project.kicad_sch" lib_id="Device:R" reference="R1" value="10k" position=[100, 100]
```
- `schematic_path`: Full path to .kicad_sch file
- `lib_id`: Library:SymbolName (e.g., `Device:R`, `EDA-MCP:ESP32-C3`)
- `reference`: Reference designator (e.g., `R1`, `U1`)
- `value`: Component value
- `position`: [x, y] coordinates (grid-aligned, 1.27mm grid)

### Add Wire
```
mcp__kicad-sch__add_wire schematic_path="/path/to/project.kicad_sch" start=[100, 100] end=[150, 100]
```

### Add Hierarchical Label
```
mcp__kicad-sch__add_hierarchical_label schematic_path="/path/to/project.kicad_sch" name="VCC_3V3" position=[50, 100]
```

### List Components
```
mcp__kicad-sch__list_components schematic_path="/path/to/project.kicad_sch"
```

### Get Schematic Info
```
mcp__kicad-sch__get_schematic_info schematic_path="/path/to/project.kicad_sch"
```

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
