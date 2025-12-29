# Group 3: Schematic Design - COMPLETED

## Status: COMPLETE

**Completed:** 2024-12-29
**Files changed:** 8 (3 new, 5 modified)

---

## Context

This is the third group in a series of EDA skill enhancements. Groups 1 and 2 are complete.

### Completed Groups

**Group 1: Project Planning** (eda-architect, eda-new)
- Added thermal budget, stackup decision, DFM targets to constraint schema
- Created decision guides: LAYER-COUNT-DECISION.md, THERMAL-BUDGET.md, POWER-TOPOLOGY-DECISION.md
- Added validation warnings for risky design combinations

**Group 2: Component Research** (eda-research, eda-source)
- Created: REGULATOR-SELECTION.md, DECOUPLING-STRATEGY.md, PASSIVE-SELECTION.md, COMPONENT-ALTERNATIVES.md
- Added architecture-aware validation workflow
- Enhanced datasheet analysis with thermal/decoupling extraction

### Architecture Principle

**Skills capture DECISIONS and GUIDANCE, not exhaustive implementation details.**

Each skill should:
1. Reference upstream decisions (from design-constraints.json)
2. Provide actionable guidance for its phase
3. Update design-constraints.json with its outputs
4. Suggest next steps

---

## Group 3 Scope

### Files to Review

**Skill:**
- `templates/claude/skills/eda-schematics/SKILL.md`
- `templates/claude/skills/eda-schematics/reference/*` (if any)

**Agents:**
- `templates/claude/agents/schematic-organizer.md`
- `templates/claude/agents/wiring-specialist.md`

**Related commands:**
- `templates/claude/commands/eda-schematic.md` (if exists)

---

## Research Context (from Group 1 research)

### Schematic Review Best Practices

From Altium, Memfault, pcbchecklist.com:

- **Decoupling strategy** - 100nF per power pin, bulk caps near input
- **Power sequencing** - Multi-rail designs may need sequencing
- **Reset circuits** - External vs internal, RC timing
- **Crystal circuits** - Load capacitor calculation, layout sensitivity
- **ESD protection** - On all external interfaces
- **Pull-up/pull-down** - Prevent floating pins
- **Test points** - Often forgotten, add early
- **Net naming** - Consistent conventions for clarity

### Power Section Patterns

From research on power architecture:

- LDO application circuits (input cap, output cap, enable)
- Buck converter circuits (inductor, input/output caps, feedback)
- Hybrid power (buck + LDO for noise-sensitive rails)
- Battery charging circuits

### Interface Protection Patterns

- USB: ESD protection, series resistors, VBUS protection
- I2C: Pull-ups, level shifting
- SPI: Pull-ups on CS lines
- UART: Level shifting, ESD
- GPIO: Series resistors for EMI, ESD on external

---

## Suggested Enhancements

### For eda-schematics Skill

1. **Add reference documents:**
   - `SCHEMATIC-PATTERNS.md` - Common circuit patterns (reset, crystal, USB, etc.)
   - `NET-NAMING.md` - Consistent naming conventions
   - `POWER-SECTION-TEMPLATES.md` - Copy-paste power designs

2. **Add workflow sections:**
   - Check design-constraints.json for power topology, selected components
   - Hierarchical sheet organization guidance
   - Schematic review checklist before layout

3. **Add pattern library:**
   - MCU minimal circuit (decoupling, reset, crystal, programming header)
   - USB interface (connector, ESD, pull-ups)
   - Power input (connector, protection, filtering)
   - LED indicator (current limiting, placement)

### For schematic-organizer Agent

1. **Add organization patterns:**
   - Sheet hierarchy recommendations
   - Functional block separation
   - Power distribution sheet
   - Connector/interface sheet

2. **Add validation:**
   - Check all power pins have decoupling
   - Check all inputs have defined state (pull-up/down or driven)
   - Check all external interfaces have protection

### For wiring-specialist Agent

1. **Add connection patterns:**
   - Bus naming conventions
   - Power rail distribution
   - Ground connections (single point vs distributed)

2. **Add validation:**
   - Net connectivity checks
   - Unconnected pin warnings
   - Power net naming consistency

---

## Files from Previous Groups (for reference)

### Group 1 (eda-architect)
```
templates/claude/skills/eda-architect/
├── SKILL.md
└── reference/
    ├── CONSTRAINT-SCHEMA.md
    ├── PROJECT-TEMPLATES.md
    ├── LAYER-COUNT-DECISION.md
    ├── THERMAL-BUDGET.md
    └── POWER-TOPOLOGY-DECISION.md
```

