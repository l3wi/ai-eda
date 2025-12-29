# Project Templates

Common project archetypes with typical requirements and architecture decisions.

## IoT Sensor Node

**Use case:** Battery-powered sensor that reports data wirelessly

```json
{
  "power": {
    "input": { "type": "battery", "voltage": { "min": 3.0, "max": 4.2 } },
    "rails": [{ "voltage": 3.3, "currentMa": 50, "source": "regulator" }],
    "batteryLifeDays": 365
  },
  "mcu": {
    "requirements": { "lowPower": true, "adc": true, "flash": ">=256KB" }
  },
  "connectivity": ["LoRa", "BLE"],
  "board": { "layers": 2, "size": { "maxWidthMm": 40, "maxHeightMm": 30 } },
  "stackupDecision": {
    "layers": 2,
    "rationale": "Low power, simple RF module, cost-sensitive",
    "impedanceControlRequired": false
  },
  "thermal": {
    "estimatedTotalWatts": 0.1,
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "reflow",
    "budgetTier": "low_volume"
  }
}
```

**Key considerations:**
- Ultra-low power MCU (STM32L, nRF52, ESP32-C6)
- Sleep current < 10µA
- Efficient DC-DC converter (buck preferred over LDO for battery life)
- Compact antenna design
- 2-layer OK if using module with integrated antenna

---

## USB-Powered Controller

