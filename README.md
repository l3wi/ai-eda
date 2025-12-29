# @ai-eda Monorepo

AI-assisted Electronic Design Automation toolkit for KiCad and Claude Code.

## Packages

| Package | Description |
|---------|-------------|
| [@ai-eda/common](./packages/common) | Shared types, utilities, and constants |
| [@ai-eda/lcsc-mcp](./packages/lcsc-mcp) | MCP server for LCSC/EasyEDA component sourcing |
| [@ai-eda/kicad-mcp](./packages/kicad-mcp) | MCP server for KiCad automation |
| [@ai-eda/toolkit](./packages/toolkit) | CLI for project initialization |

## Quick Start

### Initialize a New Project

```bash
npx @ai-eda/toolkit init my-project
cd my-project
```

### Use with Claude Code

The toolkit sets up all necessary configuration for Claude Code, including:
- MCP servers for KiCad and LCSC integration
- Slash commands for the EDA workflow
- Specialized agents for different design tasks

## EDA Workflow

1. `/eda-spec` - Define project requirements
2. `/eda-source [role]` - Source components from LCSC
3. `/eda-library [part]` - Fetch KiCad libraries from EasyEDA
4. `/eda-schematic` - Create schematic
5. `/eda-wiring` - Wire connections
6. `/eda-pcb-place` - Place components on PCB
7. `/eda-pcb-route` - Route traces
8. `/eda-validate` - Validate design
9. `/eda-export [format]` - Export manufacturing files

## Development

```bash
# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test
```

## Templates

The `templates/` directory contains all project templates:
- `claude/commands/` - Slash command definitions
- `claude/agents/` - Specialized agent prompts
- `claude/skills/` - EDA design skill
- `project-files/` - Configuration templates
- `claude-md/` - CLAUDE.md templates

## Requirements

- **Bun** (recommended) or Node.js 18+
- **KiCad 8.0+** (for full functionality)
- **Claude Code** (for AI-assisted workflow)

## License

MIT
