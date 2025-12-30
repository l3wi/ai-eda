# claude-eda

CLI tool for AI-assisted EDA (Electronic Design Automation) project initialization and management with KiCad.

Set up KiCad projects optimized for AI-assisted design workflows with Claude Code, including MCP server configuration, project scaffolding, and environment management.

## Features

- Interactive project scaffolding with KiCad integration
- Environment health checks and auto-repair
- MCP server management (jlc-mcp, kicad-pcb, kicad-sch)
- Template system for Claude commands, agents, and skills
- Design constraints configuration
- Cross-platform support (macOS, Windows, Linux)

## Installation

```bash
npm install -g claude-eda
```

Or run directly with npx:

```bash
npx claude-eda <command>
```

## Commands

| Command | Description |
|---------|-------------|
| `claude-eda init [name]` | Initialize new EDA project with interactive setup |
| `claude-eda doctor` | Environment health check (--fix for auto-repair) |
| `claude-eda update` | Sync templates and MCP configurations |
| `claude-eda config` | Read/modify design-constraints.json |
| `claude-eda kicad-ipc` | Enable/disable KiCad IPC API |
| `claude-eda kicad-mcp` | Install/manage KiCad PCB MCP server |
| `claude-eda kicad-sch-mcp` | Install/manage KiCad Schematic MCP server |

## Quick Start

### 1. Initialize a new project

```bash
claude-eda init my-board
```

This creates a project with:
- `.claude/` - Commands, agents, and skills for Claude Code
- `docs/` - Design documentation including `design-constraints.json`
- `.mcp.json` - MCP server configuration
- `CLAUDE.md` - Project instructions for Claude

### 2. Check environment

```bash
claude-eda doctor
```

To automatically install missing components:

```bash
claude-eda doctor --fix
```

### 3. Open in Claude Code

```bash
cd my-board
claude
```

Then use the EDA workflow commands:
- `/eda-new` - Define project requirements
- `/eda-source [role]` - Source components
- `/eda-schematic` - Create schematic
- `/eda-layout` - Layout PCB
- `/eda-check` - Validate design
- `/eda-export` - Export manufacturing files

## Command Details

### init

Create a new EDA project:

```bash
claude-eda init my-project       # Interactive setup
claude-eda init my-project -y    # Non-interactive with defaults
claude-eda init my-project --no-git  # Skip git initialization
```

### doctor

Check environment and optionally fix issues:

```bash
claude-eda doctor           # Check only
claude-eda doctor --fix     # Auto-install missing components
claude-eda doctor --fix -v  # Verbose output during fixes
```

Checks:
- KiCad 8.0+ installation
- KiCad IPC API configuration
- KiCad PCB MCP server (kicad-pcb)
- KiCad Schematic MCP server (kicad-sch)
- Node.js 18+

### update

Sync project templates with latest versions:

```bash
claude-eda update           # Update everything
claude-eda update --commands  # Slash commands only
claude-eda update --agents    # Agents only
claude-eda update --skills    # Skills only
claude-eda update --mcp       # .mcp.json only
```

### config

Manage project design constraints:

```bash
claude-eda config --list                    # Show all config
claude-eda config --get project.name        # Get specific value
claude-eda config --set board.layers=4      # Set value
claude-eda config --set "project.description=My board"
```

### kicad-ipc

Manage KiCad IPC API for real-time control:

```bash
claude-eda kicad-ipc --status   # Show status (default)
claude-eda kicad-ipc --enable   # Enable IPC API
claude-eda kicad-ipc --disable  # Disable IPC API
```

### kicad-mcp

Manage KiCad PCB MCP server:

```bash
claude-eda kicad-mcp --status   # Show status (default)
claude-eda kicad-mcp --install  # Install from GitHub
claude-eda kicad-mcp --configure-global  # Configure global Claude MCP
```

### kicad-sch-mcp

Manage KiCad Schematic MCP server:

```bash
claude-eda kicad-sch-mcp --status   # Show status (default)
claude-eda kicad-sch-mcp --install  # Install via uv/pip
```

## Project Structure

After running `claude-eda init`:

```
my-project/
├── .claude/
│   ├── commands/           # Slash commands (/eda-source, etc.)
│   ├── agents/             # Claude agents for EDA workflow
│   └── skills/             # Skills for component sourcing
├── docs/
│   ├── design-constraints.json
│   └── project-spec.md
├── datasheets/             # Component documentation
├── production/             # Manufacturing outputs
├── .mcp.json               # MCP server configuration
├── CLAUDE.md               # Project instructions
└── .gitignore
```

## MCP Servers

Three MCP servers are configured for the complete EDA workflow:

| Server | Purpose | Installation |
|--------|---------|--------------|
| `jlc` | Component sourcing from LCSC | Via npx (automatic) |
| `kicad-pcb` | PCB manipulation | `claude-eda kicad-mcp --install` |
| `kicad-sch` | Schematic manipulation | `claude-eda kicad-sch-mcp --install` |

Server installations are stored in `~/.claude-eda/`:
- `~/.claude-eda/kicad-mcp/` - KiCad PCB MCP server
- `~/.claude-eda/kicad-sch-venv/` - Python venv for schematic MCP

## Requirements

- **Node.js 18+** - Required
- **KiCad 8.0+** - For full functionality
- **Python 3.10+** - For kicad-sch-mcp
- **uv** - Python package manager for kicad-sch-mcp ([install](https://docs.astral.sh/uv/getting-started/installation/))

## Development

```bash
bun install
bun run build     # Build to ./dist
bun run dev       # Watch mode
bun run typecheck # Type checking
```

## Related Packages

- [jlc-mcp](../jlc-mcp) - JLC/LCSC component sourcing MCP server

## License

MIT
