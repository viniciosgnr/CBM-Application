# Chart Interactive Time Range Filters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement interactive time range filter dropdowns (`Last Week`, `Last Month`, `Last 6 Months`, `Last Year`, `All Time`) on all dashboard charts in `DashboardCard.tsx` and `MetricCharts.tsx`.

**Architecture:** Update `DashboardCard` to render an interactive styled dropdown menu. Add time filtering logic to `MetricCharts.tsx`. Wire per-chart time range state in `src/app/page.tsx`.

**Tech Stack:** React, Next.js, Tailwind CSS, Recharts.

## Global Constraints

- Options: `Last Week`, `Last Month`, `Last 6 Months`, `Last Year`, `All Time`.
- Each chart manages its own time filter state independently.
- Dark theme styling matching SLB Optisite (`bg-[#111827] border border-border-panel text-text-primary px-2 py-1 text-[10px] font-medium rounded outline-none focus:border-accent-blue cursor-pointer`).

---

### Task 1: Update DashboardCard.tsx for Interactive Time Filter Dropdown

**Files:**
- Modify: `src/components/DashboardCard.tsx`

**Interfaces:**
- Consumes: `DashboardCardProps` with optional `timeRange`, `onTimeRangeChange`, `timeOptions`.
- Produces: Interactive header dropdown control in `DashboardCard`.

- [ ] **Step 1: Write updated DashboardCard.tsx**

```tsx
'use client';
import { ReactNode } from 'react';
import { Maximize2 } from 'lucide-react';

export const TIME_RANGE_OPTIONS = [
  'Last Week',
  'Last Month',
  'Last 6 Months',
  'Last Year',
  'All Time'
];

interface DashboardCardProps {
  title: string;
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
  onMaximize: () => void;
  children: ReactNode;
}

export default function DashboardCard({
  title,
  timeRange = 'Last Month',
  onTimeRangeChange,
  onMaximize,
  children
}: DashboardCardProps) {
  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col relative h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        <div className="flex items-center gap-2">
          {/* Interactive Custom Select Filter style matching Figma */}
          {onTimeRangeChange ? (
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="text-[10px] text-text-primary bg-[#111827] border border-border-panel/80 px-2 py-1 rounded cursor-pointer hover:border-accent-blue focus:border-accent-blue transition-colors font-medium outline-none"
            >
              {TIME_RANGE_OPTIONS.map((option) => (
                <option key={option} value={option} className="bg-[#0b0f19] text-text-primary">
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-[10px] text-text-primary bg-bg-base border border-border-panel px-2.5 py-1 rounded select-none font-medium">
              <span>{timeRange}</span>
            </div>
          )}
          
          {/* Maximize Icon */}
          <button
            onClick={onMaximize}
            className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-border-panel/20 transition-colors cursor-pointer"
            title="Maximize"
          >
            <Maximize2 size={12} />
          </button>
        </div>
      </div>
      {/* Content wrapper */}
      <div className="flex-1 flex items-center justify-center min-h-[220px]">
        {children}
      </div>
    </div>
  );
}
```

---

### Task 2: Update MetricCharts.tsx to Filter Metrics by Time Range

**Files:**
- Modify: `src/components/MetricCharts.tsx`

**Interfaces:**
- Consumes: `timeRange?: string` prop on `WorkOrderStatusPie`, `DaysLeftBar`, `EquipmentConditionPie`, `CbmCriticalityBar`.
- Produces: Dynamic metric filtering based on `timeRange`.

- [ ] **Step 1: Add timeRange parameter to chart export functions**

Add date filtering logic based on `timeRange` (`Last Week`, `Last Month`, `Last 6 Months`, `Last Year`, `All Time`) inside `WorkOrderStatusPie`, `DaysLeftBar`, `EquipmentConditionPie`, and `CbmCriticalityBar`.

---

### Task 3: Wire Chart Time Filter States in page.tsx

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `DashboardCard` and `MetricCharts` components.
- Produces: Independent state management for `woStatusTimeRange`, `daysLeftTimeRange`, `equipCondTimeRange`, `cbmCritTimeRange`.

- [ ] **Step 1: Add state variables and pass props in page.tsx**

- [ ] **Step 2: Run npm run lint to verify clean build**

Run: `npm run lint`
Expected: `✔ No ESLint warnings or errors`

- [ ] **Step 3: Commit changes**

```bash
git add src/components/DashboardCard.tsx src/components/MetricCharts.tsx src/app/page.tsx
git commit -m "feat: implement interactive chart time range filters"
```