### Group 2 (eda-research)
```
templates/claude/skills/eda-research/
├── SKILL.md
└── reference/
    ├── COMPONENT-CATEGORIES.md
    ├── DATASHEET-ANALYSIS.md
    ├── JLC-SEARCH-TIPS.md
    ├── REGULATOR-SELECTION.md      # NEW
    ├── DECOUPLING-STRATEGY.md      # NEW
    ├── PASSIVE-SELECTION.md        # NEW
    └── COMPONENT-ALTERNATIVES.md   # NEW
```

---

## Work Completed

### New Reference Documents (3 files)

1. **SCHEMATIC-HIERARCHY-DECISION.md** (~200 lines)
   - Decision tree for flat vs hierarchical sheets
   - Sheet count recommendations by complexity
   - Sheet organization patterns for different project types
   - Inter-sheet signal naming conventions
   - Common mistakes table
   - Integration with upstream constraints

2. **SCHEMATIC-REVIEW-CHECKLIST.md** (~280 lines)
   - Pre-ERC quick checklist
   - Detailed review sections (power, decoupling, MCU, interfaces)
   - Interface protection validation (USB, I2C, SPI, GPIO)
   - Architecture validation table
   - Pre-layout sign-off checklist
   - Common mistakes to catch

3. **ERC-VIOLATIONS-GUIDE.md** (~300 lines)
   - Quick reference table for common ERC errors
   - Detailed fix patterns for each error type
   - Systematic ERC debugging workflow
   - KiCad ERC settings guidance
   - Common ERC patterns (power connector, enable pin, reset)

### Modified Files (5 files)

4. **SKILL.md** - Added:
   - Section 1.5: Validate Readiness (pre-schematic checklist)
   - Section 8: Pre-Layout Review
   - Architecture Validation Warnings table
   - Reference Documents table
   - Explicit constraint loading from design-constraints.json

5. **REFERENCE-CIRCUITS.md** - Added:
   - "How to Use This Document" section
   - "When to use/avoid" context for key circuits (LDO, Buck, Crystal, USB-C, I2C)
   - Cross-references to DECOUPLING-STRATEGY.md
   - Layout notes for critical circuits

6. **schematic-organizer.md** - Added:
   - Context Loading section
   - Constraint-aware organization guidance
   - Enhanced Quality Checklist (visual, organization, pre-layout)
   - Sheet Hierarchy Decision table
   - Reference to SCHEMATIC-HIERARCHY-DECISION.md

7. **wiring-specialist.md** - Added:
   - Context Loading section with constraint extraction
   - Datasheet Application Workflow (4-step process)
   - Decoupling Validation table
   - Layout Anticipation section
   - Interface Protection Checklist (USB, I2C, SPI, GPIO)
   - Reference Documents section

8. **eda-schematic.md** - Added:
   - Extract Key Constraints section
   - Pre-schematic checklist (4 items)
   - Validation Gates (after each sheet, before layout)
   - Reference Documents section
   - Enhanced Next Steps with validation

---

## File Structure After Changes

```
templates/claude/skills/eda-schematics/
├── SKILL.md                                    # Updated
└── reference/
    ├── NET-NAMING.md                          # Existing
    ├── REFERENCE-CIRCUITS.md                  # Updated
    ├── SYMBOL-ORGANIZATION.md                 # Existing
    ├── SCHEMATIC-HIERARCHY-DECISION.md        # NEW
    ├── SCHEMATIC-REVIEW-CHECKLIST.md          # NEW
    └── ERC-VIOLATIONS-GUIDE.md                # NEW

templates/claude/agents/
├── schematic-organizer.md                     # Updated
└── wiring-specialist.md                       # Updated

templates/claude/commands/
└── eda-schematic.md                           # Updated
```

---

## Key Patterns Implemented

1. **Upstream Integration:** All files now explicitly reference design-constraints.json
2. **Validation Gates:** Pre-schematic checklist, per-sheet validation, pre-layout checklist
3. **Decision Guides:** SCHEMATIC-HIERARCHY-DECISION.md follows LAYER-COUNT-DECISION.md pattern
4. **Cross-References:** Files reference each other and upstream docs (DECOUPLING-STRATEGY.md)
5. **Architecture Warnings:** Condition-based warnings before proceeding to next phase

---

## Next Group: Group 4 (PCB Layout)

The next group should focus on:
- `templates/claude/skills/eda-pcb/` (if exists)
- `templates/claude/agents/pcb-placement-specialist.md`
- `templates/claude/agents/pcb-router.md`
- `templates/claude/commands/eda-layout.md`

Suggested enhancements:
1. Create reference docs: STACKUP-PATTERNS.md, ROUTING-GUIDELINES.md, DRC-VIOLATIONS-GUIDE.md
2. Add constraint validation (layer count, thermal budget from design-constraints.json)
3. Add pre-manufacturing checklist
4. Integrate with schematic review output
