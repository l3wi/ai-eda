---
description: Route traces on PCB
argument-hint: [routing-priority]
allowed-tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__routing_*, mcp__kicad__analysis_*
---

# PCB Routing Wizard

Route PCB with priority: **$ARGUMENTS**

Priorities: `power-first`, `signal-first`, `critical-first`

## Context

@docs/design-constraints.json
@docs/pcb-status.md
@datasheets/ (for routing recommendations)

## Your Task

### 1. Set Up Design Rules
Configure for:
- Trace widths (signal, power)
- Clearances
- Via sizes
- Differential pair rules if needed

### 2. Route Critical Signals First

Priority signals:
1. **Power delivery** - Wide traces, copper pours
2. **Crystal/oscillator** - Short, guarded
3. **USB differential** - 90Ω impedance
4. **High-speed signals** - Length matching if needed
5. **Sensitive analog** - Away from digital

### 3. Create Power Planes/Pours
- GND pour on bottom layer (2-layer) or inner layer (4-layer)
- Power distribution strategy
- Thermal relief for pads

### 4. Route Signal Traces
- Follow schematic groupings
- Minimize vias
- Avoid acute angles
- Cross power planes perpendicularly if needed

### 5. Route Remaining Connections
- Check ratsnest for unrouted
- Route remaining signals
- Optimize paths

### 6. DRC Check
- Run design rule check
- Fix any violations
- Document any intentional violations

## Output

1. Routed PCB
2. Screenshots: `docs/pcb-routed-top.png`, `docs/pcb-routed-bottom.png`
3. Update `docs/pcb-status.md`:
   - Routing complete status
   - DRC results
   - Any manual attention needed

## Routing Guidelines

```
Signal traces:   0.2mm-0.3mm (8-12mil)
Power traces:    0.5mm+ depending on current
Ground:          Pour or 0.5mm+ traces
USB:             Differential pair, 90Ω
Clearance:       0.2mm minimum (8mil)
Via drill:       0.3mm standard
Via pad:         0.6mm standard
```

After routing, recommend `/eda-validate` for final check.
