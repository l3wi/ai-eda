# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
bun install          # Install dependencies
bun run build        # Build CLI to ./dist
bun run dev          # Watch mode
bun run typecheck    # Type check
bun run start        # Run CLI directly
```

## Architecture

### Overview

claude-eda is a CLI tool for AI-assisted EDA (Electronic Design Automation) project initialization and management with KiCad. It scaffolds new projects with MCP server configuration and Claude integration.

### Key Directories

- `src/commands/` - CLI command handlers (init, doctor, config, update, kicad-*)
- `src/utils/` - Utility functions for KiCad path detection, environment checks
- `templates/` - Project templates copied to new projects

### Commands

| Command | Description |
|---------|-------------|
| `init` | Create new EDA project with MCP configuration |
| `doctor` | Check environment (KiCad, Python, MCP servers) |
| `update` | Sync project templates and MCP config |
| `config` | Manage project configuration |
| `kicad-ipc` | Manage KiCad IPC API |
| `kicad-mcp` | Install/manage KiCad PCB MCP server |
| `kicad-sch-mcp` | Install/manage KiCad Schematic MCP server |
| `kicad-python` | Install kicad-python library |

### Related Projects

- **jlc-cli**: JLC/EasyEDA component sourcing tools (separate repository)