**Use case:** USB-connected device with moderate processing

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 500, "source": "direct" },
      { "voltage": 3.3, "currentMa": 300, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "usb": true, "flash": ">=512KB", "ram": ">=64KB" }
  },
  "connectivity": ["USB"],
  "board": { "layers": 4, "size": { "maxWidthMm": 60, "maxHeightMm": 40 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "USB 2.0 requires 90Ω differential impedance control",
    "impedanceControlRequired": true,
    "highSpeedSignals": ["USB"]
  },
  "thermal": {
    "estimatedTotalWatts": 1.0,
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "reflow",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- USB-C connector recommended
- ESD protection on USB lines (TVS diodes)
- 3.3V LDO from 5V USB (or buck if >300mA)
- 4-layer for USB impedance matching (90Ω differential)
- Ground plane under USB traces essential

---

## WiFi Gateway

**Use case:** Mains-powered device with WiFi connectivity

```json
{
  "power": {
    "input": { "type": "barrel", "voltage": { "min": 9, "max": 12 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 1000, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 800, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "wifi": true, "flash": ">=4MB", "ram": ">=512KB" }
  },
  "connectivity": ["WiFi", "Ethernet"],
  "board": { "layers": 4, "size": { "maxWidthMm": 80, "maxHeightMm": 60 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "Switching regulator + WiFi + Ethernet requires solid ground plane",
    "impedanceControlRequired": true,
    "highSpeedSignals": ["Ethernet", "USB"]
  },
  "thermal": {
    "estimatedTotalWatts": 3.5,
    "hotComponents": [
      { "role": "buck-regulator", "watts": 1.0 },
      { "role": "wifi-module", "watts": 0.8 }
    ],
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "turnkey",
    "budgetTier": "low_volume",
    "finePitchComponents": true
  }
}
```

**Key considerations:**
- ESP32-S3 or similar WiFi SoC
- Buck converter required (LDO from 12V too inefficient)
- Good power filtering for RF (LC filter after buck)
- PCB antenna or external antenna
- 4-layer recommended for signal integrity

---

## Motor Controller

**Use case:** PWM motor control with current sensing

```json
{
  "power": {
    "input": { "type": "barrel", "voltage": { "min": 12, "max": 24 } },
    "rails": [
      { "voltage": 12.0, "currentMa": 5000, "source": "direct" },
      { "voltage": 5.0, "currentMa": 200, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 100, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "pwm": 4, "adc": 2, "flash": ">=128KB" }
  },
  "board": { "layers": 4, "size": { "maxWidthMm": 60, "maxHeightMm": 50 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "PWM noise isolation, thermal spreading, current sensing accuracy",
    "impedanceControlRequired": false
  },
  "thermal": {
    "estimatedTotalWatts": 8.0,
    "hotComponents": [
      { "role": "mosfet-high-side", "watts": 2.0 },
      { "role": "mosfet-low-side", "watts": 2.0 },
      { "role": "gate-driver", "watts": 0.5 }
    ],
    "coolingStrategy": "heatsink"
  },
  "dfmTargets": {
    "assemblyMethod": "reflow",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- Thermal management for MOSFETs (exposed pad packages, thermal vias)
- Current sensing with shunt resistors (low-side or high-side)
- 4-layer recommended for noise isolation between power and logic
- EMI filtering on motor outputs (ferrites, snubbers)
- Physical separation between high-current and logic sections

---

## Audio Device

**Use case:** Audio processing or playback device

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 500, "source": "direct" },
      { "voltage": 3.3, "currentMa": 200, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 50, "name": "AVDD", "analog": true, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "i2s": true, "dma": true, "flash": ">=1MB" }
  },
  "board": { "layers": 4, "size": { "maxWidthMm": 50, "maxHeightMm": 50 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "Analog/digital isolation, USB impedance control",
    "impedanceControlRequired": true,
    "highSpeedSignals": ["USB"]
  },
  "thermal": {
    "estimatedTotalWatts": 1.5,
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "reflow",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- Separate analog and digital power domains (AVDD from dedicated LDO)
- Low-noise LDO for analog circuits (TPS7A20 or similar)
- Audio codec with good SNR (>90dB)
- Single ground plane with careful partitioning (NOT split)
- Shield sensitive analog traces with ground pour
- Keep digital signals away from analog inputs

---

## Minimal Breakout Board

**Use case:** Simple breakout for testing a specific IC

```json
{
  "power": {
    "input": { "type": "header", "voltage": { "min": 3.0, "max": 5.5 } },
    "rails": [{ "voltage": 3.3, "currentMa": 100, "source": "regulator" }]
  },
  "board": { "layers": 2, "size": { "maxWidthMm": 25, "maxHeightMm": 25 } },
  "stackupDecision": {
    "layers": 2,
    "rationale": "Simple test board, cost-optimized",
    "impedanceControlRequired": false
  },
  "thermal": {
    "estimatedTotalWatts": 0.2,
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "hand",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- Breadboard-compatible pin spacing (2.54mm)
- Clear silkscreen labeling
- Test points for key signals
- Minimal BOM
- Thermal reliefs on ground pours for hand soldering

---

## RF/Antenna Design

**Use case:** Board with integrated antenna or RF front-end (WiFi, BLE, LoRa)

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 3.3, "currentMa": 500, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 100, "name": "VCC_RF", "analog": true, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "wifi": true, "flash": ">=4MB", "ram": ">=256KB" }
  },
  "connectivity": ["WiFi", "BLE"],
  "board": { "layers": 4, "size": { "maxWidthMm": 40, "maxHeightMm": 30 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "RF requires solid ground plane under antenna and matching network",
    "impedanceControlRequired": true,
    "highSpeedSignals": ["RF"]
  },
  "thermal": {
    "estimatedTotalWatts": 1.0,
    "hotComponents": [
      { "role": "rf-module", "watts": 0.6 }
    ],
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "turnkey",
    "budgetTier": "low_volume",
    "finePitchComponents": true
  }
}
```

**Key considerations:**
- 4-layer mandatory for proper RF ground plane
- Antenna keep-out zone (no copper under antenna)
- 50Ω trace impedance for RF feed
- Ground stitching vias around RF section
- Separate RF power rail with LC filtering
- Antenna matching network may need tuning

---

## High-Current Motor Driver

**Use case:** High-power motor control (BLDC, stepper, DC motor >5A)

```json
{
  "power": {
    "input": { "type": "screw-terminal", "voltage": { "min": 12, "max": 48 } },
    "rails": [
      { "voltage": 48.0, "currentMa": 20000, "source": "direct" },
      { "voltage": 12.0, "currentMa": 500, "source": "regulator" },
      { "voltage": 5.0, "currentMa": 200, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 100, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "pwm": 6, "adc": 4, "flash": ">=256KB", "can": true }
  },
  "board": { "layers": 4, "size": { "maxWidthMm": 80, "maxHeightMm": 60 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "High current requires heavy copper, noise isolation critical",
    "impedanceControlRequired": false
  },
  "thermal": {
    "estimatedTotalWatts": 15.0,
    "hotComponents": [
      { "role": "mosfet-phase-a", "watts": 3.0 },
      { "role": "mosfet-phase-b", "watts": 3.0 },
      { "role": "mosfet-phase-c", "watts": 3.0 },
      { "role": "gate-driver", "watts": 1.0 },
      { "role": "shunt-resistor", "watts": 2.0 }
    ],
    "coolingStrategy": "heatsink",
    "ambientTempMax": 50
  },
  "dfmTargets": {
    "manufacturer": "JLCPCB",
    "assemblyMethod": "reflow",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- Heavy copper (2oz or more) for power paths
- Exposed-pad MOSFETs with thermal vias to back copper
- Physical separation between power stage and control logic
- Current sensing accuracy requires careful layout
- Gate drive isolation from logic supply
- Bulk capacitors at motor output
- Input TVS for transient protection
- Consider external heatsink or aluminum substrate

---

## Mixed-Signal / Precision ADC

**Use case:** Precision measurement with high-resolution ADC (16-24 bit)

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 200, "source": "direct" },
      { "voltage": 3.3, "currentMa": 100, "source": "regulator" },
      { "voltage": 3.3, "currentMa": 20, "name": "AVDD", "analog": true, "source": "regulator" },
      { "voltage": 2.5, "currentMa": 10, "name": "VREF", "analog": true, "source": "regulator" }
    ]
  },
  "mcu": {
    "requirements": { "spi": 1, "gpio": 8, "flash": ">=128KB" }
  },
  "sensors": [
    { "type": "voltage", "interface": "SPI", "notes": "24-bit ADC" }
  ],
  "board": { "layers": 4, "size": { "maxWidthMm": 50, "maxHeightMm": 40 } },
  "stackupDecision": {
    "layers": 4,
    "rationale": "Analog/digital isolation, solid reference plane for ADC",
    "impedanceControlRequired": false
  },
  "thermal": {
    "estimatedTotalWatts": 0.5,
    "coolingStrategy": "natural"
  },
  "dfmTargets": {
    "assemblyMethod": "reflow",
    "budgetTier": "prototype"
  }
}
```

**Key considerations:**
- Dedicated analog power domain (AVDD) with ultra-low-noise LDO
- Precision voltage reference (separate from AVDD)
- Single solid ground plane (do NOT split)
- Guard rings around sensitive analog inputs
- Keep digital signals away from analog section
- Analog signals on inner layer (shielded)
- Star ground connection point for analog section
- Consider input protection and filtering
- Calibration resistors may be needed
