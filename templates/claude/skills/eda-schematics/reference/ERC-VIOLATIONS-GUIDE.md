# ERC Violations Guide

Common Electrical Rules Check (ERC) errors in KiCad and how to fix them.

## Quick Reference

| Error Type | Common Cause | Quick Fix |
|------------|--------------|-----------|
| Unconnected pin | Missing wire | Connect or mark NC |
| Power pin not driven | No power flag | Add power flag symbol |
| Conflicting outputs | Two outputs on one net | Check connections |
| Input not driven | Floating input | Add pull-up/down or connect |
| Different net types | Power vs signal mismatch | Use correct pin types |

## ERC Error Categories

### 1. Unconnected Pins

**Error:** "Pin X is unconnected"

**Causes:**
- Wire not reaching pin
- Net label not matching
- Genuinely unused pin

**Solutions:**

#### Option A: Connect the pin
```
[IC Pin]────────────[Destination]
        Wire reaches pin
```

#### Option B: Mark as no-connect
For intentionally unused pins:
```
[IC Pin]──X  (no-connect symbol)
```
In KiCad: Place > No Connect (or press 'Q')

#### Option C: Check net labels
```
BAD:                          GOOD:
[IC] VCC_3V3────              [IC] VCC_3V3────
                   (floating)            └──VCC_3V3 (global label)
```

**Decision tree:**
```
Pin unconnected?
  │
  ├─ Intentionally unused? ──► Add no-connect symbol
  │
  ├─ Should be powered? ──► Connect to power rail
  │
  └─ Should be signal? ──► Trace wire path, fix break
```

---

### 2. Power Pin Not Driven

**Error:** "Power pin not driven by any power output"

**Cause:** Power rail exists but no power source symbol.

**Solution:** Add power flag or power output symbol.

**KiCad power symbols:**

| Symbol | Type | Usage |
|--------|------|-------|
| PWR_FLAG | Power flag | Marks net as powered |
| VCC | Power input | Generic power |
| +3.3V | Power input | 3.3V rail |
| GND | Power input | Ground |

**Correct pattern:**
```
                    PWR_FLAG
                       │
REGULATOR_OUT ─────────┼───────── VCC_3V3 (to ICs)
                       │
                     VCC_3V3
                  (power symbol)
```

**When to use PWR_FLAG:**
- Power coming from off-board (connector)
- Power from an IC output (regulator)
- Any net that provides power but isn't a symbol

---

### 3. Conflicting Outputs

**Error:** "Conflict between output pins on net"

**Cause:** Two or more output pins connected together.

**Scenarios:**

#### Actual mistake
```
BAD:
[MCU] TX ────┬──────────
             │
[MCU] GPIO ──┘          Two outputs driving same net
```
Fix: Check schematic logic, separate the signals.

#### Push-pull to open-drain
```
[IC1] OUT ───┬─── Net
             │
[IC2] OUT ───┘

If both are push-pull: PROBLEM
If one is open-drain: OK (but may still warn)
```
Fix: Verify one output is open-drain, or add isolation.

#### Legitimate bus sharing
For buses where multiple devices share:
- Use tri-state outputs
- Add bus transceivers
- Use wired-OR/AND logic with appropriate pull resistors

---

### 4. Input Not Driven

**Error:** "Input pin not driven"

**Cause:** Input has no defined logic level.

**Solutions:**

#### Add pull-up
```
VCC
 │
┌┴┐ 10K
│ │
└┬┘
 │
 └────[Input Pin]
```

#### Add pull-down
```
[Input Pin]────┬───
               │
              ┌┴┐ 10K
              │ │
              └┬┘
               │
              GND
```

#### Connect to source
Trace back and ensure driver exists.

**Common floating inputs to check:**
- Reset pins
- Enable pins
- Chip select lines
- Configuration pins (BOOT0, etc.)
- Unused CMOS inputs

---

### 5. Different Net Types Connected

**Error:** "Connecting power output to power input" (or similar)

**Cause:** KiCad tracks electrical types. Some combinations warn.

**Pin types in KiCad:**

| Type | Description | Example |
|------|-------------|---------|
| Input | Signal input | Data inputs |
| Output | Signal output | Data outputs |
| Bidirectional | Both | I2C SDA |
| Tri-state | High-Z capable | Bus data |
| Passive | No direction | Resistors, caps |
| Power input | Needs power | IC VCC pins |
| Power output | Provides power | Regulator output |
| Open collector | Pull-up required | INT pins |
| Open emitter | Pull-down required | Rare |

