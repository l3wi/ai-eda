# Layer Count Decision Guide

Quick reference for choosing PCB layer count during the architecture phase.

## Decision Tree

```
START
  │
  ├─ Has switching regulator (buck/boost)? ──YES──► 4-layer minimum
  │
  ├─ Has high-speed signals? ──YES──► 4-layer minimum
  │   (USB 2.0+, Ethernet, HDMI, DDR, PCIe)
  │
  ├─ Has RF/wireless module? ──YES──► 4-layer minimum
  │   (WiFi, BLE, LoRa, cellular)
  │
  ├─ Dense routing (>100 nets)? ──YES──► 4-layer or 6-layer
  │
  ├─ Signal speeds >100MHz? ──YES──► 6-layer
  │   (DDR3/4, PCIe, GbE)
  │
  └─ Simple design, LDO only, low-speed ──► 2-layer OK
```

## Layer Count Summary

| Layers | When to Use | Typical Stackup |
|--------|-------------|-----------------|
| **2** | Simple hobby boards, LDO power, I2C/SPI only | Top-Bottom |
| **4** | Most MCU projects, switching regulators, USB/Ethernet, WiFi/BLE | SIG-GND-PWR-SIG |
| **6** | High-speed digital, DDR memory, dense designs, mixed-signal | SIG-GND-SIG-PWR-GND-SIG |

## 2-Layer: When It Works

**Good for:**
- LED blinkers, simple sensors
- I2C/SPI peripherals (<10MHz)
- LDO-only power (no switching)
- Hobby/learning projects
- Breakout boards

**Avoid if:**
- Any buck/boost converter
- USB (even USB 2.0)
- Ethernet
- WiFi/BLE module
- Motor control with PWM

## 4-Layer: The Safe Default

**Standard stackup: SIG-GND-PWR-SIG**
- Layer 1: Top signals + components
- Layer 2: Solid ground plane
- Layer 3: Power plane(s)
- Layer 4: Bottom signals + components

**Why 4-layer matters:**
- Solid ground plane = low-impedance return paths
- Better EMI performance (signals reference ground)
- Power/ground plane capacitance helps decoupling
- Controlled impedance possible (USB, Ethernet)

**Cost impact:** ~$2-5 more per board at prototype quantities

## 6-Layer: High Performance

**Use when:**
- DDR3/DDR4 memory interface
- PCIe lanes
- Gigabit Ethernet
- Very dense routing
- Mixed analog/digital with isolation needs

**Typical stackup: SIG-GND-SIG-PWR-GND-SIG**
- Allows buried signal layers between planes
- Better shielding for sensitive signals
- More routing channels

## Quick Checklist

Before finalizing layer count, verify:

- [ ] Power topology identified (LDO vs switching)?
- [ ] High-speed interfaces listed?
- [ ] Component count estimated?
- [ ] Board size constraints defined?

## Common Mistakes

| Mistake | Why It's a Problem |
|---------|-------------------|
| 2-layer with buck converter | No solid ground plane = EMI nightmare |
| 2-layer with USB | Can't achieve 90Ω differential impedance |
| Splitting ground plane on 4-layer | Creates return path loops, radiates |
| Power islands instead of plane | Poor decoupling, high inductance |

## Cost-Benefit Summary

| Factor | 2-Layer | 4-Layer | 6-Layer |
|--------|---------|---------|---------|
| PCB cost | Lowest | +$2-5/board | +$5-15/board |
| EMI risk | High | Low | Lowest |
| Routing ease | Hardest | Easier | Easiest |
| First-pass success | Lower | Higher | Highest |
| Rework cost | Potentially high | Lower | Lowest |

**Rule of thumb:** The extra $3-5 for 4-layer often saves $100+ in rework and debug time.
