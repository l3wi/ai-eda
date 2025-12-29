# JLC Search Tips

Effective strategies for finding components on JLC/JLCPCB.

## Search Strategies

### By Part Number
Most precise method:
```
mcp__jlc__component_search("AMS1117-3.3")
mcp__jlc__component_search("STM32F103C8T6")
```

### By Category + Specs
For discovery:
```
mcp__jlc__component_search("LDO 3.3V 1A SOT-223")
mcp__jlc__component_search("ESP32 module")
mcp__jlc__component_search("100nF 0402 capacitor")
```

### By LCSC Number
Direct lookup:
```
mcp__jlc__component_get("C6186")
```

## Part Number Patterns

### Capacitors
- `CC0402KRX7R8BB104` → 0402, X7R, 100nF (104)
- Last 3 digits: 104 = 10×10⁴ = 100,000pF = 100nF
- Common values: 100 (10pF), 101 (100pF), 102 (1nF), 103 (10nF), 104 (100nF), 105 (1µF)

### Resistors
- `RC0402FR-0710KL` → 0402, 1%, 10K
- Common suffixes: K (kilo), M (mega), R (ohms)
- 10K, 4K7, 100R, 1M

### Regulators
- `AMS1117-3.3` → 3.3V output
- `AP2112K-3.3TRG1` → 3.3V, K package variant
- Voltage usually in part number

### MCUs
- `STM32F103C8T6` → STM32 F1 series, 64KB Flash, LQFP48
- `ESP32-C3-MINI-1` → ESP32-C3, module form factor
- `RP2040` → Raspberry Pi microcontroller

## Filtering Results

### By Stock Status
- Always check `in_stock: true`
- Prefer parts with > 1000 in stock
- Avoid parts showing "7-day lead time"

### By Package
Common SMD sizes (imperial):
- 0201 - Very small, machine assembly only
- 0402 - Small, fine-pitch capable
- 0603 - Standard for most designs
- 0805 - Easy hand soldering
- 1206 - Large, high power

### By Price Breaks
Check pricing at your quantity:
- 1-9 pcs: Prototype pricing
- 10-99 pcs: Small batch
- 100+: Production pricing

## JLCPCB Assembly Categories

### Basic Parts
- Lower assembly fee
- Always in stock at JLCPCB
- Standard passives, common ICs
- **Prefer these when possible**

### Extended Parts
- Higher assembly fee (~$3 per unique part)
- May have stock issues
- Specialty components

### Identifying Basic Parts
LCSC doesn't directly label this, but:
- Very common values (10K, 100nF, etc.) are usually basic
- Check JLCPCB parts library for confirmation
- Standard packages more likely to be basic

## Common Component Searches

### Power
```
"LDO 3.3V SOT-23"
"LDO 3.3V 500mA"
"buck converter 5V 3A"
"AMS1117" (popular LDO series)
"AP2112" (low-dropout LDO)
"MP1584" (popular buck)
```

### MCU
```
"STM32F103" (popular STM32)
"STM32G0" (newer, cheaper STM32)
"ESP32-C3 module"
"RP2040"
"ATmega328P"
```

### Connectivity
```
"ESP32 module WiFi"
"W5500" (Ethernet controller)
"CH340G" (USB-UART)
"CP2102" (USB-UART)
```

### Passives
```
"100nF 0402 X7R"
"10uF 0805 ceramic"
"10K 0402 1%"
"ferrite bead 0603"
```

### Connectors
```
"USB-C 16pin"
"JST-SH 4pin"
"2.54mm header"
"barrel jack 5.5mm"
```

## Troubleshooting

### No Results
- Try shorter search terms
- Remove specific specs, add back one at a time
- Search by category first, then filter
- Check spelling of part numbers

### Too Many Results
- Add package size
- Add voltage/value
- Add manufacturer name
- Use more specific part number

### Part Not Available
- Search for equivalent/compatible parts
- Check alternate manufacturers
- Consider different package
- Look for drop-in replacements
