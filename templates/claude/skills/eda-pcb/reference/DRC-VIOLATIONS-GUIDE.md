# DRC Violations Guide

Common Design Rules Check (DRC) errors in KiCad PCB layout and how to fix them.

## Quick Reference

| Error Type | Common Cause | Quick Fix |
|------------|--------------|-----------|
| Clearance violation | Traces/pads too close | Increase spacing or reroute |
| Track width | Trace too narrow | Widen trace or adjust rules |
| Annular ring | Pad copper too small | Increase pad size |
| Silk on pad | Silkscreen overlaps copper | Move silkscreen |
| Unconnected items | Missing trace/via | Complete the route |
| Courtyard overlap | Components too close | Move components apart |
| Via drill too small | Via undersized | Increase via drill |

## DRC Error Categories

### 1. Clearance Violations

**Error:** "Clearance constraint: X (Y clearance Z)"

**Cause:** Two copper features are closer than the design rule allows.

**Types:**
- Trace to trace
- Trace to pad
- Trace to via
- Pad to pad
- Via to via
- Copper to board edge

**Solutions:**

#### Option A: Reroute the trace
```
BAD:                          GOOD:
═══════════════              ═══════════════
    ║  ← too close              ║
═══════════════              ═══════════════
                                 ║
                             ═══════════════
```

#### Option B: Adjust the route path
Move the trace to avoid the congested area:
```
         ║                         ║
    ╔════╬════╗                ╔═══╩═══╗
    ║    ║    ║      →         ║       ║
    ║    ║    ║                ║       ║
```

#### Option C: Use different layers
Route conflicting traces on different layers with vias.

**Decision tree:**
```
Clearance violation?
  │
  ├─ Enough space elsewhere? ──► Reroute trace
  │
  ├─ Congested area? ──► Use different layer
  │
  ├─ Near pad/via? ──► Neck-down trace briefly
  │
  └─ Design rule too strict? ──► Review DFM requirements
```

---

### 2. Track Width Violations

**Error:** "Track width: minimum X, actual Y"

**Cause:** Trace is narrower than design rule minimum.

**Common scenarios:**

#### Auto-router created thin trace
Review and manually route with correct width.

#### Necked-down intentionally
If intentional for breakout, verify manufacturer can produce it.

#### Current-carrying trace too thin
Use ROUTING-RULES.md current table to size properly.

**Fix:** Select trace, change width property, or delete and reroute.

**KiCad:** Select trace segment > Properties > Width

---

### 3. Annular Ring Violations

**Error:** "Annular ring: minimum X, actual Y"

**Cause:** The copper ring around a drill hole is too small.

```
                    Drill hole
                        │
              ┌─────────▼─────────┐
              │    ┌───────┐     │
              │    │       │     │  ← Annular ring
              │    │   ○   │     │     (copper around hole)
              │    │       │     │
              │    └───────┘     │
              └───────────────────┘
                      Pad
```

**Solutions:**

#### Increase pad size
```
Original:        Fixed:
  ┌───┐          ┌─────┐
  │ ○ │    →     │  ○  │
  └───┘          └─────┘
  Too small      Adequate ring
```

#### Decrease drill size
Only if hole doesn't need to be that large.

#### Use teardrops
Add teardrops to increase copper where trace meets pad:
```
Without teardrop:      With teardrop:
═══════════●          ═══════<●
           (weak)            (stronger)
```

**JLCPCB requirements:**
| Copper Weight | Min Annular Ring |
|---------------|------------------|
| 1oz | 0.13mm |
| 2oz | 0.2mm |

---

### 4. Silk on Pad Violations

**Error:** "Silkscreen over pad"

**Cause:** Silkscreen artwork overlaps exposed copper.

**Problem:** Silkscreen ink on pads causes:
- Poor solder joints
- Cosmetic issues
- Assembly failures

**Solutions:**

#### Move silkscreen
Reposition reference designator or graphic.

#### Resize silkscreen
Make text smaller to fit between pads.

#### Remove from pad area
Use keepout for silkscreen over pad region.

**Best practice:**
```
BAD:                    GOOD:
┌───┐ R1 ┌───┐         ┌───┐   ┌───┐
│ █ │ overlaps │ █ │        │ █ │ R1 │ █ │
└───┘    └───┘         └───┘   └───┘
   Silk on pad          Silk between pads
```

---

### 5. Unconnected Items

**Error:** "Unconnected items: N nets have unrouted connections"

**Cause:** Schematic connections not completed in layout.

**Types:**
- Missing trace
- Missing via (when crossing layers)
- Ratsnest line visible

**Solutions:**

#### Complete the route
Follow the ratsnest line and route the trace.

#### Check net assignment
Verify copper features belong to correct net.

#### Verify schematic
Net may have been intentionally disconnected.

**Decision tree:**
```
Unconnected net?
  │
  ├─ Ratsnest visible? ──► Route the trace
  │
  ├─ Hidden under component? ──► Add via, route on back
  │
  ├─ Intentionally unconnected? ──► Verify schematic
  │
  └─ Multiple pads for same net? ──► May need star routing
```

---

### 6. Courtyard Overlap

**Error:** "Courtyard overlap: X with Y"

**Cause:** Component courtyards (body outlines) intersect.

**Problem:** Physical components may collide or interfere.

**Solutions:**

#### Move components apart
Increase spacing until courtyards don't overlap.

#### Check if actually OK
Some components CAN overlap courtyard:
- Through-hole pin under SMD
- Component on opposite side of board
- Designed for stacking

#### Adjust courtyard
If library courtyard is oversized, can adjust (carefully).

**Minimum spacing guidelines:**
| Scenario | Minimum Gap |
|----------|-------------|
| Same-side SMD | 0.2mm |
| Same-side through-hole | 0.5mm |
| Opposite sides | May overlap |
| Tall components | Check height clearance |

