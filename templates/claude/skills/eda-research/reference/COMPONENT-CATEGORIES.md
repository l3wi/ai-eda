# Component Categories

Standard role names and typical requirements for each category.

**Selection Guides:**
- Power components: See `REGULATOR-SELECTION.md`
- Passives: See `PASSIVE-SELECTION.md` and `DECOUPLING-STRATEGY.md`
- Alternatives: See `COMPONENT-ALTERNATIVES.md`

## Power Components

### `regulator-Xv` (e.g., regulator-3v3, regulator-5v)
Linear or switching regulator for voltage rail.

**See `REGULATOR-SELECTION.md` for detailed selection criteria.**

**Typical options:**
| Type | Example | Use case |
|------|---------|----------|
| LDO | AMS1117, AP2112 | Low current, low noise |
| Buck | MP1584, TPS562200 | High efficiency, >100mA |
| Boost | MT3608 | Step-up voltage |
| Buck-Boost | TPS63000 | Battery applications |

**Key specs:** Input range, output current, dropout, efficiency

**Selection criteria:**
- Check architecture decision (LDO vs buck from design-constraints.json)
- Calculate power dissipation, verify thermal budget
- Consider noise requirements for analog rails
- Verify dropout voltage for low input scenarios

### `power-input`
Input power handling and protection.

**Components:**
- Connector (USB-C, barrel jack)
- Reverse polarity protection (MOSFET, diode)
- Input capacitors
- Fuse or PTC

### `battery-charger`
Li-ion/LiPo charging IC.

**Typical:** TP4056, MCP73831, BQ24072

**Key specs:** Charge current, cell chemistry, thermal regulation

---

## Processing

### `mcu`
Main microcontroller.

**Common families:**
| Family | Strengths |
|--------|-----------|
| STM32F0/G0 | Low cost, good peripherals |
| STM32F1/F4 | Performance, ecosystem |
| STM32L0/L4 | Low power |
| ESP32 | WiFi/BLE built-in |
| RP2040 | Dual core, low cost |
| ATmega | Simple, Arduino compatible |
| nRF52 | BLE, ultra-low power |

**Key specs:** Flash, RAM, peripherals, power consumption

### `crystal`
External crystal or oscillator for MCU.

**Types:**
- Crystal - Needs load capacitors, MCU internal oscillator
- Oscillator - Complete clock source, more accurate

**Key specs:** Frequency, load capacitance, ppm accuracy

**Load capacitor calculation (for crystals):**
```
CL = (C1 × C2) / (C1 + C2) + Cstray

For symmetric (C1 = C2 = C):
C = 2 × (CL - Cstray)

Where:
- CL = Crystal load capacitance (from crystal datasheet)
- Cstray = PCB + IC parasitic (~3-5pF)
```

**Example:** Crystal with CL=12pF, Cstray=4pF → C = 2×(12-4) = 16pF → Use 15pF C0G caps

**Important:** Use C0G/NP0 capacitors for crystal load caps (see `PASSIVE-SELECTION.md`).

---

## Connectivity

### `usb-interface`
USB connectivity components.

**Components:**
- USB-C/Micro connector
- ESD protection (USBLC6-2)
- Series resistors (if needed)
- USB-UART bridge (CH340, CP2102)

### `ethernet-phy`
Ethernet physical layer.

**Components:**
- PHY IC (LAN8720, W5500)
- Magnetics/transformer
- RJ45 connector (often integrated)
- ESD protection

### `wifi-module`
WiFi/BLE module.

**Options:**
- ESP32-WROOM/WROVER modules
- ESP32-C3-MINI
- ESP8266 modules

### `lora-module`
LoRa radio module.

**Options:**
- SX1276/78 based modules
- E32 series (Ebyte)
- RFM95/96

---

## Protection

### `esd-usb`
USB ESD protection.

**Typical:** USBLC6-2SC6, TPD2E001

**Key specs:** Low capacitance, TVS clamping voltage

**Selection criteria:**
| Spec | USB 2.0 Requirement |
|------|---------------------|
| Line capacitance | < 3pF per line |
| Clamping voltage | < 12V |
| ESD rating | ±15kV HBM minimum |

**Trade-off:** Lower capacitance = less protection, higher capacitance = signal integrity issues

### `esd-io`
General I/O ESD protection.

**Typical:** TPD4E001, PESD5V0S1BL

**Selection criteria:**
- Match clamping voltage to signal voltage (Vclamp > Vmax signal)
- Consider line capacitance for high-speed signals
- Multi-channel devices reduce BOM count

### `fuse`
Overcurrent protection.

**Types:**
- PTC resettable fuse
- SMD fuse (one-time)

---

## Passives

### `decoupling-bulk`
Bulk decoupling capacitors.

**Typical:** 10µF-100µF ceramic or electrolytic
**Placement:** Near power input

### `decoupling-bypass`
High-frequency bypass capacitors.

**Typical:** 100nF ceramic per power pin
**Placement:** As close to IC as possible

### `resistor-*`
Various resistors.

**Categories:**
- `resistor-pullup` - I2C, reset lines
- `resistor-led` - LED current limiting
- `resistor-sense` - Current sensing
- `resistor-divider` - Voltage dividers

---

## Indicators

### `led-status`
Status indicator LED.

**Typical:** 0603 or 0402 SMD LED
**Colors:** Green (power), Red (error), Blue (activity)
**Current:** 1-5mA typical

### `led-power`
Power indicator LED.

**Considerations:** Low current for battery designs

---

## Sensors

### `sensor-temperature`
Temperature measurement.

**Types:**
| Type | Example | Accuracy |
|------|---------|----------|
| Thermistor | NTC 10K | ±1°C |
| Digital | DS18B20 | ±0.5°C |
| I2C | TMP102, MCP9808 | ±0.25°C |

### `sensor-humidity`
Humidity + temperature.

**Typical:** SHT31, DHT22, BME280

### `sensor-imu`
Accelerometer/gyroscope.

**Typical:** MPU6050, LSM6DS3, BMI160

### `sensor-pressure`
Barometric pressure.

**Typical:** BMP280, BMP390, LPS22

---

## Connectors

### `connector-debug`
Programming/debug header.

**Types:**
- SWD: 10-pin ARM standard or minimal 4-pin
- JTAG: 20-pin standard
- UART: 3-4 pin header

### `connector-power`
Power input connector.

**Types:**
- USB-C (recommended for new designs)
- USB Micro-B
- Barrel jack (5.5×2.1mm typical)
- JST-PH (batteries)
- Screw terminal

### `connector-expansion`
General purpose headers.

**Types:**
- 2.54mm pitch (breadboard compatible)
- 1.27mm pitch (compact)
- JST-SH (small signals)

---

## Role Naming Convention

Format: `category-qualifier`

Examples:
- `regulator-3v3` - 3.3V regulator
- `regulator-5v-buck` - 5V buck converter
- `sensor-temp-i2c` - I2C temperature sensor
- `connector-usb-c` - USB-C connector
- `led-status-green` - Green status LED
- `esd-usb` - USB ESD protection

Use descriptive qualifiers that indicate:
- Voltage (3v3, 5v, 12v)
- Interface (i2c, spi, uart)
- Function (status, power, debug)
- Type (ldo, buck, boost)
