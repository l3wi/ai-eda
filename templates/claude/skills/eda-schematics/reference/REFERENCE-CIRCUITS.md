# Common Reference Circuits

Standard subcircuits for common design patterns.

## How to Use This Document

1. **Find the pattern** that matches your design need
2. **Check component values** against your datasheet (values here are starting points)
3. **Cross-reference** with `eda-research/reference/DECOUPLING-STRATEGY.md` for cap values
4. **Adapt** to your specific voltage rails and current requirements

**Key principle:** Always verify component values against your specific IC datasheet.

## Power Circuits

### USB Power Input with Protection

```
VBUS ──┬──[F1]──┬──[D1]──┬── VIN_5V
       │        │        │
      ═╧═      ═╧═      ═╧═
      TVS    100nF     10µF
       │        │        │
GND ───┴────────┴────────┴──

Components:
- F1: PTC fuse (500mA-1A)
- D1: Schottky diode (reverse protection) or P-MOSFET
- TVS: SMBJ5.0A or similar
- Caps: Ceramic, X5R/X7R
```

### LDO Regulator (3.3V)

**When to use:** Simple power, low current (<500mA), noise-sensitive circuits.
**When to avoid:** High current, large Vin-Vout difference (heat), battery-powered (efficiency).
**From design-constraints.json:** Check if `power.topology` is `ldo`.

```
VIN ──┬────┬────────────┬── VOUT (3.3V)
      │   ┌┴┐           │
     ═╧═  │ │U1        ═╧═
    10µF  │ │LDO      10µF
      │   └┬┘           │
      │    │            │
GND ──┴────┴────────────┴──

Components:
- U1: AMS1117-3.3, AP2112K-3.3, or similar
- Input cap: 10µF ceramic (check datasheet)
- Output cap: 10µF ceramic (check ESR requirements)

Notes:
- Check dropout voltage: Vin_min = Vout + Vdropout
- Add enable control if needed
```

### Buck Converter (5V to 3.3V)

**When to use:** Higher current (>200mA), efficiency matters, battery-powered.
**When to avoid:** Noise-sensitive RF/analog (use buck + LDO post-reg).
**From design-constraints.json:** Check if `power.topology` is `buck` or `hybrid`.
**Layout note:** Requires 4-layer PCB for good ground plane under switching node.

```
VIN ──┬────┬─────────────────────────┬── VOUT
      │   ┌┴┐         ┌───┐          │
     ═╧═  │ │U1  SW──►│ L │─────┬───═╧═
    10µF  │ │Buck     └───┘     │   22µF
      │   │ │           │  ┌────┤
      │   │ │FB◄────────┼──┤R1  │
      │   └┬┘           │  └────┤
      │    │            │  ┌────┤
GND ──┴────┴────────────┴──┤R2  │
                           └────┴──

Components:
- U1: MP1584, TPS562200, or similar
- L: 4.7µH-10µH inductor (check datasheet)
- Output caps: 22µF ceramic
- Feedback: Set by R1/R2 ratio

Notes:
- Follow datasheet layout guidelines
- Inductor current rating > 1.3× max load
```

## MCU Support Circuits

### Crystal Oscillator

**Critical:** Load capacitor values must be calculated, not guessed.
**Layout note:** Keep traces short (<5mm), add ground guard ring in layout.
**From datasheet:** Find `CL` (load capacitance) specification for crystal.

```
        MCU
     ┌───────┐
     │ OSC_IN├──┬──────┬──────┐
     │       │  │     ═╧═    ┌┴┐
     │       │  │     CL1    │ │Y1
     │OSC_OUT├──┼──┬──═╪═────┴┬┘
     └───────┘  │  │  CL2     │
                │  │   │      │
GND ────────────┴──┴───┴──────┴──

Components:
- Y1: Crystal (8MHz, 12MHz, etc.)
- CL1, CL2: Load capacitors (calculate from datasheet)

Load capacitor formula:
CL = (CL1 × CL2) / (CL1 + CL2) + Cstray
Where Cstray ≈ 2-5pF
```

### Reset Circuit with Button

```
VCC
 │
┌┴┐ R1 (10K)
│ │
└┬┘
 ├─────────► MCU_RESET
 │
═╧═ C1 (100nF)
 │
┌┴┐
│ │ SW1 (Reset button)
└┬┘
 │
GND

Notes:
- Active-low reset shown
- C1 provides debouncing
- R1 provides pull-up
- For active-high reset, invert logic
```

### Boot Mode Selection (STM32)

```
VCC                         VCC
 │                           │
┌┴┐ R1 (10K)               ┌┴┐ R2 (10K)
│ │                        │ │
└┬┘                        └┬┘
 ├──► BOOT0                 ├──► BOOT1
 │                          │
═╧═ C1 (100nF)            ═╧═ C2 (100nF)
 │                          │
GND                        GND

Boot modes (STM32F1):
BOOT1  BOOT0  Mode
  X      0    Main Flash (normal)
  0      1    System Memory (bootloader)
  1      1    Embedded SRAM
```

