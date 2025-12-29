# EDA Skills Enhancement - Research Context

This document captures research findings from enhancing the eda-architect skill, organized for use by subsequent agents reviewing other skill groups.

## Skill Groups Overview

| Group | Skills/Commands | Status |
|-------|-----------------|--------|
| 1. Project Planning | eda-architect, eda-new | **COMPLETED** |
| 2. Component Research | eda-research, eda-source | Pending |
| 3. Schematic Design | eda-schematics, schematic-organizer, wiring-specialist | Pending |
| 4. PCB Layout | eda-pcb, pcb-placement, pcb-router | Pending |
| 5. Validation & Export | eda-drc, drc-validator, manufacturing-prep, eda-check, eda-export | Pending |

---

## Research Sources Summary

### 1. PCB Stackup & Signal Integrity

**Sources:** Cadence, Altium, JLCPCB documentation

**Key findings:**
- 4-layer minimum for boards with MCUs or switching regulators
- Signal layers should be adjacent to ground planes for return paths
- Power planes close to ground for decoupling capacitance
- Standard 4-layer stackup: SIG/GND/PWR/SIG
- Material selection (Dk, Df) matters for high-speed designs
- USB 2.0 requires 90Ω differential impedance control
- Ground plane continuity is critical - avoid splits

**Applicable to:** eda-pcb, pcb-router

---

### 2. Thermal Management

**Sources:** TI Application Notes, ROHM, Cadence

**Key findings:**
- Rule of thumb: 1W per sq inch of 2oz copper = 100°C rise
- Copper pour area has diminishing returns beyond certain size
- Thermal vias: ~100°C/W each, need 10+ in parallel for effectiveness
- Place copper on layers closest to heat source
- Thermal relief needed for hand soldering
- Components >0.5W need dedicated thermal attention
- >2W total requires explicit thermal planning

**Applicable to:** eda-pcb (placement near thermal features), pcb-placement (hot component spacing)

---

### 3. Power Architecture (LDO vs Buck)

**Sources:** Richtek, Analog Devices, TI

**Key findings:**
- LDO efficiency = Vout/Vin (e.g., 5V→3.3V = 66%)
- Rule: If LDO dissipation > 0.8W, consider buck converter
- Buck typical efficiency: 80-92%
- Hybrid approach common: Buck for bulk conversion, LDO for noise-sensitive rails
- Light-load efficiency matters for battery applications
- Common architectures:
  - USB 5V → LDO → 3.3V (simple, <300mA)
  - 12V → Buck → 5V → LDO → 3.3V (hybrid for analog)
  - LiPo → Buck/Boost → 3.3V (battery full range)

**Applicable to:** eda-research (component selection criteria), eda-schematics (power section design)

---

### 4. DFM Guidelines

**Sources:** JLCPCB, PCBWay capabilities documentation

**Key findings:**
- Minimum trace/space varies by manufacturer (typically 0.1mm for standard)
- Via sizes: 0.3mm drill minimum for standard process
- Fine-pitch (<0.5mm) components difficult for hand assembly
- Panel size affects cost
- Component availability at manufacturer matters for turnkey
- Thermal reliefs needed for hand soldering
- Standard components reduce supply chain risk

**Applicable to:** eda-drc, drc-validator, manufacturing-prep

---

### 5. Schematic Review Checklists

**Sources:** Altium, Memfault, pcbchecklist.com

**Key findings:**
- Decoupling capacitor placement strategy (100nF per power pin, bulk caps)
- Power sequencing requirements for multi-rail designs
- Reset circuit requirements (external vs internal)
- Crystal/oscillator load capacitor calculations
- ESD protection on external interfaces
- Pull-up/pull-down resistors on floating pins
- Test point planning (often forgotten)
- Net naming conventions for clarity

**Applicable to:** eda-schematics, schematic-organizer, wiring-specialist

---

### 6. PCB Layout Best Practices

**Sources:** Reddit r/PrintedCircuitBoard, KiCad forums, Altium

**Key findings:**
- Component placement order: connectors → power → MCU → peripherals
- Keep high-frequency loops small (especially switching regulators)
- Current sense resistors: Kelvin connection for accuracy
- Analog/digital separation (but single ground plane, not split)
- Guard rings for sensitive analog inputs
- Ground stitching vias around RF sections
- Antenna keep-out zones
- USB differential pair routing rules (length matching, spacing)

**Applicable to:** eda-pcb, pcb-placement, pcb-router

---

### 7. Design Review Patterns

**Sources:** Memfault embedded checklist, various engineering blogs

