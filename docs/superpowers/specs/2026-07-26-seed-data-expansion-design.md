# Seed Data Expansion Design Specification

## Overview
This specification details expanding the sample seed dataset for both `equipments` and `workOrders` to 25+ rich records per table.

## Goals & Data Distribution

### 1. Equipment Dataset (`equipments` & `equipmentHistory`)
- **Quantity**: 25+ equipment records.
- **FPSO Distribution**: `UNY`, `CDI`, `SEP`.
- **System Distribution**: `Gas`, `Water`, `Oil`, `Power`, `HVAC`.
- **Criticality**: `High`, `Medium`, `Low`.
- **CBM Conditions**: `Good`, `Degraded`, `Critical`, `Machine Off`.
- **Timestamps**: Spread across recent days, weeks, months, and 6-month windows to populate all chart time filters.

### 2. Work Order Dataset (`workOrders`)
- **Quantity**: 25+ work order records.
- **Statuses**: `Accepted`, `In Progress`, `Pending`, `Completed`, `Rejected`, `Cancelled`.
- **Due Date Distributions**: `Overdue`, `0-7 days`, `8-30 days`, `> 30 days`.
- **Monitoring Techniques**: `CBM Vibration - Analysis High`, `CBM Lube Oil - Analysis Medium`, `CBM Electrical - Stator`, `CBM Pressure - Calibration`, `CBM Thermography`.

## Seeding Script Execution
- Clear and re-populate the SQLite database using `ts-node` / `tsx` script (`src/db/run-seed.ts`).

## Security & Verification
- Valid SQLite foreign keys and timestamps.
- Verified via `npm run lint` and web application inspection.
