# Group 4: PCB Layout - COMPLETED

## Status: COMPLETE

**Completed:** 2024-12-30
**Files changed:** 7 (3 new, 4 modified)

---

## Context

This is the fourth group in a series of EDA skill enhancements. Groups 1-3 are complete.

### Completed Groups

**Group 1: Project Planning** (eda-architect, eda-new)
- Added thermal budget, stackup decision, DFM targets to constraint schema
- Created decision guides: LAYER-COUNT-DECISION.md, THERMAL-BUDGET.md, POWER-TOPOLOGY-DECISION.md
- Added validation warnings for risky design combinations

**Group 2: Component Research** (eda-research, eda-source)
- Created: REGULATOR-SELECTION.md, DECOUPLING-STRATEGY.md, PASSIVE-SELECTION.md, COMPONENT-ALTERNATIVES.md
- Added architecture-aware validation workflow
- Enhanced datasheet analysis with thermal/decoupling extraction

**Group 3: Schematic Design** (eda-schematics, schematic agents)
- Created: SCHEMATIC-HIERARCHY-DECISION.md, SCHEMATIC-REVIEW-CHECKLIST.md, ERC-VIOLATIONS-GUIDE.md
- Added pre-schematic checklist and pre-layout validation
- Enhanced agents with context loading and datasheet application workflow

### Architecture Principle

**Skills capture DECISIONS and GUIDANCE, not exhaustive implementation details.**

Each skill should:
1. Reference upstream decisions (from design-constraints.json)
2. Provide actionable guidance for its phase
3. Update design-constraints.json with its outputs
4. Suggest next steps

---

## Group 4 Scope

### Files Reviewed

**Skill:**
- `templates/claude/skills/eda-pcb/SKILL.md`
- `templates/claude/skills/eda-pcb/reference/*`

**Agents:**
- `templates/claude/agents/pcb-placement.md`
- `templates/claude/agents/pcb-router.md`

**Command:**
- `templates/claude/commands/eda-layout.md`

### Research Sources

1. **Toradex Layout Design Guide** (41 pages)
   - Stack-up patterns (4/6/8 layer)
   - Trace impedance calculations
   - Interface-specific requirements

2. **JLCPCB Capabilities Research:**
   - Min trace width/spacing: 4/4 mil (1oz), 3.5/3.5 mil (multilayer)
   - Min via hole: 0.2mm (multilayer), 0.3mm (2-layer)
   - Min annular ring: 0.13mm (1oz), 0.2mm (2oz)

3. **ESP32/STM32 Focus:**
   - USB 2.0 (90Ω differential)
   - SPI at high speeds
   - I2C pull-up placement
   - Crystal/oscillator layout
   - WiFi/BLE antenna considerations

---

## Work Completed

### New Reference Documents (3 files)

1. **DRC-VIOLATIONS-GUIDE.md** (~490 lines)
   - Quick reference table for 7 common DRC errors
   - 10 detailed error categories with causes and solutions
   - Systematic DRC debugging workflow
   - KiCad DRC settings and net classes
   - Common patterns with ASCII diagrams
   - Integration with design-constraints.json

2. **STACKUP-DECISION.md** (~280 lines)
   - Decision tree for stackup selection
   - 2-layer, 4-layer (standard and dual ground), 6-layer options
   - JLCPCB actual stackup dimensions
   - Impedance reference for USB and single-ended
   - Power plane splitting rules
   - Selection matrix for interfaces vs stackup

3. **HIGH-SPEED-ROUTING.md** (~450 lines)
   - Interface-specific routing requirements
   - USB 2.0 detailed guidelines (90Ω, length match, layout)
   - SPI at high speeds (clock priority, length matching)
   - I2C pull-up selection and placement
   - SD Card interface routing
   - WiFi/BLE antenna keep-out and feed line
   - Crystal/oscillator layout with guard ring
   - ADC input isolation
   - Return path planning
   - "When NOT to worry" section

### Modified Files (4 files)

4. **SKILL.md** - Added:
   - Section 1.5: Pre-Layout Validation with checklist
   - Architecture Validation Warnings table
   - Section 10: Pre-Manufacturing Review
   - Thermal and signal integrity verification checklists
   - Updated Reference Documents table with upstream docs

5. **pcb-placement.md** agent - Added:
   - Context Loading section with constraint extraction
   - Parameter impact table
   - Pre-placing validation checklist
   - Thermal verification section
   - Pre-routing verification checklist
   - Reference Documents table

6. **pcb-router.md** agent - Added:
   - Context Loading section with routing requirements
   - Interface-Aware Routing priority table
   - Return path verification checklist
   - Post-Routing Verification (before/after copper pour)
   - Reference Documents table

7. **eda-layout.md** command - Added:
   - Pre-Layout Checklist with constraint extraction
   - Architecture warnings section
   - Post-Placement Validation checklist
   - Post-Routing Validation checklist
   - Reference Documents table by phase

---

## File Structure After Changes

```
templates/claude/skills/eda-pcb/
├── SKILL.md                                    # Updated
└── reference/
    ├── PLACEMENT-STRATEGY.md                  # Existing
    ├── ROUTING-RULES.md                       # Existing
    ├── EMI-CONSIDERATIONS.md                  # Existing
    ├── DFM-RULES.md                           # Existing
    ├── DRC-VIOLATIONS-GUIDE.md                # NEW
    ├── STACKUP-DECISION.md                    # NEW
    └── HIGH-SPEED-ROUTING.md                  # NEW

templates/claude/agents/
├── pcb-placement.md                           # Updated
└── pcb-router.md                              # Updated

templates/claude/commands/
└── eda-layout.md                              # Updated
```

---

## Key Patterns Implemented

1. **Upstream Integration:** All files now reference design-constraints.json
2. **Validation Gates:** Pre-layout checklist, post-placement validation, post-routing validation, pre-manufacturing review
3. **Decision Guides:** STACKUP-DECISION.md follows LAYER-COUNT-DECISION.md pattern
4. **Cross-References:** Files reference each other and upstream docs (DECOUPLING-STRATEGY.md, ERC-VIOLATIONS-GUIDE.md)
5. **Architecture Warnings:** Condition-based warnings (USB+2-layer, buck+2-layer)
6. **Interface Focus:** Practical ESP32/STM32 interfaces (USB, SPI, I2C, antenna)

---

## Integration with Upstream Groups

| Group | Key Output | Used By PCB Layout |
|-------|------------|-------------------|
| Group 1 | LAYER-COUNT-DECISION.md | Layer count validation |
| Group 1 | THERMAL-BUDGET.md | Thermal planning |
| Group 2 | DECOUPLING-STRATEGY.md | Cap placement |
| Group 3 | SCHEMATIC-REVIEW-CHECKLIST.md | Pre-layout verification |
| Group 3 | ERC-VIOLATIONS-GUIDE.md | Pattern for DRC guide |

---

## Next Steps: Group 5 (Manufacturing Prep)

The next group could focus on:
- `templates/claude/agents/manufacturing-prep.md`
- `templates/claude/commands/eda-export.md` (if exists)
- Gerber generation workflow
- BOM/CPL formatting for JLCPCB
- Panelization guidance
- Order checklist

Suggested enhancements:
1. Create GERBER-CHECKLIST.md reference document
2. Create JLCPCB-ORDER-GUIDE.md with file requirements
3. Add manufacturing validation workflow
4. Integrate with design-constraints.json for DFM targets
