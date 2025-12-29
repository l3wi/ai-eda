# Project Templates

Common project archetypes with typical requirements.

## IoT Sensor Node

**Use case:** Battery-powered sensor that reports data wirelessly

```json
{
  "power": {
    "input": { "type": "battery", "voltage": { "min": 3.0, "max": 4.2 } },
    "rails": [{ "voltage": 3.3, "currentMa": 50 }],
    "batteryLifeDays": 365
  },
  "mcu": {
    "requirements": { "lowPower": true, "adc": true, "flash": ">=256KB" }
  },
  "connectivity": ["LoRa", "BLE"],
  "board": { "layers": 2, "size": { "maxWidthMm": 40, "maxHeightMm": 30 } }
}
```

**Key considerations:**
- Ultra-low power MCU (STM32L, nRF52, ESP32-C6)
- Sleep current < 10µA
- Efficient DC-DC converter
- Compact antenna design

---

## USB-Powered Controller

**Use case:** USB-connected device with moderate processing

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 500 },
      { "voltage": 3.3, "currentMa": 300 }
    ]
  },
  "mcu": {
    "requirements": { "usb": true, "flash": ">=512KB", "ram": ">=64KB" }
  },
  "connectivity": ["USB"],
  "board": { "layers": 2, "size": { "maxWidthMm": 60, "maxHeightMm": 40 } }
}
```

**Key considerations:**
- USB-C connector recommended
- ESD protection on USB lines
- 3.3V LDO from 5V USB
- USB impedance matching (90Ω differential)

---

## WiFi Gateway

**Use case:** Mains-powered device with WiFi connectivity

```json
{
  "power": {
    "input": { "type": "barrel", "voltage": { "min": 9, "max": 12 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 1000 },
      { "voltage": 3.3, "currentMa": 800 }
    ]
  },
  "mcu": {
    "requirements": { "wifi": true, "flash": ">=4MB", "ram": ">=512KB" }
  },
  "connectivity": ["WiFi", "Ethernet"],
  "board": { "layers": 4, "size": { "maxWidthMm": 80, "maxHeightMm": 60 } }
}
```

**Key considerations:**
- ESP32-S3 or similar WiFi SoC
- Good power filtering for RF
- PCB antenna or external antenna
- Consider 4-layer for better EMI

---

## Motor Controller

**Use case:** PWM motor control with current sensing

```json
{
  "power": {
    "input": { "type": "barrel", "voltage": { "min": 12, "max": 24 } },
    "rails": [
      { "voltage": 12.0, "currentMa": 5000 },
      { "voltage": 5.0, "currentMa": 200 },
      { "voltage": 3.3, "currentMa": 100 }
    ]
  },
  "mcu": {
    "requirements": { "pwm": 4, "adc": 2, "flash": ">=128KB" }
  },
  "board": { "layers": 2, "size": { "maxWidthMm": 60, "maxHeightMm": 50 } }
}
```

**Key considerations:**
- Thermal management for MOSFETs
- Current sensing with shunt resistors
- Separate power and logic grounds
- EMI filtering on motor outputs

---

## Audio Device

**Use case:** Audio processing or playback device

```json
{
  "power": {
    "input": { "type": "USB", "voltage": { "min": 4.5, "max": 5.5 } },
    "rails": [
      { "voltage": 5.0, "currentMa": 500 },
      { "voltage": 3.3, "currentMa": 200 },
      { "voltage": 3.3, "currentMa": 50, "name": "AVDD", "analog": true }
    ]
  },
  "mcu": {
    "requirements": { "i2s": true, "dma": true, "flash": ">=1MB" }
  },
  "board": { "layers": 4, "size": { "maxWidthMm": 50, "maxHeightMm": 50 } }
}
```

**Key considerations:**
- Separate analog and digital power domains
- Low-noise LDO for analog circuits
- Audio codec with good SNR
- Ground plane separation
- Shield sensitive analog traces

---

## Minimal Breakout Board

**Use case:** Simple breakout for testing a specific IC

```json
{
  "power": {
    "input": { "type": "header", "voltage": { "min": 3.0, "max": 5.5 } },
    "rails": [{ "voltage": 3.3, "currentMa": 100 }]
  },
  "board": { "layers": 2, "size": { "maxWidthMm": 25, "maxHeightMm": 25 } }
}
```

**Key considerations:**
- Breadboard-compatible pin spacing (2.54mm)
- Clear silkscreen labeling
- Test points for key signals
- Minimal BOM