## Interface Circuits

### USB-C with ESD Protection

**Required:** CC resistors (5.1K) for device/UFP mode.
**Required:** ESD protection for USB certification and reliability.
**From design-constraints.json:** Check interfaces for USB requirements.

```
                    ┌─────────────┐
VBUS ───────────────┤ VBUS        │
                    │             │
        ┌───[R]─────┤ CC1    USB  │
        │           │        CONN │
        ├───[R]─────┤ CC2         │
        │           │             │
        │    ┌──────┤ D+          │
        │   ┌┴┐     │             │
USB_DP ─┼───┤ │ESD  │             │
        │   └┬┘     │             │
        │    │      │             │
        │    ├──────┤ D-          │
        │   ┌┴┐     │             │
USB_DM ─┼───┤ │     │             │
        │   └┬┘     │             │
GND ────┴────┴──────┤ GND         │
                    └─────────────┘

Components:
- CC resistors: 5.1K (for UFP/device mode)
- ESD: USBLC6-2SC6 or similar
```

### I2C Pull-ups

**Required:** I2C is open-drain, pull-ups are mandatory.
**Value selection:** Based on bus speed (see table below).
**Voltage:** Pull to highest Vio device on bus (typically 3.3V).

```
VCC
 │
 ├─────┬─────────────────────┐
┌┴┐   ┌┴┐                    │
│ │   │ │ 4.7K-10K           │
│ │   │ │                    │
└┬┘   └┬┘                    │
 │     │                     │
 │     └───► I2C_SCL ◄───┬───┤
 │                       │   │
 └───────► I2C_SDA ◄─────┼───┤
                         │   │
                      [Slave devices]

Pull-up value selection:
- 10K: Standard mode (100kHz)
- 4.7K: Fast mode (400kHz)
- 2.2K: Fast mode plus (1MHz)

Note: Total bus capacitance affects maximum pull-up value
```

### SPI Flash

```
MCU                          Flash
┌───────┐                   ┌───────┐
│   MOSI├───────────────────┤DI     │
│   MISO├───────────────────┤DO     │
│    SCK├───────────────────┤CLK    │
│     CS├───────────────────┤CS     │
│       │                   │       │
│    VCC├───┬───────────────┤VCC    │
│       │  ═╧═ 100nF        │       │
│    GND├───┴───────────────┤GND    │
└───────┘                   └───────┘

Notes:
- Add series resistors (33-100Ω) on data lines for EMI
- Keep traces short
- Decoupling cap close to flash VCC
```

### UART Level Shifter (3.3V to 5V)

```
3.3V                              5V
 │                                 │
 │     ┌───────────────┐          ┌┴┐
 │     │  Q1 (BSS138)  │          │ │10K
 ├─────┤G           D  ├──────────┼┬┘
┌┴┐    │      S        │         │
│ │10K └───────┬───────┘         │
└┬┘            │                 │
 │             │                 │
3V3_TX ────────┴─────────────────┴── 5V_TX

Notes:
- Bidirectional level shifter
- Works for I2C, SPI, UART
- BSS138 or 2N7002 for Q1
```

## LED Circuits

### Status LED

```
GPIO ──────[R]──────┬──►│── GND
                    │   LED
                   ═╧═
                  100nF (optional debounce)

Resistor calculation:
R = (Vgpio - Vf) / If
Example: (3.3V - 2V) / 5mA = 260Ω → use 270Ω

Typical values:
- Red LED: 220-330Ω (Vf ≈ 1.8V)
- Green/Blue LED: 100-220Ω (Vf ≈ 3V)
```

### RGB LED (Common Cathode)

```
VCC
 ├─────┬─────┬─────┐
┌┴┐   ┌┴┐   ┌┴┐    │
│ │   │ │   │ │    │
│R│   │G│   │B│    │
└┬┘   └┬┘   └┬┘    │
 │     │     │     │
 ├─►│──┼─►│──┼─►│──┴── GND (common)
     LED_R  LED_G  LED_B

For common anode: reverse LED direction, connect common to VCC
```

## Protection Circuits

### Reverse Polarity Protection (P-MOSFET)

```
VIN ──┬──────┬──────────► VOUT
      │     ┌┴┐
     ═╧═    │ │ Q1 (P-FET)
   100nF    │ │ Si2301 or similar
      │     └┬┘
      │      │
GND ──┴──────┴──────────► GND

Notes:
- Vgs must exceed threshold when input reversed
- Lower Rds(on) = lower voltage drop
- Add TVS for additional protection
```

### Input Protection (Overvoltage + ESD)

```
VIN ──[R]──┬──[TVS]──┬── Protected_IN
           │         │
          ═╧═       ═╧═
         100nF      GND
           │
          GND

Components:
- R: Current limiting (1K-10K for signal)
- TVS: PESD5V0S1BL or similar
- Cap: Filter high-frequency noise
```
