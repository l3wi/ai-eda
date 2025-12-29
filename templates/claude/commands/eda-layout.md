---
description: Interactive PCB layout session
argument-hint: [phase: setup|place|route|review]
allowed-tools: Read, Write, Glob, mcp__kicad-pcb__*
---

# PCB Layout: $ARGUMENTS

Interactive PCB layout session.

## Context Loading

Read project context:
- `@docs/design-constraints.json` - Board size, layers, rules
- `@docs/component-selections.md` - Component details
- `@docs/schematic-status.md` - Schematic completion status
- `@docs/pcb-status.md` - Layout progress (if exists)
- `@datasheets/` - For placement guidelines

### Verify Readiness

Check that schematic is complete:
- If schematic not done, suggest completing it first
- Verify netlist can be generated

### Pre-Layout Checklist

**Before starting layout, verify:**

| Check | Source | Action if Missing |
|-------|--------|-------------------|
| Schematic ERC clean | schematic-status.md | Complete schematic first |
| Layer count decided | design-constraints.json | Use `LAYER-COUNT-DECISION.md` |
| Board dimensions | design-constraints.json | Define before layout |
| Component BOM complete | component-selections.md | Source components first |
| Thermal budget | design-constraints.json | Calculate if >1W power |

**Extract key constraints:**
```
Board: layers, thickness, dimensions
DFM: manufacturer, min trace, min clearance
Interfaces: USB (90Ω), SPI speed, I2C mode
Thermal: max dissipation, hotspots
```

**Architecture warnings to check:**
- USB + 2-layer → Cannot achieve impedance control
- Buck converter + 2-layer → EMI problems
- WiFi/BLE + 2-layer → Antenna performance issues

## Phases

### Phase: setup (or initial)

1. **Create/Open PCB**
   - Create PCB file if needed
   - Import netlist from schematic

2. **Board Outline**
   - Set board dimensions from constraints
   - Add board outline on Edge.Cuts
   - Add any internal cutouts

3. **Mounting Holes**
   - Place per constraint positions
   - Or suggest standard corner positions

4. **Layer Setup**
   - Configure layer count
   - Set up stackup

5. **Design Rules**
   - Configure rules for target manufacturer
   - Suggest JLCPCB defaults unless specified otherwise

### Phase: place

1. **Fixed Position Items**
   - Connectors at board edges
   - Mounting holes
   - Any constrained positions

2. **Critical Components**
   - MCU (central location)
   - Crystal (within 5mm of MCU)
   - Regulators (near input, thermal consideration)

3. **Support Components**
   - Decoupling caps near ICs
   - Pull-up resistors near their signals
   - ESD protection near connectors

4. **Remaining Components**
   - Group by function
   - Keep signal paths short
   - Leave routing channels

Ask user throughout:
- "Placing USB connector on top edge. Good location?"
- "MCU centered with pins facing outward. Acceptable?"

**Post-Placement Validation:**
- [ ] All components placed
- [ ] No courtyard overlaps
- [ ] Decoupling caps adjacent to ICs
- [ ] Crystal within 5mm of MCU
- [ ] Connectors at board edges
- [ ] Routing channels visible

### Phase: route

1. **Design Rules Check**
   - Verify rules before routing
   - Confirm trace widths for power vs signal

2. **Critical Signals First**
   - Power delivery (wide traces or pours)
   - Crystal (short, guarded)
   - USB differential (if present)
   - High-speed clocks

3. **Ground Pour**
   - Add GND pour to bottom layer (2-layer)
   - Or dedicated ground plane (4-layer)

4. **Route Remaining**
   - Work by functional group
   - Keep related signals together
   - Minimize vias

5. **DRC Check**
   - Run DRC after major routing sections
   - Fix violations before continuing

**Post-Routing Validation:**
- [ ] All nets routed (no ratsnest)
- [ ] DRC clean
- [ ] USB traces: 90Ω, length matched
- [ ] Power traces: sized for current
- [ ] Crystal area: guarded, no crossing traces
- [ ] Antenna keep-out: clear (if applicable)

### Phase: review

1. **Visual Inspection**
   - Generate board images
   - Review placement
   - Check silkscreen readability

2. **Run Full DRC**
   - All rules checked
   - Document any intentional violations

3. **Check Against Constraints**
   - Board size
   - Component positions
   - Manufacturer capabilities

4. **Update Documentation**
   - Final pcb-status.md
   - Note any concerns

## Progress Tracking

Update `docs/pcb-status.md` after each session:

```markdown
# PCB Status

Project: [name]
Updated: [date]

## Board
- Size: X × Y mm
- Layers: N
- Status: [setup|placing|routing|review|complete]

## Progress
- [x] Board outline
- [x] Mounting holes
- [x] Critical placement
- [ ] All placement
- [ ] Power routing
- [ ] Signal routing
- [ ] Ground pour
- [ ] DRC clean

## DRC
- Errors: X
- Warnings: Y
- Unrouted: Z nets

## Notes
[Any issues or decisions]
```

## Interactive Elements

Throughout the session:
- Explain placement/routing decisions
- Reference datasheet recommendations
- Ask for confirmation on trade-offs
- Show DRC status periodically

## Next Steps

When layout complete:
- Run `/eda-check pcb` for validation
- Then `/eda-check full` for comprehensive review
- Update stage to "validation"

If partially complete:
- Note where to resume
- List remaining work

## Reference Documents

| Document | Phase | Use For |
|----------|-------|---------|
| `STACKUP-DECISION.md` | setup | Layer arrangement |
| `PLACEMENT-STRATEGY.md` | place | Component positioning |
| `HIGH-SPEED-ROUTING.md` | route | USB, SPI, crystal, antenna |
| `ROUTING-RULES.md` | route | Trace widths, clearances |
| `DRC-VIOLATIONS-GUIDE.md` | route, review | Fixing DRC errors |
| `DFM-RULES.md` | review | Manufacturing validation |
