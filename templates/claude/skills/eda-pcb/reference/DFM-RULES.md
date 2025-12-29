# Design for Manufacturing (DFM) Rules

Guidelines to ensure PCB can be manufactured reliably.

## JLCPCB Capabilities

### Standard Process

| Parameter | Capability | Recommended |
|-----------|------------|-------------|
| Layers | 1-16 | 2 or 4 |
| Min trace width | 0.127mm (5mil) | 0.15mm (6mil) |
| Min trace spacing | 0.127mm (5mil) | 0.15mm (6mil) |
| Min via drill | 0.3mm | 0.3mm |
| Min via pad | 0.5mm | 0.6mm |
| Min annular ring | 0.13mm | 0.15mm |
| Min hole to hole | 0.5mm | 0.5mm |
| Min hole to trace | 0.254mm | 0.3mm |
| Board thickness | 0.4-2.4mm | 1.6mm |
| Copper weight | 1-2oz | 1oz |

### Advanced Process (Higher Cost)

| Parameter | Capability |
|-----------|------------|
| Min trace width | 0.09mm (3.5mil) |
| Min via drill | 0.2mm |
| Min annular ring | 0.075mm |

## Board Outline

### Edge Clearance

| Item | Minimum Distance to Edge |
|------|-------------------------|
| Traces | 0.3mm |
| Vias | 0.3mm |
| Components | 1mm (3mm for wave solder) |
| Copper pour | 0.5mm |
| V-score line | 0.4mm |

### Board Shape

- Rectangular preferred (lowest cost)
- Rounded corners OK (specify radius)
- Complex shapes: Add milling cost
- Internal cutouts: Add milling cost
- Minimum slot width: 0.8mm

### Panelization

If panelizing:
- Tab-routing: 3mm between boards
- V-scoring: 0.4mm keep-out from score line
- Mouse bites: Use 0.5mm holes

## Drill and Via Requirements

### Hole Sizes

| Type | Min Drill | Finished Hole |
|------|-----------|---------------|
| Via | 0.3mm | 0.3mm |
| PTH component | 0.3mm | Drill + 0.1mm tolerance |
| NPTH (mounting) | 0.5mm | As specified |

### Via in Pad

**Without resin fill:** Don't use via in pad (solder wicks through)

**With resin fill:**
- Specify "via in pad" with filled/capped vias
- Additional cost
- Required for BGA and some QFN

### Aspect Ratio

```
Aspect ratio = Board thickness / Drill diameter

Maximum: 10:1

Example: 1.6mm board
- Min drill = 1.6mm / 10 = 0.16mm
- Practical minimum with margin: 0.3mm
```

## Copper Features

### Trace Width

| Design | Minimum | Recommended |
|--------|---------|-------------|
| Standard | 0.127mm | 0.15mm |
| Power | 0.3mm+ | Based on current |
| High-speed | Per impedance | Calculated |

### Copper Pour

- Minimum feature size: 0.127mm
- Thermal relief spoke width: 0.2mm minimum
- Clearance to other copper: 0.127mm minimum
- Remove isolated copper islands (cause acid traps)

### Soldermask Defined vs Copper Defined

**Copper defined (recommended):**
- Pad size = copper size
- Soldermask opening larger than pad
- Better for standard components

**Soldermask defined:**
- Soldermask opening smaller than copper
- Use for BGA, fine-pitch QFN
- More precise pad definition

## Soldermask and Silkscreen

### Soldermask

| Parameter | Specification |
|-----------|--------------|
| Minimum dam | 0.1mm |
| Minimum solder mask bridge | 0.1mm |
| Soldermask expansion | 0.05mm typical |
| Color options | Green, black, white, blue, red |

### Silkscreen

| Parameter | Specification |
|-----------|--------------|
| Minimum line width | 0.15mm |
| Minimum text height | 0.8mm |
| Minimum spacing | 0.15mm |
| Don't place on | Pads, via holes |

**Silkscreen recommendations:**
- Reference designators readable
- Pin 1 / polarity marked
- Board name and revision
- Test points labeled

## Component Footprints

### Pad Size Guidelines

**General rule:** Pad should be 0.5mm longer than lead (0.25mm each end)

| Component | Pad Extension |
|-----------|---------------|
| 0402 | Minimal, per library |
| 0603 | +0.2mm each end |
| 0805+ | +0.3mm each end |
| QFN | Nominal or slightly larger |
| BGA | Per datasheet |

### QFN/DFN Pads

- Add solder paste stencil openings
- Thermal pad: 50-80% paste coverage
- Consider adding thermal vias (if not via-in-pad)
- Ground pad connected to ground plane

### BGA Pads

- Follow manufacturer recommendations exactly
- Via in pad usually required (filled)
- Consider NSMD (non-solder mask defined) pads
- Dogbone routing for large BGA

## Stencil Design

### Paste Apertures

| Component | Paste Ratio |
|-----------|-------------|
| Standard SMD | 100% of pad |
| Fine pitch (< 0.5mm) | 70-90% |
| Large thermal pads | 50-80% (grid pattern) |
| QFN center pad | 50% (grid pattern) |

### Thermal Pad Paste Pattern

```
For large thermal pads, use grid pattern:

┌───┬───┬───┬───┐
│███│   │███│   │
├───┼───┼───┼───┤
│   │███│   │███│
├───┼───┼───┼───┤  ← Each cell ~1mm
│███│   │███│   │
├───┼───┼───┼───┤
│   │███│   │███│
└───┴───┴───┴───┘

50-70% coverage to prevent bridging
```

## File Output Requirements

### Gerber Files (RS-274X)

| File | Layer |
|------|-------|
| *-F_Cu.gbr | Front copper |
| *-B_Cu.gbr | Back copper |
| *-F_Mask.gbr | Front solder mask |
| *-B_Mask.gbr | Back solder mask |
| *-F_SilkS.gbr | Front silkscreen |
| *-B_SilkS.gbr | Back silkscreen |
| *-Edge_Cuts.gbr | Board outline |
| *-F_Paste.gbr | Front paste (for stencil) |
| *-B_Paste.gbr | Back paste (for stencil) |

### Drill Files (Excellon)

| File | Contents |
|------|----------|
| *.drl | Drill file with all holes |
| *-PTH.drl | Plated through holes only |
| *-NPTH.drl | Non-plated holes only |

### Assembly Files

| File | Contents |
|------|----------|
| BOM.csv | Bill of materials |
| CPL.csv | Component placement list |
| Assembly.pdf | Visual assembly guide |

## DFM Checklist

Before sending to manufacturer:

### Board
- [ ] Board outline closed shape
- [ ] Minimum feature sizes met
- [ ] No isolated copper islands
- [ ] Fiducials added (if required)

### Copper
- [ ] Trace widths ≥ minimum
- [ ] Trace spacing ≥ minimum
- [ ] Annular rings ≥ minimum
- [ ] No acid traps (acute angles)

### Holes
- [ ] Via drill ≥ minimum
- [ ] Aspect ratio within limits
- [ ] Hole-to-hole spacing OK
- [ ] Hole-to-trace spacing OK

### Assembly
- [ ] All components have footprints
- [ ] Pad sizes appropriate
- [ ] Component spacing allows rework
- [ ] Silkscreen not on pads

### Files
- [ ] All Gerber layers present
- [ ] Drill file complete
- [ ] BOM matches design
- [ ] Position file accurate
