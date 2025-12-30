# ai-eda

AI-assisted Electronic Design Automation toolkit for KiCad and Claude Code.

Design PCBs with AI assistance - from component sourcing through schematic capture to PCB layout. This monorepo provides the MCP servers and CLI tools that enable Claude Code to work directly with KiCad projects.

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [jlc-mcp](./packages/jlc-mcp) | [![npm](https://img.shields.io/npm/v/jlc-mcp)](https://www.npmjs.com/package/jlc-mcp) | MCP server for JLC/LCSC component sourcing and KiCad library conversion |
| [claude-eda](./packages/claude-eda) | [![npm](https://img.shields.io/npm/v/claude-eda)](https://www.npmjs.com/package/claude-eda) | CLI for AI-assisted EDA project initialization and management |

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                        Claude Code                               │
│  AI assistant with access to MCP servers for EDA tasks          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐   ┌───────────┐   ┌───────────┐
    │  jlc-mcp  │   │ kicad-pcb │   │ kicad-sch │
    │           │   │    MCP    │   │    MCP    │
    │ Component │   │           │   │           │
    │ Sourcing  │   │ PCB Layout│   │ Schematic │
    └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
          │               │               │
          ▼               ▼               ▼
    ┌───────────┐   ┌─────────────────────────┐
    │   LCSC/   │   │         KiCad           │
    │  EasyEDA  │   │   (via IPC API)         │
    │    API    │   │                         │
    └───────────┘   └─────────────────────────┘
```

**jlc-mcp** provides component sourcing:
- Search JLCPCB's parts database with stock and pricing info
- Fetch components as KiCad-compatible symbols and footprints
- Organize libraries by category (Resistors, Capacitors, ICs, etc.)
- Download 3D models for PCB visualization

**claude-eda** provides project scaffolding:
- Initialize projects with Claude Code integration
- Configure MCP servers for the EDA workflow
- Install and manage KiCad schematic and PCB MCP servers
- Provide slash commands, agents, and skills for EDA tasks

## Quick Start

### 1. Initialize a new project

```bash
npx claude-eda init my-board
cd my-board
```

This creates a project with MCP configuration, Claude commands, and design documentation.

### 2. Check your environment

```bash
npx claude-eda doctor --fix
```

Installs any missing MCP servers and configures KiCad.

### 3. Start designing with Claude

```bash
claude
```

Use the EDA workflow commands:
- `/eda/new` - Define project requirements
- `/eda/source [role]` - Source components from LCSC
- `/eda/schematic` - Create schematic
- `/eda/layout` - Layout PCB
- `/eda/check` - Validate design
- `/eda/export` - Export manufacturing files

## Requirements

- **Node.js 18+** or **Bun** - Package manager and runtime
- **KiCad 8.0+** - For schematic and PCB editing
- **Claude Code** - AI-assisted design workflow
- **Python 3.10+** - For KiCad schematic MCP server

## Development

```bash
# Clone the repository
git clone https://github.com/anthropics/ai-eda.git
cd ai-eda

# Install dependencies
bun install

# Build all packages
bun run build

# Run tests
bun run test

# Type checking
bun run typecheck

# Lint
bun run lint
```

### Package Development

Each package can be developed independently:

```bash
# Work on jlc-mcp
cd packages/jlc-mcp
bun run dev      # Watch mode
bun run test     # Run tests

# Work on claude-eda
cd packages/claude-eda
bun run dev      # Watch mode
bun run build    # Build CLI
```

## Contributing

Contributions are welcome! Here's how to get started:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ai-eda.git`
3. Install dependencies: `bun install`
4. Create a branch: `git checkout -b feat/your-feature`

### Development Guidelines

- **Code Style**: Run `bun run lint` before committing
- **Type Safety**: Ensure `bun run typecheck` passes
- **Testing**: Add tests for new functionality
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/) format
  - `feat:` New features
  - `fix:` Bug fixes
  - `docs:` Documentation changes
  - `refactor:` Code refactoring
  - `test:` Test additions or modifications

### Pull Request Process

1. Ensure all checks pass (`bun run build && bun run test && bun run lint`)
2. Update documentation if needed (package READMEs, this README)
3. Create a pull request with a clear description of changes
4. Link any related issues

### Reporting Issues

- Use GitHub Issues for bug reports and feature requests
- Include reproduction steps for bugs
- Provide context about your environment (OS, Node version, KiCad version)

## Project Structure

```
ai-eda/
├── packages/
│   ├── jlc-mcp/          # Component sourcing MCP server
│   │   ├── src/
│   │   └── README.md
│   └── claude-eda/       # Project initialization CLI
│       ├── src/
│       └── README.md
├── templates/            # Project templates
│   ├── claude/           # Commands, agents, skills
│   └── project-files/    # Configuration templates
└── docs/                 # Documentation
```

## Related Projects

- [KiCad](https://www.kicad.org/) - Open source EDA suite
- [Claude Code](https://claude.com/claude-code) - AI coding assistant CLI
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol for AI tool integration

## License

MIT
