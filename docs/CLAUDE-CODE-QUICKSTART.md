# @ai-eda Quick Start for Claude Code

## How to Use This Plan

This document provides instructions for Claude Code to implement the @ai-eda monorepo.

## Initial Setup

Start by creating the monorepo structure:

```bash
mkdir ai-eda && cd ai-eda
bun init -y
```

Then read `ai-eda-implementation-plan.md` and follow the phases in order.

## Implementation Phases

### Phase 1: Monorepo Setup
```
/read ai-eda-implementation-plan.md

Create the monorepo structure as specified in Phase 1.
- Set up Bun workspaces
- Configure TypeScript
- Set up the packages/ directory structure
```

### Phase 2: @ai-eda/common
```
Implement the common package with shared types and utilities.
Focus on types/component.ts, types/kicad.ts, types/easyeda.ts first.
```

### Phase 3: @ai-eda/kicad-mcp
```
Fork https://github.com/mixelpixx/KiCAD-MCP-Server
Convert to TypeScript if needed
Add the additional tools specified in the plan
```

### Phase 4: @ai-eda/lcsc-mcp
```
Reference https://github.com/uPesy/easyeda2kicad.py for conversion logic
Implement LCSC and EasyEDA API clients
Build the converter for symbols and footprints
```

### Phase 5: @ai-eda/toolkit
```
Create the CLI with init, update, doctor commands
Copy all template files from the plan
```

### Phase 6-9: Templates
```
Create all slash commands in templates/claude/commands/
Create all agents in templates/claude/agents/
Create skill files in templates/claude/skills/
Create project templates (.mcp.json, CLAUDE.md, etc.)
```

## Key Files to Create First

1. `package.json` (root workspace config)
2. `packages/common/src/types/index.ts`
3. `packages/lcsc-mcp/src/api/lcsc.ts`
4. `packages/lcsc-mcp/src/api/easyeda.ts`
5. `packages/lcsc-mcp/src/converter/symbol.ts`
6. `packages/lcsc-mcp/src/converter/footprint.ts`

## Testing Strategy

Test with real LCSC components:
- C2040 (STM32F103C8T6)
- C14663 (AMS1117-3.3)
- C7171 (ESP-WROOM-32)

## Commands to Remember

```bash
# Build all packages
bun run build

# Run specific package
bun run --filter @ai-eda/lcsc-mcp dev

# Test MCP server locally
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | bun packages/lcsc-mcp/src/index.ts

# Publish
bun run publish-all
```

## Questions to Ask User

If anything is unclear:
1. LCSC API authentication - does it need an API key?
2. Preferred testing framework (Bun test, Vitest)?
3. Any specific components to use as test cases?
4. Preferred error handling patterns?

## Success Criteria

The implementation is complete when:
1. `npx @ai-eda/toolkit init test-project` creates a working project structure
2. All slash commands are functional
3. Can search LCSC, download datasheets, and convert libraries
4. Can create and manipulate KiCad schematics/PCBs via MCP
5. Full workflow from spec → export works end-to-end
