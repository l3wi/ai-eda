# LCSC/EasyEDA MCP Server

An MCP (Model Context Protocol) server that provides access to LCSC's electronic component library, including schematic symbols, PCB footprints, and 3D models from EasyEDA.

## Features

- **Search Components**: Search LCSC's database of millions of electronic components
- **Get Component Details**: Retrieve complete component information including:
  - Pin definitions and electrical types
  - Footprint pad layouts
  - Manufacturer information
  - Datasheet URLs
  - 3D model references
- **Download 3D Models**: Get STEP or OBJ format 3D models for components
- **KiCad Export**: Generate KiCad-compatible symbol and footprint files

## Installation

```bash
# Clone or download this repository
cd lcsc-mcp

# Install dependencies
npm install

# Build
npm run build
```

## Usage with Claude Desktop

Add to your Claude Desktop configuration (`~/.config/claude/config.json` or equivalent):

```json
{
  "mcpServers": {
    "lcsc": {
      "command": "node",
      "args": ["/path/to/lcsc-mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### `search_components`

Search for components by keyword.

```
Input:
  - query: Search term (e.g., "ESP32", "STM32F103", "0805 100nF")
  - limit: Maximum results (default: 10, max: 50)

Output: List of matching components with LCSC IDs, names, manufacturers, packages, prices, and stock levels
```

### `get_component`

Get detailed information about a specific component.

```
Input:
  - lcsc_id: LCSC part number (e.g., "C2040", "C14663")

Output:
  - Component info (name, manufacturer, datasheet URL)
  - Symbol pins (numbers, names, electrical types, positions)
  - Footprint pads (shapes, sizes, positions)
  - 3D model UUID (if available)
```

### `get_3d_model`

Download a 3D model for a component.

```
Input:
  - uuid: 3D model UUID from get_component
  - format: "step" or "obj" (default: "step")

Output: Base64-encoded 3D model data
```

### `get_symbol_kicad`

Generate a KiCad symbol file for a component.

```
Input:
  - lcsc_id: LCSC part number

Output: KiCad symbol library file content (.kicad_sym format)
```

### `get_footprint_kicad`

Generate a KiCad footprint file for a component.

```
Input:
  - lcsc_id: LCSC part number

Output: KiCad footprint file content (.kicad_mod format)
```

## Example Workflow

```
User: Find me an ESP32 module suitable for battery-powered IoT

Claude: [calls search_components with query "ESP32 low power"]
       Found several options. The ESP32-WROOM-32E (C2913206) looks suitable.

User: Get me the details

Claude: [calls get_component with lcsc_id "C2913206"]
       The ESP32-WROOM-32E has:
       - 38 pins including GPIO, power, and antenna connections
       - SMD footprint with castellated holes
       - 3D model available
       - Datasheet: [link]

User: Generate the KiCad symbol

Claude: [calls get_symbol_kicad with lcsc_id "C2913206"]
       Here's the KiCad symbol file...
```

## API Endpoints Used

This MCP server interfaces with EasyEDA's public API:

| Endpoint | Purpose |
|----------|---------|
| `easyeda.com/api/products/{id}/components` | Component data (symbol, footprint) |
| `modules.easyeda.com/3dmodel/{uuid}` | 3D model (OBJ format) |
| `modules.easyeda.com/qAxj6KHrDKw4blvCG8QJPs7Y/{uuid}` | 3D model (STEP format) |
| `wmsc.lcsc.com/ftms/query/product/search` | Component search |

## Limitations

- The KiCad conversion is simplified; for production use, consider using [easyeda2kicad](https://github.com/uPesy/easyeda2kicad.py) for more accurate conversion
- 3D models are downloaded as raw data; you'll need to save them to files manually
- Some complex symbols with multiple units may not convert perfectly

## License

MIT

## Credits

- API discovery based on [easyeda2kicad.py](https://github.com/uPesy/easyeda2kicad.py)
- Built for use with [Anthropic's MCP](https://modelcontextprotocol.io/)