---

### 7. Via/Drill Violations

**Error:** "Via drill too small" or "Hole size out of range"

**Cause:** Via or drill doesn't meet DFM requirements.

**Solutions:**

#### Increase via drill
Select via, change drill property.

#### Use appropriate via type
| Via Type | Min Drill | Use Case |
|----------|-----------|----------|
| Standard | 0.3mm | General routing |
| Small | 0.2mm | Dense routing (extra cost) |
| Micro | 0.1mm | HDI only |

#### Check aspect ratio
```
Aspect ratio = Board thickness / Drill diameter
Maximum typically 10:1

1.6mm board → Min drill = 0.16mm
           → Practical: 0.3mm
```

---

### 8. Copper Pour Issues

**Error:** "Isolated copper island" or "Copper pour clearance"

**Cause:** Copper pour created isolated areas or clearance violations.

**Types:**

#### Isolated copper
Small copper fragments not connected to any net.

```
Problem:
┌──────────────┐
│ GND          │
│    ┌────┐    │
│    │████│    │ ← Isolated island (bad)
│    └────┘    │
│              │
└──────────────┘
```

**Fix:** Increase clearance or manually remove islands.

#### Thermal relief issues
Pads may not connect properly to pour.

**Fix:** Check thermal relief settings, ensure spokes connect.

#### Clearance to other copper
Pour too close to traces/pads.

**Fix:** Increase pour clearance in properties.

---

### 9. Edge Clearance Violations

**Error:** "Item too close to board edge"

**Cause:** Copper, hole, or component too close to board outline.

**Minimum edge clearances (JLCPCB):**
| Item | Minimum |
|------|---------|
| Traces | 0.3mm |
| Vias | 0.3mm |
| Components | 1mm |
| V-cut | 0.4mm |

**Fix:** Move items away from edge or adjust board outline.

---

### 10. Netlist Mismatches

**Error:** "Footprint has different net than schematic"

**Cause:** PCB doesn't match current schematic.

**Solutions:**

#### Update PCB from schematic
KiCad: Tools > Update PCB from Schematic

#### Check for manual net edits
Verify you didn't accidentally change net assignments.

#### Resolve footprint changes
If footprint was swapped, update properly.

---

## Systematic DRC Debugging

### Step 1: Categorize Errors

Group by severity:
1. **Critical (must fix):** Shorts, unconnected nets, DFM violations
2. **Important (should fix):** Clearance, annular ring, silk issues
3. **Warnings (review):** Courtyard overlaps, edge clearance

### Step 2: Fix Critical First

```
Priority:
1. Unconnected nets ──► Route or verify intentional
2. Clearance violations ──► Reroute
3. DFM violations ──► Resize features
```

### Step 3: Address Remaining

```
4. Annular ring ──► Increase pad or add teardrop
5. Silk issues ──► Move text
6. Courtyard ──► Move components or verify OK
```

### Step 4: Verify Clean

```
DRC Result: 0 Errors, 0 Warnings
            ↑
            Goal before manufacturing
```

---

## DRC Settings in KiCad

### Accessing DRC Settings

Board Setup > Design Rules > Constraints

### Key Parameters to Set

| Parameter | JLCPCB Standard | JLCPCB Advanced |
|-----------|-----------------|-----------------|
| Min track width | 0.127mm | 0.09mm |
| Min clearance | 0.127mm | 0.09mm |
| Min via drill | 0.3mm | 0.2mm |
| Min via diameter | 0.5mm | 0.35mm |
| Min annular ring | 0.13mm | 0.075mm |
| Min hole-to-hole | 0.5mm | 0.5mm |

### Creating Net Classes

For different requirements (power, signal, high-speed):

1. Board Setup > Net Classes
2. Add class (e.g., "Power")
3. Set track width, clearance, via size
4. Assign nets to class

---

## Common DRC Patterns and Fixes

### BGA Breakout Pattern
```
Fan-out with proper via spacing:
     ○ ○ ○ ○
    ┌─┼─┼─┐
    │ │ │ │   Vias between pads
    └─┼─┼─┘   with adequate clearance
     ○ ○ ○ ○
```

### Dense QFN Routing
```
Trace routing from fine-pitch QFN:
     ═══════╗
  ┌─────────╢  Neck-down to pass
  │ [QFN]   ║  between pads
  └─────────╢
     ═══════╝
```

### Power Trace with Via Stitching
```
Wide power trace with thermal vias:
╔═══════○═══════○═══════╗
║       ●       ●       ║  ● = Via to ground plane
╚═══════○═══════○═══════╝  ○ = Via for power
```

---

## Quick Checklist

Before expecting clean DRC:

- [ ] All nets routed (no ratsnest lines)
- [ ] Clearances meet DFM requirements
- [ ] Via drill sizes adequate
- [ ] Annular rings sufficient
- [ ] No silkscreen on pads
- [ ] No isolated copper islands
- [ ] Board edge clearances met
- [ ] Courtyard overlaps reviewed
- [ ] Thermal reliefs connecting properly
- [ ] Netlist matches schematic

---

## Integration with Upstream

### From design-constraints.json

Load these values to set DRC rules:
```json
{
  "board": {
    "layers": 2,
    "thickness": 1.6
  },
  "dfmTargets": {
    "manufacturer": "JLCPCB",
    "minTraceWidth": 0.15,
    "minClearance": 0.15,
    "minViaDrill": 0.3
  }
}
```

### Before Layout

Verify schematic passed ERC (see ERC-VIOLATIONS-GUIDE.md).

### After DRC Clean

Proceed to manufacturing prep (see DFM-RULES.md).
