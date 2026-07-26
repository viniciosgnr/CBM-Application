# SLB Optisite Figma Charts Alignment Specification

## Overview
This specification details updating the chart components in `MetricCharts.tsx` to match the exact visual style, colors, legend placements, and bar stacking of the SLB Optisite Figma templates.

## Color Palette Alignment
- **Lime Green (Good / Completed)**: `#84cc16`
- **Medium Blue (In Progress / Equipment)**: `#3b82f6`
- **Sky Blue (Pending in Days Left)**: `#93c5fd`
- **Orange (Degraded)**: `#f97316`
- **Red / Coral (Critical / Cancelled)**: `#f87171`
- **Slate Gray (Pending / Machine Off)**: `#475569`

## Individual Chart Designs

### 1. Work Order by Status (Donut Chart)
- Donut radii: `innerRadius={48}`, `outerRadius={70}`.
- Colors: Completed (`#84cc16`), In Progress (`#3b82f6`), Pending (`#475569`), Cancelled (`#f87171`).
- Legend: Positioned at top-left under title with square badges (`Completed`, `In Progress`, `Pending`, `Cancelled`).
- Percentage Callouts: Exterior dots and percent text (`• 45%`, `• 46%`, `• 9%`).

### 2. Days Left to Due (Stacked Bar Chart)
- X-Axis Categories: `Overdue`, `0-7 days`, `8-30 days`, `> 30 days`.
- Stacking Layers:
  - Bottom Layer: `In Progress` (`#3b82f6`)
  - Top Layer: `Pending` (`#93c5fd`)
- Y-Axis Ticks: `0, 20, 40, 60, 80`.
- Legend: Top-left square badges (`In Progress`, `Pending`).

### 3. Equipment by CBM Condition (Donut Chart)
- Donut radii: `innerRadius={48}`, `outerRadius={70}`.
- Colors: Good (`#84cc16`), Degraded (`#f97316`), Critical (`#f87171`), Pending (`#475569`).
- Legend: Top-left square badges (`Good`, `Degraded`, `Critical`, `Pending`).
- Percentage Callouts: Exterior dots and percent text.

### 4. CBM Condition by Equipment Criticality (Stacked Bar Chart)
- X-Axis Categories: `High`, `Medium`, `Low`.
- Stacking Layers (Bottom to Top):
  1. `Machine Off / Pending`: Slate Gray (`#475569`)
  2. `Degraded`: Orange (`#f97316`)
  3. `Critical`: Red (`#f87171`)
  4. `Good`: Lime Green (`#84cc16`)
- Y-Axis Ticks: `0, 20, 40, 60, 80`.
- Bar size: wide bars (`barSize={48}`).
- Legend: Top-left square badges (`Good`, `Degraded`, `Critical`, `Pending`).

## Security & Verification
- Strict React JSX typing and safe number calculations.
- Verified via `npm run lint`.
