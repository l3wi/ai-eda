# Design Constraints Schema

The `design-constraints.json` file captures machine-readable project constraints used by all downstream skills.

## Full Schema

```json
{
  "meta": {
    "version": "1.1",
    "projectName": "string",
    "created": "ISO8601 timestamp",
    "lastUpdated": "ISO8601 timestamp",
    "stage": "architect | research | schematic | pcb | validation | complete"
  },

  "project": {
    "name": "string",
    "description": "string",
    "version": "semver string",
    "targetUse": "prototype | production | hobby",
    "quantity": "number (target manufacturing quantity)"
  },

  "power": {
    "input": {
      "type": "USB | battery | barrel | mains | PoE | solar | header",
      "voltage": {
        "min": "number (V)",
        "max": "number (V)",
        "nominal": "number (V, optional)"
      },
      "currentMax": "number (mA, optional)"
    },
    "rails": [
      {
        "name": "string (e.g., VCC_3V3)",
        "voltage": "number (V)",
        "currentMa": "number",
        "tolerance": "number (%, optional)",
        "analog": "boolean (if dedicated analog rail)",
        "source": "regulator | direct | battery"
      }
    ],
    "battery": {
      "type": "LiPo | LiFePO4 | NiMH | alkaline | coin",
      "capacity": "number (mAh)",
      "targetLifeDays": "number (optional)"
    }
  },

  "mcu": {
    "required": "boolean",
    "selected": "string | null (LCSC part number when selected)",
    "family": "string (preferred family, optional)",
    "requirements": {
      "flash": "string (e.g., '>=256KB')",
      "ram": "string (e.g., '>=64KB')",
      "speed": "string (e.g., '>=48MHz')",
      "gpio": "number",
      "adc": "number | boolean",
      "dac": "number | boolean",
      "pwm": "number",
      "uart": "number",
      "spi": "number",
      "i2c": "number",
      "usb": "boolean",
      "can": "boolean",
      "ethernet": "boolean",
      "wifi": "boolean",
      "bluetooth": "boolean",
      "lowPower": "boolean"
    }
  },

  "connectivity": {
    "wireless": ["WiFi", "BLE", "LoRa", "Zigbee", "cellular", "NFC"],
    "wired": ["USB", "Ethernet", "CAN", "RS485", "RS232"],
    "debug": ["SWD", "JTAG", "UART"]
  },

  "interfaces": {
    "buttons": "number",
    "leds": "number",
    "display": {
      "type": "none | LCD | OLED | eInk | TFT",
      "size": "string (e.g., '1.3inch')",
      "resolution": "string (e.g., '128x64')",
      "interface": "SPI | I2C | parallel"
    },
    "connectors": [
      {
        "type": "USB-C | USB-A | barrel | header | JST | screw-terminal",
        "purpose": "string",
        "position": "string (e.g., 'top-edge')"
      }
    ]
  },

  "sensors": [
    {
      "type": "temperature | humidity | pressure | IMU | light | current | voltage",
      "interface": "I2C | SPI | analog | digital",
      "selected": "string | null (LCSC part number)",
      "notes": "string"
    }
  ],

  "board": {
    "layers": "number (2, 4, 6)",
    "size": {
      "widthMm": "number",
      "heightMm": "number",
      "maxWidthMm": "number (constraint)",
      "maxHeightMm": "number (constraint)",
      "shape": "rectangle | custom"
    },
    "thickness": "number (mm, default 1.6)",
    "mountingHoles": [
      {
        "diameter": "number (mm)",
        "x": "number (mm from origin)",
        "y": "number (mm from origin)"
      }
    ],
    "stackup": "string (e.g., 'sig-gnd-pwr-sig' for 4-layer)"
  },

  "stackupDecision": {
    "layers": "number (2, 4, 6)",
    "rationale": "string (why this layer count was chosen)",
    "impedanceControlRequired": "boolean",
    "highSpeedSignals": ["USB", "Ethernet", "HDMI", "DDR", "PCIe"]
  },

  "thermal": {
    "estimatedTotalWatts": "number",
    "hotComponents": [
      {
        "role": "string (e.g., 'regulator-5v', 'motor-driver')",
        "watts": "number"
      }
    ],
    "coolingStrategy": "natural | forced | heatsink | active",
    "ambientTempMax": "number (°C, operating environment)"
  },

  "dfmTargets": {
    "manufacturer": "JLCPCB | PCBWay | OSHPark | other",
    "assemblyMethod": "hand | reflow | turnkey",
    "budgetTier": "prototype | low_volume | production",
    "finePitchComponents": "boolean (any components with <0.5mm pitch)"
  },

  "environment": {
    "tempMin": "number (°C)",
    "tempMax": "number (°C)",
    "indoor": "boolean",
    "outdoor": "boolean",
    "ipRating": "string (e.g., 'IP65', optional)",
    "vibration": "boolean",
    "humidity": "string (e.g., '0-95% non-condensing')"
  },

  "manufacturing": {
    "assembly": "hand | reflow | turnkey",
    "preferredManufacturer": "JLCPCB | PCBWay | OSHPark | other",
    "budgetPerUnit": "number (USD, optional)",
    "leadTime": "string (e.g., 'standard', 'expedited')"
  },

  "components": {
    "selected": [
      {
        "role": "string (e.g., 'mcu', 'regulator-3v3')",
        "lcsc": "string (LCSC part number)",
        "mpn": "string (manufacturer part number)",
        "manufacturer": "string",
        "value": "string (if applicable)",
        "footprint": "string",
        "quantity": "number"
      }
    ],
    "pending": ["string (roles not yet selected)"]
  }
}
```

