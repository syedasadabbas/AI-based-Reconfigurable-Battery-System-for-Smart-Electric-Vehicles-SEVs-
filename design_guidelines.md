# Battery Configuration Simulator - Design Guidelines

## Design Approach

**Selected Framework:** Carbon Design System (IBM) - chosen for its data-dense, technical interface patterns perfect for engineering simulators

**Core Principles:**
- Technical precision with clean data hierarchy
- Dark-mode engineering aesthetic with high-contrast data points
- Dashboard-style layouts with modular information panels
- Functional animations that communicate system states

## Core Design Elements

### A. Color Palette

**Dark Mode Primary (Technical Console Theme):**
- Background: 220 15% 8% (deep navy-charcoal base)
- Surface: 220 12% 12% (elevated panels)
- Surface Raised: 220 10% 16% (cards, modals)
- Border: 220 10% 24% (dividers, outlines)

**Accent Colors:**
- Primary: 210 100% 55% (electric blue - active states, primary actions)
- Success: 142 70% 45% (voltage optimal)
- Warning: 38 92% 50% (voltage threshold)
- Danger: 0 84% 60% (voltage critical)
- Info: 195 100% 50% (cyan - data highlights)

**Data Visualization:**
- Graph Lines: 210 100% 65%, 142 70% 55%, 38 92% 60%
- Grid Lines: 220 10% 20% (subtle)

### B. Typography

**Fonts:**
- Primary: 'IBM Plex Mono' (technical data, metrics, code-like elements)
- Secondary: 'IBM Plex Sans' (UI labels, descriptions)

**Hierarchy:**
- Display (Page Headers): Plex Sans Semibold 2.5rem
- Section Headers: Plex Sans Medium 1.5rem
- Data Labels: Plex Mono Regular 0.875rem
- Metrics/Values: Plex Mono Medium 1.25rem
- Body: Plex Sans Regular 0.9375rem

### C. Layout System

**Spacing Primitives:** Tailwind units of 1, 2, 4, 6, 8 for tight technical layouts
- Component padding: p-4 to p-6
- Section gaps: gap-4, gap-6
- Panel margins: m-2, m-4

**Grid Structure:**
- Dashboard layout: 12-column CSS Grid
- Sidebar panels: 320px fixed width
- Main content: flex-1 responsive

### D. Component Library

**Core UI Elements:**

*Navigation:*
- Top app bar: Dark surface with technical breadcrumbs, config selector, system status indicators
- Side panel: Collapsible configuration tree with nested battery parameters

*Data Panels:*
- Stat Cards: Raised surface with large metric value, label, mini trend indicator, border-l-4 with status color
- Configuration Display: Tabular layout with monospace values, unit labels, real-time update pulses
- Graph Container: Dark background, gridded canvas, multi-line charts with legend, zoom/pan controls

*Controls:*
- Playback Bar: Centered control group (play/pause, step forward/back, speed selector), timeline scrubber with voltage markers
- Parameter Sliders: Inline value display, tick marks, instant visual feedback
- Action Buttons: Primary (filled blue), Secondary (outline with blue border), Icon buttons (ghost style)

**Car Simulation Page Components:**

*Layout Structure:*
```
[Top Bar: Config Info | Current Voltage | Progress]
[Main Area - 2 Columns]
  Left: Simulation Canvas (70%)
    - Animated 2D car on terrain
    - Road profile visualization below
  Right: Data Panel (30%)
    - Voltage Requirements List
    - Real-time Metrics Stack
    - Terrain Analysis
[Bottom: Playback Controls]
```

*Simulation Canvas:*
- 2D side-scroller style visualization
- Car sprite: Simple geometric SUV silhouette (140 80% 45% fill)
- Terrain: Layered path with gradient fills showing elevation (incline: 142 30% 25%, decline: 0 30% 25%)
- Grid overlay: Subtle measurement lines at 10-unit intervals
- Voltage zones: Color-coded sections matching current requirements

*Road Profile Display:*
- Mini elevation chart below main canvas
- X-axis: Distance markers
- Y-axis: Elevation change
- Active segment: Highlighted with primary blue
- Future segments: Dimmed at 40% opacity

*Data Visualization Panels:*
- Voltage Gauge: Circular progress indicator with current/required values
- Terrain Stack: Vertical list of upcoming patches with icons (→ straight, ↗ incline, ↘ decline, ∿ hill, ↻ turn)
- Performance Metrics: Grid of cards (Speed, Distance, Battery Draw, Efficiency)

*Playback Controls:*
- Center-aligned control bar with 80px icon buttons
- Progress bar: Full-width scrubber with segment markers
- Speed controls: 0.5x, 1x, 2x, 4x toggle buttons
- Reset button: Secondary outline style

### E. Animations

**Functional Only:**
- Car movement: Smooth translate-x transition (0.3s ease)
- Voltage changes: 0.2s color transition on status shifts
- Data updates: Subtle scale pulse (1.02) on value change
- Progress bar: Smooth width transition

## Images

**Not Required:** This is a data-driven simulator. All visuals are created through:
- 2D geometric shapes for car (SVG path)
- CSS gradients for terrain
- Canvas/SVG for road profiles
- No hero images - immediate dashboard entry

**Icon Strategy:**
- Use Heroicons (outline variant) via CDN for UI actions
- Custom geometric icons for terrain types using simple SVG paths

## Technical Implementation Notes

**Car Sprite:** Simple geometric SUV outline, flat color, no details, recognizable silhouette
**Terrain Rendering:** Use CSS clip-path or SVG path data for dynamic road shapes
**Voltage Display:** Real-time color coding with smooth transitions between states
**Responsive:** Simulation canvas scales proportionally, data panel stacks below on mobile