**ERC matrix (simplified):**

|  | Input | Output | Bidir | Power In | Power Out |
|--|-------|--------|-------|----------|-----------|
| Input | OK | OK | OK | Warn | Warn |
| Output | OK | ERROR | OK | Warn | ERROR |
| Bidir | OK | OK | OK | Warn | Warn |
| Power In | Warn | Warn | Warn | OK | OK |
| Power Out | Warn | ERROR | Warn | OK | ERROR |

**Common fixes:**
- Regulator output to power net: Add PWR_FLAG
- Multiple power outputs: Check design (one source per rail)
- Power to signal mismatch: Verify connections

---

### 6. Net Label Mismatches

**Error:** "Label 'X' on net 'Y'"

**Cause:** Same net label defined differently, or typo.

**Example:**
```
BAD:
Sheet 1: VCC_3V3 ────────────
Sheet 2: VCC_3.3V ────────────  (Different labels = different nets!)
```

**Fix:**
Use consistent naming. Search for similar labels.

**Prevention:**
- Follow `NET-NAMING.md` conventions
- Use global labels for power
- Copy labels instead of retyping

---

### 7. Hierarchical Sheet Issues

**Error:** "Sheet pin X has no matching hierarchical label"

**Cause:** Sheet pin on parent doesn't match label in child.

**Correct structure:**
```
Parent sheet:                 Child sheet:
┌───────────────┐            ┌───────────────┐
│   Child       │            │               │
│  ┌─────────┐  │            │ ┌───────────┐ │
│  │  SIG_A ─┼──┼───         │ │ SIG_A     │ │
│  │  SIG_B ─┼──┼───         │ │ SIG_B     │ │
│  └─────────┘  │            │ └───────────┘ │
└───────────────┘            └───────────────┘

Sheet pins must exactly match hierarchical labels
```

**Fix:** Verify label names match exactly (case-sensitive).

---

### 8. Duplicate References

**Error:** "Duplicate reference: R1"

**Cause:** Two components have same reference designator.

**Fix:**
- Annotate schematic (Tools > Annotate Schematic)
- Or manually renumber duplicate

---

## Systematic ERC Debugging

### Step 1: Categorize Errors

Group errors by type:
1. Critical (must fix): Output conflicts, shorts
2. Important (should fix): Undriven inputs, floating pins
3. Warnings (review): Type mismatches, style issues

### Step 2: Fix Critical First

```
Priority:
1. Output-output conflicts ──► Check logic
2. Short circuits ──► Trace net connections
3. Missing power ──► Add power flags
```

### Step 3: Address Remaining

```
4. Floating inputs ──► Add pull-up/down
5. Unconnected pins ──► Connect or mark NC
6. Type mismatches ──► Verify pin types in symbol
```

### Step 4: Verify Clean

```
ERC Result: 0 Errors, 0 Warnings
            ↑
            Goal before layout
```

---

## ERC Settings in KiCad

### Adjusting Severity

Some warnings can be downgraded if understood:
- Schematic Setup > Electrical Rules
- Set specific combinations to Ignore/Warning/Error

**Careful:** Don't ignore real problems.

### Common Adjustments

| Rule | Default | May Adjust |
|------|---------|------------|
| Power pin not driven | Error | Keep as Error |
| Unconnected pin | Warning | Keep as Warning |
| Different net names | Warning | Depends |
| Similar labels | Warning | May Ignore |

---

## Common ERC Patterns

### Power Connector Pattern
```
     PWR_FLAG
        │
VIN ────┼───────── VCC_IN
        │
    [Connector]
        │
       GND
        │
     PWR_FLAG
```

### Enable Pin Pattern
```
VCC
 │
┌┴┐ 10K (default on)
│ │
└┬┘
 │
 └────[EN Pin]────[Optional: to MCU GPIO]
```

### Reset Pin Pattern
```
VCC
 │
┌┴┐ 10K
│ │
└┬┘
 ├────[RESET Pin]
 │
═╧═ 100nF (debounce)
 │
┌┴┐
│ │ [Reset button]
└┬┘
 │
GND
```

---

## Quick Checklist

Before expecting clean ERC:

- [ ] All power nets have power symbols or PWR_FLAG
- [ ] All unused pins marked with no-connect
- [ ] All inputs have defined levels
- [ ] Net labels are consistent (no typos)
- [ ] Hierarchical labels match sheet pins
- [ ] Reference designators are unique
- [ ] No unintended output conflicts
