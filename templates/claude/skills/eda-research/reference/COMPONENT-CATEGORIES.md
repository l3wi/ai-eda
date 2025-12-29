# Component Categories

Standard role names and typical requirements for each category.

## Power Components

### `regulator-Xv` (e.g., regulator-3v3, regulator-5v)
Linear or switching regulator for voltage rail.

**Typical options:**
| Type | Example | Use case |
|------|---------|----------|
| LDO | AMS1117, AP2112 | Low current, low noise |
| Buck | MP1584, TPS562200 | High efficiency, >100mA |
| Boost | MT3608 | Step-up voltage |
| Buck-Boost | TPS63000 | Battery applications |

**Key specs:** Input range, output current, dropout, efficiency

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

**Specs:** Low capacitance, TVS clamping

### `esd-io`
General I/O ESD protection.

**Typical:** TPD4E001, PESD5V0S1BL

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
