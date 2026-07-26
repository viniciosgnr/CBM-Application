# Chart Interactive Time Range Filters Design Specification

## Overview
This specification details the implementation of interactive time range filters (`Last Week`, `Last Month`, `Last 6 Months`, `Last Year`, `All Time`) for all dashboard charts in the CBM application.

## Goals & User Experience
- Replace static placeholder text in chart card headers with fully interactive dropdown menus matching the SLB Optisite dark theme.
- Dynamically filter chart dataset metrics based on the selected time window.
- Persist individual filter selections per chart independently.

## Component Specifications

### 1. `DashboardCard.tsx`
- **Props**:
  - `title: string`
  - `timeRange: string`
  - `onTimeRangeChange: (range: string) => void`
  - `onMaximize: () => void`
  - `children: ReactNode`
- **UI Styling**:
  - Dark styled select menu: `bg-[#111827] border border-border-panel/80 rounded px-2.5 py-1 text-[10px] font-medium text-text-primary focus:border-accent-blue outline-none cursor-pointer`.
  - Dropdown options: `Last Week`, `Last Month`, `Last 6 Months`, `Last Year`, `All Time`.

### 2. Date Filtering Logic (`MetricCharts.tsx`)
- Date Parser: Safely parses dates from `DD/MM/YYYY, HH:MM:SS` strings and ISO timestamps.
- Time Threshold Calculation:
  - `Last Week`: 7 days
  - `Last Month`: 30 days
  - `Last 6 Months`: 180 days
  - `Last Year`: 365 days
  - `All Time`: Unlimited
- Metric recalculation dynamically updates the charts when a user changes the dropdown selection.

## Security & Verification
- Safe date math handling invalid date strings without crashing.
- Verified via `npm run lint`.
