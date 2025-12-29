# EDA Design Guidelines

## Schematic Design

### General Principles
- Use hierarchical sheets for complex designs
- One major function per sheet
- Consistent symbol orientation
- Clear signal flow (left to right, top to bottom)

### Net Naming Convention
```
Power:      VCC_3V3, VCC_5V, VBAT, GND
Reset:      MCU_RESET, PHY_RESET
SPI:        SPIx_MOSI, SPIx_MISO, SPIx_SCK, SPIx_CS
I2C:        I2Cx_SDA, I2Cx_SCL
UART:       UARTx_TX, UARTx_RX
GPIO:       GPIO_Pxx or descriptive (LED_STATUS)
```

### Decoupling Guidelines
| IC Type | Decoupling |
|---------|------------|
| MCU | 100nF per VDD + 10µF bulk |
| Analog | 100nF + 10nF on AVDD |
| Power IC | Per datasheet |
| High-speed | 100nF + 10nF + 1µF |

## PCB Layout

### Layer Stackup
- 2-layer: Signal top, Ground bottom
- 4-layer: Signal, Ground, Power, Signal

### Trace Width (1oz copper, 10°C rise)
| Current | Width |
|---------|-------|
| 0.5A | 0.3mm |
| 1A | 0.5mm |
| 2A | 1.0mm |
| 3A | 1.5mm |

### Clearance Rules
- Signal-Signal: 0.2mm min
- Power-Signal: 0.3mm min
- High voltage: Per safety requirements

### Via Specifications
| Type | Drill | Pad |
|------|-------|-----|
| Signal | 0.3mm | 0.6mm |
| Power | 0.4mm | 0.8mm |
| Thermal | 0.3mm | 0.6mm |

## Component Placement

### Priority Order
1. Connectors (edge positions)
2. MCU (central location)
3. Crystal (near MCU)
4. Power input/regulators
5. Decoupling capacitors
6. Remaining components

### Critical Distances
- Crystal to MCU: ≤5mm
- Decoupling to IC: ≤3mm
- USB ESD to connector: ≤10mm

## Signal Integrity

### High-Speed Routing
- Impedance control for USB (90Ω differential)
- Length matching for differential pairs
- Ground reference continuity
- Avoid layer transitions

### Analog Considerations
- Separate analog and digital ground (star point)
- Shield sensitive traces
- Keep away from noisy signals
- Use ground guards

## Manufacturing

### JLCPCB Capabilities
- Layers: 1-16
- Min trace: 0.127mm
- Min space: 0.127mm
- Min via: 0.3mm drill
- Board thickness: 0.4-2.4mm

### File Requirements
- Gerber: RS-274X format
- Drill: Excellon format
- BOM: CSV with LCSC numbers
- CPL: CSV with positions
