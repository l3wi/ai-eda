# Datasheet Analysis Guide

How to extract key information from component datasheets.

## Quick Reference Sections

### First Page (Key Specs)
- Operating voltage range
- Maximum ratings (absolute max)
- Key features
- Package options
- Pin count

### Electrical Characteristics
- DC specifications at room temp
- AC specifications (timing, frequency)
- Look for "typical" vs "min/max" values

### Application Circuit
- Reference design
- Required external components
- Component values
- Layout recommendations

### Package Information
- Footprint dimensions
- Pin assignments
- Thermal specifications

## By Component Type

### Voltage Regulators (LDO/Switching)

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Input voltage range | Must exceed your input |
| Output voltage | Fixed vs adjustable |
| Output current | With margin for peaks |
| Dropout voltage | Vin - Vout minimum |
| Quiescent current | Important for battery |
| Thermal resistance | For power dissipation calc |

**Application circuit notes:**
- Input capacitor value and type
- Output capacitor value and ESR requirements
- Soft-start behavior
- Enable pin requirements

**Power dissipation:**
```
P = (Vin - Vout) × Iout
Tj = Ta + (P × θja)
```

### Microcontrollers

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Operating voltage | Match your rail |
| Flash/RAM size | Sufficient for firmware |
| Clock speed | Max and PLL options |
| I/O voltage tolerance | 5V tolerant? |
| Current consumption | Run/sleep modes |
| Peripheral count | UART, SPI, I2C, ADC |

**Application circuit notes:**
- Decoupling capacitor requirements
- Crystal/oscillator requirements
- Reset circuit requirements
- Boot mode pins
- Programming interface

### Crystals/Oscillators

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Frequency | Match MCU requirements |
| Load capacitance | For crystal calc |
| Frequency tolerance | ppm at temp |
| ESR | Must be within MCU spec |

**Load capacitor calculation:**
```
CL = (C1 × C2) / (C1 + C2) + Cstray
Cstray ≈ 3-5pF typically
```

### MOSFETs

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Vds max | Drain-source voltage |
| Vgs threshold | Turn-on voltage |
| Rds(on) | On resistance at your Vgs |
| Id max | Continuous drain current |
| Qg | Gate charge (switching speed) |

**Gate drive requirements:**
- Check Rds(on) at your actual Vgs
- Logic-level vs standard gate
- Gate resistor for EMI

### Op-Amps

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Supply voltage range | Single vs dual supply |
| Input offset voltage | Precision needs |
| GBW | Gain-bandwidth product |
| Slew rate | For high-speed signals |
| Input bias current | High-impedance sources |
| Rail-to-rail I/O | Near-rail operation |

### Sensors

**Critical specs:**
| Spec | What to check |
|------|---------------|
| Measurement range | Covers your needs |
| Accuracy/resolution | Sufficient precision |
| Interface | I2C, SPI, analog |
| Supply voltage | Match your rail |
| Response time | Fast enough |
| Power consumption | Battery applications |

**Application notes:**
- Mounting/placement requirements
- Calibration needs
- Environmental sensitivity

## Reading Timing Diagrams

### SPI Timing
- Clock polarity (CPOL)
- Clock phase (CPHA)
- Setup/hold times
- Maximum clock frequency

### I2C Timing
- Clock frequency (100kHz, 400kHz, 1MHz)
- Rise/fall time requirements
- Pull-up resistor calculations

### UART Timing
- Baud rate range
- Start/stop bits
- Parity options

## Thermal Calculations

### Junction Temperature
```
Tj = Ta + (Pd × θja)

Where:
- Tj = Junction temperature
- Ta = Ambient temperature
- Pd = Power dissipation
- θja = Thermal resistance junction-to-ambient
```

### Safe Operating Area
- Check power derating curves
- Consider worst-case ambient
- Add margin (10-20%)

## Red Flags in Datasheets

- **"Typical" only specs** - No guaranteed min/max
- **Very high θja** - May need heatsinking
- **Limited temp range** - May not cover your application
- **Complex reference circuit** - More design effort
- **No application notes** - Less support available
- **NRND/EOL status** - Not recommended for new design

## Extracting Decoupling Requirements

### Where to Find
- "Application Information" or "Application Circuit" section
- "Power Supply Decoupling" or "Bypass Capacitors" section
- "Typical Application" schematic

### What to Extract
- Capacitor values and types (ceramic, tantalum)
- Placement requirements (distance from pins)
- ESR requirements (especially for regulators)
- Multiple capacitor values (e.g., "100nF + 10µF")

### Example Format
```
Decoupling requirements:
- VDD pins: 100nF ceramic each, close to pin
- VDDA: 100nF + 1µF ceramic
- Bulk: 10µF near power input
- ESR: Not critical (typical ceramic OK)
```

---

## Extracting Thermal Information

### Key Parameters to Find

| Parameter | Symbol | Where to Find |
|-----------|--------|---------------|
| Junction-to-ambient | θja | Thermal section, usually per package |
| Junction-to-case | θjc | For heatsink calculations |
| Max junction temp | Tj(max) | Absolute maximum ratings |
| Power dissipation | Pd | May be calculated or given |

### Thermal Calculation
```
Tj = Ta + (Pd × θja)

Where:
- Tj = Junction temperature (must be < Tj(max))
- Ta = Ambient temperature (your operating environment)
- Pd = Power dissipation
- θja = Thermal resistance (from datasheet)
```

### Example Format
```
Thermal:
- Package: SOT-223
- θja: 62°C/W
- Tj(max): 150°C
- Safe Pd at 40°C ambient: (125-40)/62 = 1.37W max
```

---

## Extracting Layout Guidelines

### Where to Find
- "PCB Layout" or "Layout Recommendations" section
- "Application Information"
- End of datasheet (often overlooked)

### What to Extract
- Component placement requirements
- Trace width recommendations
- Ground plane requirements
- Thermal pad handling
- Keep-out areas

### Example Format
```
Layout notes:
- Place input cap within 5mm of VIN pin
- Thermal pad requires 9+ vias to ground plane
- Keep sensitive traces away from switching node
- Ground plane required under IC
```

---

## Extracting Application Circuit Requirements

### Key Elements
1. **Required external components** - List all capacitors, resistors, inductors
2. **Optional components** - Enable resistors, soft-start caps
3. **Component constraints** - Voltage ratings, ESR limits
4. **Alternative configurations** - Different output voltages, features

### Example Format
```
Application circuit:
- Input: 10µF ceramic, 16V min
- Output: 22µF ceramic, 10V min, low ESR
- Feedback: 10kΩ + 4.7kΩ for 3.3V output
- Soft-start: 100nF (optional)
- Enable: 100kΩ pull-up (internal pull-down)
```

---

## Datasheet Checklist

Before selecting a component, verify:

- [ ] Operating voltage within your rails
- [ ] Current capability with 20% margin
- [ ] Package is available and appropriate
- [ ] Temperature range covers application
- [ ] Reference circuit is reasonable
- [ ] Required external components are available
- [ ] No red flags in absolute maximum ratings
- [ ] Thermal design is feasible
- [ ] Decoupling requirements documented
- [ ] Layout guidelines noted
- [ ] Alternatives identified (see `COMPONENT-ALTERNATIVES.md`)