## Minimal Example

For a simple project, only required fields:

```json
{
  "meta": {
    "version": "1.1",
    "projectName": "led-blinker",
    "created": "2025-01-15T10:00:00Z",
    "lastUpdated": "2025-01-15T10:00:00Z",
    "stage": "architect"
  },
  "project": {
    "name": "LED Blinker",
    "description": "Simple LED blinker for learning",
    "version": "0.1.0",
    "targetUse": "hobby"
  },
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [{ "name": "VCC_3V3", "voltage": 3.3, "currentMa": 100, "source": "regulator" }]
  },
  "mcu": {
    "required": true,
    "selected": null,
    "requirements": { "gpio": 2, "flash": ">=32KB" }
  },
  "board": {
    "layers": 2,
    "size": { "maxWidthMm": 30, "maxHeightMm": 30 }
  },
  "stackupDecision": {
    "layers": 2,
    "rationale": "Simple low-speed design with LDO, no switching regulators",
    "impedanceControlRequired": false,
    "highSpeedSignals": []
  },
  "thermal": {
    "estimatedTotalWatts": 0.5,
    "hotComponents": [],
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "manufacturer": "JLCPCB",
    "assemblyMethod": "hand",
    "budgetTier": "prototype",
    "finePitchComponents": false
  },
  "components": {
    "selected": [],
    "pending": ["mcu", "regulator-3v3", "led", "resistor-led"]
  }
}
```

## Complex Example (WiFi Gateway with Switching Regulator)

```json
{
  "meta": {
    "version": "1.1",
    "projectName": "wifi-gateway",
    "stage": "architect"
  },
  "stackupDecision": {
    "layers": 4,
    "rationale": "Switching regulator + WiFi requires solid ground plane",
    "impedanceControlRequired": true,
    "highSpeedSignals": ["USB"]
  },
  "thermal": {
    "estimatedTotalWatts": 3.5,
    "hotComponents": [
      { "role": "regulator-5v", "watts": 1.2 },
      { "role": "wifi-module", "watts": 0.8 }
    ],
    "coolingStrategy": "natural",
    "ambientTempMax": 40
  },
  "dfmTargets": {
    "manufacturer": "JLCPCB",
    "assemblyMethod": "turnkey",
    "budgetTier": "low_volume",
    "finePitchComponents": true
  }
}
```

## Stage Progression

The `meta.stage` field tracks workflow progress:

1. **architect** - Initial specification complete
2. **research** - Component selection in progress
3. **schematic** - Schematic capture in progress
4. **pcb** - PCB layout in progress
5. **validation** - Design review in progress
6. **complete** - Ready for manufacturing

Skills should update this field when completing their phase.

## Validation Rules

When reading this file, skills should validate:

1. `meta.version` matches expected schema version
2. Required fields are present for current stage
3. Component `selected` entries have valid LCSC numbers
4. Board dimensions are reasonable (warn if < 10mm or > 300mm)
5. Power budget is feasible (sum of rail currents vs input capacity)

## Architecture Warnings

Flag these combinations during the architect phase:

| Condition | Warning |
|-----------|---------|
| 2-layer board + switching regulator in power rails | "Consider 4-layer - switching regulators need solid ground plane" |
| 2-layer board + USB/Ethernet in connectivity | "Controlled impedance difficult on 2-layer - consider 4-layer" |
| `thermal.estimatedTotalWatts` > 2 + no `thermal.coolingStrategy` | "Add thermal budget estimation - >2W needs planning" |
| `dfmTargets.assemblyMethod` = "hand" + `dfmTargets.finePitchComponents` = true | "Verify solderability - fine-pitch components difficult to hand solder" |
| `thermal.hotComponents` has item with watts > 0.5 + no thermal strategy | "Component dissipating >0.5W needs dedicated thermal attention" |
