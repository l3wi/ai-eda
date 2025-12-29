---
description: Run design validation checks
argument-hint: [scope: schematic|pcb|components|manufacturing|full]
allowed-tools: Read, Write, Glob, WebSearch, mcp__kicad-pcb__run_drc, mcp__kicad-pcb__get_drc_violations, mcp__kicad-pcb__get_design_rules, mcp__kicad-pcb__get_board_info, mcp__lcsc__*
---

# Design Validation: $ARGUMENTS

Run validation checks for scope: **$ARGUMENTS**

## Context Loading

Read project context:
- `@docs/design-constraints.json`
- `@docs/component-selections.md`
- `@docs/schematic-status.md`
- `@docs/pcb-status.md`

## New Project Detection

If this is a new project (no schematic, empty constraints):
- Report that the project needs setup first
- Direct user to run `/eda-new` to define project requirements
- Do NOT suggest commands that don't exist (like `/eda-spec`)

Available commands are: `/eda-new`, `/eda-source`, `/eda-schematic`, `/eda-layout`, `/eda-check`, `/eda-export`

## Validation Scopes

### schematic
- Run ERC (Electrical Rules Check)
- Verify all power pins connected
- Check decoupling capacitors present
- Validate against datasheet requirements
- Check for unconnected pins

### pcb
- Run DRC (Design Rules Check)
- Verify placement guidelines met
- Check routing rules
- Validate copper pours
- Review silkscreen placement

### components
- Check LCSC stock availability
- Get current pricing
- Identify any lifecycle warnings (NRND, obsolete)
- Flag components with low stock

### manufacturing
- Verify against target manufacturer specs
- Check board size limits
- Validate minimum features (trace, space, via)
- Verify BOM completeness
- Check position file accuracy

### full
- Run ALL above checks
- Generate comprehensive report
- Provide sign-off status

## Output

Generate `docs/validation-report.md`:

```markdown
# Validation Report

Project: [name]
Scope: $ARGUMENTS
Generated: [timestamp]

## Summary

| Check | Status | Issues |
|-------|--------|--------|
| [Check name] | PASS/FAIL | Count |
| ... | ... | ... |
| **Overall** | **PASS/FAIL** | |

## Critical Issues
Must fix before manufacturing:
1. [Issue] - [Location] - [Suggested fix]

## Warnings
Should review:
1. [Warning] - [Location] - [Recommendation]

## Notes
For information:
1. [Note]

---

## Detailed Results

[Detailed breakdown per scope]

---

## Action Items

### Required
- [ ] [Must do]

### Recommended
- [ ] [Should do]

---

## Sign-off

- [ ] All critical issues resolved
- [ ] Design review complete
- [ ] Ready for manufacturing
```

## Interactive Feedback

During validation:
- Report progress: "Running DRC... found 3 issues"
- Explain each issue found
- Suggest fixes where possible
- Ask if user wants to fix issues now or continue

## Next Steps

If all checks pass:
- Suggest `/eda-export [manufacturer]` to generate files
- Update stage to "complete"

If issues found:
- Prioritize by severity
- Offer to help fix critical issues
- Re-run validation after fixes