**Key findings:**
- Firmware engineers need GPIO mapping documentation
- Bus recovery planning (I2C stuck bus, SPI CS handling)
- Schematic review should happen before layout
- Document design decisions and rationale
- Power budget spreadsheet recommended
- BOM review for availability and alternatives

**Applicable to:** eda-drc, eda-check

---

## Suggested Enhancements by Skill Group

### Group 2: Component Research (eda-research, eda-source)

**Potential additions:**
- Power component selection criteria (LDO vs Buck decision from architecture)
- Decoupling capacitor selection guide (value, package, quantity)
- Crystal/oscillator selection (load capacitance, ESR)
- ESD protection device selection (TVS, ESD diodes)
- Connector selection guide (current rating, mating cycles)
- Alternative component identification for supply chain

**Reference docs to create:**
- `DECOUPLING-STRATEGY.md` - Capacitor selection and quantity
- `COMPONENT-ALTERNATIVES.md` - How to find drop-in replacements

---

### Group 3: Schematic Design (eda-schematics, schematic-organizer, wiring-specialist)

**Potential additions:**
- Power section templates (LDO, buck, battery charging)
- Decoupling placement rules per component type
- Reset circuit patterns
- Crystal circuit patterns
- Interface protection patterns (USB, Ethernet, GPIO)
- Net naming conventions
- Hierarchical sheet organization

**Reference docs to create:**
- `SCHEMATIC-PATTERNS.md` - Common circuit patterns
- `NET-NAMING.md` - Consistent naming conventions
- `POWER-SECTION-TEMPLATES.md` - Copy-paste power designs

---

### Group 4: PCB Layout (eda-pcb, pcb-placement, pcb-router)

**Potential additions:**
- Placement priority order
- Thermal via patterns for exposed pads
- Differential pair routing rules
- Power plane design (splits vs pours)
- Ground stitching patterns
- Component spacing for thermal/rework
- Silkscreen guidelines

**Reference docs to create:**
- `PLACEMENT-ORDER.md` - Component placement strategy
- `THERMAL-VIA-PATTERNS.md` - Via arrays for heat dissipation
- `ROUTING-RULES.md` - Trace width, spacing, impedance
- `GROUND-PLANE-DESIGN.md` - When to pour vs plane

---

### Group 5: Validation & Export (eda-drc, drc-validator, manufacturing-prep, eda-check, eda-export)

**Potential additions:**
- DRC rule sets per manufacturer (JLCPCB, PCBWay, OSHPark)
- Thermal analysis checklist
- Power budget verification
- BOM validation (availability, alternatives)
- Gerber review checklist
- Assembly drawing requirements
- Pick-and-place file verification

**Reference docs to create:**
- `DRC-RULE-SETS.md` - Manufacturer-specific rules
- `PRE-PRODUCTION-CHECKLIST.md` - Final checks before order
- `GERBER-REVIEW.md` - What to verify in output files

---

## Architecture Principle

**Key principle established:** Skills capture DECISIONS and provide GUIDANCE, not exhaustive implementation details.

| Phase | Captures | Avoids |
|-------|----------|--------|
| Architecture | Layer count decision, thermal strategy, power topology | Specific trace widths, via counts |
| Research | Selection criteria, key parameters | Full datasheets |
| Schematic | Patterns, connections, net names | Component values (from research) |
| PCB | Placement strategy, routing priorities | Exact coordinates |
| Validation | Rule sets, checklists | Auto-generated reports |

Each skill should:
1. Reference upstream decisions (from design-constraints.json)
2. Provide actionable guidance for its phase
3. Update design-constraints.json with its outputs
4. Suggest next steps

---

## Files Modified in Phase 1 (eda-architect)

### Created
- `reference/LAYER-COUNT-DECISION.md` - 2/4/6 layer selection
- `reference/THERMAL-BUDGET.md` - Power estimation guide
- `reference/POWER-TOPOLOGY-DECISION.md` - LDO vs Buck decision

### Updated
- `reference/CONSTRAINT-SCHEMA.md` - Added stackupDecision, thermal, dfmTargets
- `reference/PROJECT-TEMPLATES.md` - Added 3 new templates (RF, Motor, Mixed-Signal), architecture fields to all
- `SKILL.md` - Added thermal, stackup sections, validation warnings
- `commands/eda-new.md` - Added complexity, thermal, DFM questions

### Deleted
- `reference/EMC-RISK-ASSESSMENT.md` - Removed per user request (no FCC/CE content)

---

## Next Steps

1. Review Group 2 (Component Research) skills
2. Apply relevant research findings
3. Create reference docs as needed
4. Maintain the architecture principle: decisions and guidance, not implementation details
