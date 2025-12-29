# Net Naming Conventions

Consistent net naming improves readability and reduces errors.

## Power Nets

### Voltage Rails
```
VCC_3V3      - 3.3V digital supply
VCC_5V       - 5V supply
VCC_1V8      - 1.8V core supply
VCC_12V      - 12V supply
VBUS         - USB bus voltage (5V from USB)
VBAT         - Battery voltage
VIN          - Input voltage (before regulation)
```

### Analog Power
```
AVCC_3V3     - Analog 3.3V supply
AVDD         - Analog VDD (chip-specific)
VREF         - Voltage reference
```

### Ground
```
GND          - Digital ground (primary)
GNDA         - Analog ground
PGND         - Power ground (high current)
CHASSIS_GND  - Chassis/earth ground
```

## Communication Buses

### SPI
```
SPI1_MOSI    - Master Out Slave In
SPI1_MISO    - Master In Slave Out
SPI1_SCK     - Serial Clock
SPI1_CS      - Chip Select (directly connected)
SPI1_CS_FLASH - Chip Select to Flash IC
SPI1_CS_LCD   - Chip Select to LCD
```

Multiple SPI buses: `SPI1_*`, `SPI2_*`, etc.

### I2C
```
I2C1_SDA     - Serial Data
I2C1_SCL     - Serial Clock
```

Multiple I2C buses: `I2C1_*`, `I2C2_*`, etc.

### UART
```
UART1_TX     - Transmit (from MCU perspective)
UART1_RX     - Receive (from MCU perspective)
UART1_RTS    - Request to Send (optional)
UART1_CTS    - Clear to Send (optional)
```

Note: TX/RX are from the MCU's perspective. When connecting to another device, TX connects to the other device's RX.

### USB
```
USB_DP       - USB D+ (data plus)
USB_DM       - USB D- (data minus)
USB_ID       - USB OTG ID pin
USB_VBUS     - USB power (5V)
```

### CAN
```
CAN1_TX      - CAN Transmit
CAN1_RX      - CAN Receive
CAN_H        - CAN High (on bus side)
CAN_L        - CAN Low (on bus side)
```

### Ethernet
```
ETH_TXP      - Transmit Positive
ETH_TXN      - Transmit Negative
ETH_RXP      - Receive Positive
ETH_RXN      - Receive Negative
ETH_MDC      - Management Data Clock
ETH_MDIO     - Management Data I/O
```

## Control Signals

### Reset
```
MCU_RESET    - Active-high reset
MCU_nRESET   - Active-low reset (n prefix)
PHY_RESET    - Ethernet PHY reset
```

### Enable/Chip Select
```
REG_EN       - Regulator enable
LCD_CS       - LCD chip select
FLASH_CS     - Flash chip select
```

### Boot/Mode
```
BOOT0        - Boot mode pin 0
BOOT1        - Boot mode pin 1
MODE_SEL     - Mode selection
```

## GPIO and User Interface

### Descriptive Names (Preferred)
```
LED_STATUS   - Status LED
LED_POWER    - Power indicator LED
LED_ERROR    - Error indicator LED
BTN_USER     - User button
BTN_RESET    - Reset button
BUZZER       - Buzzer output
```

### Generic GPIO
When function is not yet defined:
```
GPIO_PA0     - Port A, Pin 0
GPIO_PB3     - Port B, Pin 3
IO_EXP_0     - I/O Expander bit 0
```

## Analog Signals

```
ADC_VBAT     - Battery voltage sense
ADC_TEMP     - Temperature sensor input
ADC_CURRENT  - Current sense input
DAC_OUT      - DAC output
AIN0         - Analog input 0
AOUT0        - Analog output 0
```

## Clock Signals

```
CLK_25MHZ    - 25MHz clock
OSC_IN       - Oscillator input
OSC_OUT      - Oscillator output
CLK_ETH      - Ethernet reference clock
```

## Naming Rules

### General Rules
1. Use UPPERCASE for all net names
2. Use underscores to separate words
3. Be descriptive but concise
4. Use consistent numbering (1-based or 0-based, pick one)

### Active-Low Signals
Prefix with `n` or suffix with `_N`:
```
nRESET       - Active-low reset
CS_N         - Active-low chip select
INT_N        - Active-low interrupt
```

### Bus Numbering
When multiple instances exist:
```
SPI1_*       - First SPI bus
SPI2_*       - Second SPI bus
UART1_*, UART2_*, UART3_*
```

### Hierarchical Sheets
For signals that span sheets, use the same name everywhere. The net label creates the connection automatically.

## Anti-Patterns to Avoid

**Don't:**
```
spi_mosi     - lowercase
SPI MOSI     - spaces
SPI-MOSI     - hyphens
D+           - special characters
PIN23        - meaningless names
```

**Do:**
```
SPI1_MOSI    - clear, consistent
USB_DP       - descriptive
MCU_PA5_LED  - shows purpose and pin
```

## Quick Reference Table

| Category | Format | Example |
|----------|--------|---------|
| Power | `VCC_Xv` | `VCC_3V3` |
| Ground | `GND[A/P]` | `GND`, `GNDA` |
| SPI | `SPIn_SIGNAL` | `SPI1_MOSI` |
| I2C | `I2Cn_SIGNAL` | `I2C1_SDA` |
| UART | `UARTn_SIGNAL` | `UART1_TX` |
| USB | `USB_SIGNAL` | `USB_DP` |
| GPIO | `GPIO_PXn` or descriptive | `LED_STATUS` |
| Reset | `TARGET_[n]RESET` | `MCU_nRESET` |
