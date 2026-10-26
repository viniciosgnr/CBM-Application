'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export interface EquipmentComplianceData {
  tag: string;
  fpso?: string;
  condition?: string;
  vibrationStatus?: string;
  lubeOilStatus?: string;
  nonCollectionReason?: string | null;
  vibrationNonCollectionReason?: string | null;
  lubeOilNonCollectionReason?: string | null;
}

export interface ReportFailureData {
  equipmentTag: string;
  facility?: string;
  technology?: string | null;
  createdAt?: string;
  raisedDate?: string | null;
  failureMechanismSubdivision?: string | null;
}

// SLB Optisite Figma Color Palette
const SLB_COLORS = {
  green: '#84cc16',   // Lime Green (Good / Completed / Surveyed)
  orange: '#f97316',  // Vibrant Orange (Degraded / Not Collected)
  red: '#f87171',     // Coral Red (Critical / Maintenance)
  gray: '#475569',    // Slate Gray (Pending / Inactive)
  blue: '#3b82f6',    // Medium Blue
  skyBlue: '#93c5fd', // Sky Blue
  purple: '#c084fc',  // Purple
  teal: '#2dd4bf',    // Teal
  amber: '#fbbf24',   // Amber
  pink: '#f472b6',    // Pink
};

// Standard SLB Color mapping for Non-Collection Reasons
const REASON_COLORS: Record<string, string> = {
  'Surveyed': SLB_COLORS.green,
  'Not collected': SLB_COLORS.orange,
  'Awaiting Maintenance': SLB_COLORS.red,
  'Process Not Running': SLB_COLORS.gray,
  'No Safe Access': SLB_COLORS.pink,
  'Operational Constraints': SLB_COLORS.blue,
  'No Data Collector': SLB_COLORS.purple,
  'Incomplete Data': SLB_COLORS.amber,
  'Poor Quality Data': SLB_COLORS.teal,
  'Not Configured': SLB_COLORS.gray,
  'On Standby': SLB_COLORS.skyBlue,
  'No Reason': '#64748b',
};

// Generative palette for Failure Mechanisms
const FAILURE_MECHANISM_PALETTE = [
  SLB_COLORS.green,
  SLB_COLORS.blue,
  SLB_COLORS.orange,
  SLB_COLORS.red,
  SLB_COLORS.purple,
  SLB_COLORS.teal,
  SLB_COLORS.amber,
  SLB_COLORS.skyBlue,
  SLB_COLORS.pink,
  SLB_COLORS.gray,
];

// SLB Optisite Donut Chart Outer Label Render (Colored Dot + Percentage Text)
interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  color: string;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, color }: CustomizedLabelProps) => {
  // Only render outer labels for slices >= 3% to avoid visual overlap
  if (percent < 0.03) return null;

  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 16;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <circle cx={x - 6} cy={y - 2} r={3} fill={color} />
      <text
        x={x}
        y={y}
        fill="#cbd5e1"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-[9px] font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// SLB Optisite Top-Left Custom Legend Component (Matching Image 1 & 2)
function TopLeftLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2 text-[9px] font-medium text-text-muted select-none">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ backgroundColor: item.color }} />
          <span className="truncate max-w-[160px] text-[#cbd5e1]">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

// SLB Optisite Custom Tooltip matching MetricCharts.tsx
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    payload?: {
      name: string;
      value: number;
      percent: number;
      color: string;
    };
  }>;
}

const CustomPieTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    if (!data) return null;
    return (
      <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px] z-50">
        <p className="font-semibold text-[#e2e8f0] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-[2px]" style={{ backgroundColor: data.color }} />
          {data.name}
        </p>
        <p className="text-[#38bdf8] font-medium mt-0.5">
          Value: {data.value} ({(data.percent * 100).toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

// ==========================================
// 1. Collection Compliance & Non-Collection
// ==========================================
export function CollectionCompliancePie({
  equipments = [],
  selectedTechnology = 'Vibration',
  onSliceClick,
  selectedSlice,
}: {
  equipments: EquipmentComplianceData[];
  selectedTechnology: 'Vibration' | 'Lub Oil' | 'Both';
  onSliceClick?: (sliceName: string) => void;
  selectedSlice?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { chartData, legendItems, totalCount } = useMemo(() => {
    const total = equipments.length;
    if (total === 0) {
      return { chartData: [], legendItems: [], totalCount: 0 };
    }

    let surveyed = 0;
    const reasonCounts: Record<string, number> = {};

    equipments.forEach(eq => {
      const activeReason =
        selectedTechnology === 'Vibration'
          ? eq.vibrationNonCollectionReason || eq.nonCollectionReason
          : selectedTechnology === 'Lub Oil'
          ? eq.lubeOilNonCollectionReason || eq.nonCollectionReason
          : eq.nonCollectionReason || eq.vibrationNonCollectionReason || eq.lubeOilNonCollectionReason;

      if (activeReason && activeReason.trim() !== '') {
        const clean = activeReason.trim();
        reasonCounts[clean] = (reasonCounts[clean] || 0) + 1;
      } else {
        surveyed++;
      }
    });

    const data: Array<{ name: string; value: number; percent: number; color: string }> = [];

    // Main surveyed slice (always first, green)
    if (surveyed > 0) {
      data.push({
        name: 'Surveyed',
        value: surveyed,
        percent: surveyed / total,
        color: REASON_COLORS['Surveyed'],
      });
    }

    // Specific non-collection reasons
    Object.entries(reasonCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count], idx) => {
        const color =
          REASON_COLORS[reason] ||
          FAILURE_MECHANISM_PALETTE[idx % FAILURE_MECHANISM_PALETTE.length];
        data.push({
          name: reason,
          value: count,
          percent: count / total,
          color,
        });
      });

    const legends = data.map(item => ({
      label: item.name,
      color: item.color,
    }));

    return {
      chartData: data,
      legendItems: legends,
      totalCount: total,
    };
  }, [equipments, selectedTechnology]);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  if (totalCount === 0 || chartData.length === 0) {
    return (
      <div className="h-[220px] w-full flex flex-col items-center justify-center text-text-muted gap-2 text-xs">
        <AlertCircle size={20} className="text-[#64748b]" />
        <span>No equipment in selected scope</span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* SLB Top-Left Legend */}
      <TopLeftLegend items={legendItems} />

      {/* Clean SLB Donut with Outside Labels */}
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => {
              if (onSliceClick && entry?.name) {
                onSliceClick(String(entry.name));
              }
            }}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            label={(props: PieLabelRenderProps) => {
              const cx = props.cx ?? 0;
              const cy = props.cy ?? 0;
              const midAngle = props.midAngle ?? 0;
              const outerRadius = props.outerRadius ?? 0;
              const percent = props.percent ?? 0;
              const index = props.index ?? 0;
              return renderCustomizedLabel({
                cx,
                cy,
                midAngle,
                outerRadius,
                percent,
                color: chartData[index]?.color || SLB_COLORS.blue,
              });
            }}
            labelLine={false}
          >
            {chartData.map((entry, index) => {
              const isSelected = selectedSlice === entry.name;
              const isDimmed = selectedSlice && !isSelected;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={isDimmed ? 0.35 : 1}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ==========================================
// 2. Failure Mechanisms
// ==========================================
export function FailureMechanismsPie({
  reports = [],
  selectedMonth,
  selectedTechnology,
  onSliceClick,
  selectedSlice,
}: {
  reports: ReportFailureData[];
  selectedMonth?: string;
  selectedTechnology?: 'Vibration' | 'Lub Oil' | 'Both';
  onSliceClick?: (sliceName: string) => void;
  selectedSlice?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { chartData, legendItems, totalMechanisms } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    reports.forEach(rep => {
      // Month filtering (if report has date)
      if (selectedMonth) {
        const d = rep.raisedDate || rep.createdAt || '';
        if (d && !d.startsWith(selectedMonth)) {
          return;
        }
      }

      // Technology filter
      if (selectedTechnology && selectedTechnology !== 'Both' && rep.technology) {
        if (rep.technology.toLowerCase() !== selectedTechnology.toLowerCase()) {
          return;
        }
      }

      const mech = rep.failureMechanismSubdivision;
      if (mech && mech.trim() !== '' && mech.trim() !== 'N/A') {
        const clean = mech.trim();
        counts[clean] = (counts[clean] || 0) + 1;
        total++;
      }
    });

    if (total === 0) {
      return { chartData: [], legendItems: [], totalMechanisms: 0 };
    }

    const data = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([mechanism, count], idx) => ({
        name: mechanism,
        value: count,
        percent: count / total,
        color: FAILURE_MECHANISM_PALETTE[idx % FAILURE_MECHANISM_PALETTE.length],
      }));

    const legends = data.map(item => ({
      label: item.name,
      color: item.color,
    }));

    return {
      chartData: data,
      legendItems: legends,
      totalMechanisms: total,
    };
  }, [reports, selectedMonth, selectedTechnology]);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  if (totalMechanisms === 0 || chartData.length === 0) {
    return (
      <div className="h-[220px] w-full flex flex-col items-center justify-center text-text-muted gap-2 text-xs p-4 text-center">
        <CheckCircle2 size={24} className="text-[#84cc16]" />
        <span className="font-semibold text-[#cbd5e1]">No Failure Mechanisms Recorded</span>
        <span className="text-[11px] text-[#64748b]">
          All evaluated equipment operating without active degradation mechanisms.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col">
      {/* SLB Top-Left Legend (wrapping cleanly for all active mechanisms) */}
      <TopLeftLegend items={legendItems} />

      {/* Clean SLB Donut with Outside Labels */}
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => {
              if (onSliceClick && entry?.name) {
                onSliceClick(String(entry.name));
              }
            }}
            style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
            label={(props: PieLabelRenderProps) => {
              const cx = props.cx ?? 0;
              const cy = props.cy ?? 0;
              const midAngle = props.midAngle ?? 0;
              const outerRadius = props.outerRadius ?? 0;
              const percent = props.percent ?? 0;
              const index = props.index ?? 0;
              return renderCustomizedLabel({
                cx,
                cy,
                midAngle,
                outerRadius,
                percent,
                color: chartData[index]?.color || SLB_COLORS.blue,
              });
            }}
            labelLine={false}
          >
            {chartData.map((entry, index) => {
              const isSelected = selectedSlice === entry.name;
              const isDimmed = selectedSlice && !isSelected;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={isDimmed ? 0.35 : 1}
                  stroke={isSelected ? '#ffffff' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomPieTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
