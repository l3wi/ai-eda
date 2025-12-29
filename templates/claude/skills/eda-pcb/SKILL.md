---
name: eda-pcb
description: PCB layout and routing. Component placement, trace routing, copper pours, design rule configuration, and layout optimization for manufacturability.
allowed-tools: Read, Write, Glob, mcp__kicad__create_project, mcp__kicad__open_project, mcp__kicad__save_project, mcp__kicad__get_project_info, mcp__kicad__set_board_size, mcp__kicad__add_layer, mcp__kicad__set_active_layer, mcp__kicad__get_board_info, mcp__kicad__get_layer_list, mcp__kicad__add_board_outline, mcp__kicad__add_mounting_hole, mcp__kicad__add_board_text, mcp__kicad__add_zone, mcp__kicad__get_board_extents, mcp__kicad__get_board_2d_view, mcp__kicad__place_component, mcp__kicad__move_component, mcp__kicad__rotate_component, mcp__kicad__delete_component, mcp__kicad__edit_component, mcp__kicad__find_component, mcp__kicad__get_component_properties, mcp__kicad__group_components, mcp__kicad__add_net, mcp__kicad__route_trace, mcp__kicad__add_via, mcp__kicad__add_copper_pour, mcp__kicad__set_design_rules, mcp__kicad__get_design_rules, mcp__kicad__run_drc
---

# EDA PCB Skill

PCB layout, component placement, and routing.

## Auto-Activation Triggers

This skill activates when:
- User asks to "layout PCB", "place components", "route traces"
- User is working with `.kicad_pcb` files
- User asks about placement, routing, copper pours, vias
- Project has schematic but no PCB layout
- User mentions DFM, trace width, or clearance

## Context Requirements

**Requires:**
- `hardware/*.kicad_sch` - Completed schematic with netlist
- `docs/component-selections.md` - Component details
- `docs/design-constraints.json` - Board size, layer count, etc.
- `datasheets/` - For placement/routing recommendations

**Produces:**
- `hardware/*.kicad_pcb` - KiCad PCB file
- `docs/pcb-status.md` - Layout progress tracking

## Workflow

### 1. Load Context
```
@docs/design-constraints.json
@docs/component-selections.md
@docs/schematic-status.md
@datasheets/ (for placement guidance)
```

### 2. Initialize PCB
1. Create PCB file or open existing
2. Import netlist from schematic
3. Set board outline per constraints
4. Configure layer stackup
5. Set design rules

### 3. Configure Design Rules
Set rules appropriate for manufacturer:

```
JLCPCB standard:
- Min trace width: 0.127mm (5mil)
- Min clearance: 0.127mm (5mil)
- Min via drill: 0.3mm
- Min via annular ring: 0.13mm
```

### 4. Place Components

**Priority order:**
1. **Fixed position items** - Connectors (edge), mounting holes
2. **MCU/Main IC** - Central location
3. **Crystal/oscillator** - Within 5mm of MCU
4. **Power components** - Near input, thermal considerations
5. **Decoupling capacitors** - Adjacent to IC power pins
6. **Sensitive analog** - Away from noisy digital
7. **Remaining components** - Grouped by function

See `reference/PLACEMENT-STRATEGY.md` for detailed guidelines.

### 5. Route Critical Signals First

**Priority:**
1. Power delivery (wide traces, pours)
2. Crystal/oscillator (short, guarded)
3. USB differential pairs (90Ω impedance)
4. High-speed signals (length matching)
5. Sensitive analog (away from digital)
6. General signals

See `reference/ROUTING-RULES.md` for trace width and clearance guidelines.

### 6. Create Copper Pours
- GND pour on bottom layer (2-layer)
- Or GND on layer 2, power on layer 3 (4-layer)
- Thermal relief on pads
- Stitch vias for plane continuity

### 7. Route Remaining Signals
- Follow schematic groupings
- Minimize vias
- Avoid acute angles (use 45°)
- Keep trace lengths reasonable

### 8. DRC Check
- Run design rule check
- Fix violations
- Document intentional exceptions

### 9. Visual Review
- Generate board images
- Check silkscreen readability
- Verify component orientation marks
- Review for manufacturing issues

## Output Format

### pcb-status.md

```markdown
# PCB Layout Status

Project: [name]
Updated: [date]

## Board Specifications
- Size: X × Y mm
- Layers: N
- Thickness: 1.6mm

## Progress
- [x] Board outline defined
- [x] Mounting holes placed
- [x] Critical components placed
- [x] All components placed
- [ ] Power routing complete
- [ ] Signal routing complete
- [ ] Copper pours added
- [ ] DRC clean

## Layer Usage
| Layer | Usage |
|-------|-------|
| F.Cu | Signals, components |
| B.Cu | GND pour, some signals |

## DRC Status
- Errors: X
- Warnings: Y
- Unrouted nets: Z

## Design Rules
- Trace width: 0.2mm (signals), 0.5mm (power)
- Clearance: 0.2mm
- Via: 0.3mm drill, 0.6mm pad

## Notes
- [Any special considerations]

## Next Steps
- [What remains to be done]
```

## Guidelines

- Always check datasheets for recommended layouts
- Keep high-current paths short and wide
- Maintain ground plane integrity under sensitive signals
- Consider thermal management early
- Use the DRC frequently during layout

## Reference Documents

- `reference/PLACEMENT-STRATEGY.md` - Component placement guidelines
- `reference/ROUTING-RULES.md` - Trace width and routing rules
- `reference/EMI-CONSIDERATIONS.md` - EMI/EMC best practices
- `reference/DFM-RULES.md` - Design for manufacturing rules

## Next Steps

After PCB layout is complete:
1. Run `/eda-check` for comprehensive validation
2. Update `design-constraints.json` stage to "validation"
