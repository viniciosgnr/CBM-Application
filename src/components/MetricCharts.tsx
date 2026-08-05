'use client';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

export interface EquipmentChartData {
  condition: string;
  criticality: string;
  lastUpdate?: string | null;
}

export interface ChartWorkOrder {
  status: string;
  dueDate?: string | null;
  creationDate?: string | null;
}

// SLB Optisite Figma Color Palette
const COLORS = {
  green: '#84cc16',   // Lime Green (Good / Completed)
  blue: '#3b82f6',    // Medium Blue (In Progress)
  skyBlue: '#93c5fd', // Sky Blue (Pending in Days Left)
  orange: '#f97316',  // Vibrant Orange (Degraded)
  red: '#f87171',     // Coral Red (Critical / Cancelled)
  gray: '#475569'     // Slate Gray (Pending / Machine Off)
};

// Interface for Custom Tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    payload?: Record<string, string | number>;
  }>;
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px]">
        <p className="font-semibold text-[#e2e8f0]">{payload[0].name}</p>
        <p className="text-[#38bdf8] font-medium mt-0.5">Value: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

// Donut Chart Label Render
interface CustomizedLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  outerRadius: number;
  percent: number;
  color: string;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, color }: CustomizedLabelProps) => {
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

// Top-Left Custom Legend Component
function TopLeftLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex items-center gap-3 mb-2 text-[9px] font-medium text-text-muted select-none">
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-[2px]" style={{ backgroundColor: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

// Date parser helper
function parseDateString(str?: string | null): Date | null {
  if (!str) return null;
  if (str.includes('/')) {
    const parts = str.split(',');
    const dateParts = parts[0].trim().split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const year = parseInt(dateParts[2], 10);
      return new Date(year, month, day);
    }
  }
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return new Date(parsed);
  return null;
}

// Filter date helper
export function isWithinTimeRange(dateStr?: string | null, timeRange: string = 'Last Month'): boolean {
  if (!timeRange || timeRange === 'All Time') return true;
  const d = parseDateString(dateStr);
  if (!d) return true; // Keep item if date parsing fails or missing
  
  const now = Date.now();
  const diffDays = (now - d.getTime()) / (1000 * 60 * 60 * 24);
  
  switch (timeRange) {
    case 'Last Week':
      return diffDays <= 7;
    case 'Last Month':
      return diffDays <= 30;
    case 'Last 6 Months':
      return diffDays <= 180;
    case 'Last Year':
      return diffDays <= 365;
    default:
      return true;
  }
}

// 1. Donut Chart: Work Order by Status
export function WorkOrderStatusPie({ workOrders = [], timeRange = 'Last Month' }: { workOrders?: ChartWorkOrder[]; timeRange?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const filteredOrders = workOrders.filter(w => isWithinTimeRange(w.creationDate || w.dueDate, timeRange));

  let data: Array<{ name: string; value?: number; color?: string; [key: string]: string | number | undefined }> = [];
  if (filteredOrders && filteredOrders.length > 0) {
    const counts = { Completed: 0, InProgress: 0, Pending: 0, Cancelled: 0 };
    filteredOrders.forEach(w => {
      const s = w.status;
      if (s === 'Finished' || s === 'Completed') {
        counts.Completed++;
      } else if (s === 'Pending' || s === 'Observed') {
        counts.Pending++;
      } else if (s === 'Rejected' || s === 'Cancelled') {
        counts.Cancelled++;
      } else {
        counts.InProgress++;
      }
    });
    data = [
      { name: 'Completed', value: counts.Completed, color: COLORS.green },
      { name: 'In Progress', value: counts.InProgress, color: COLORS.blue },
      { name: 'Pending', value: counts.Pending, color: COLORS.gray },
      { name: 'Cancelled', value: counts.Cancelled, color: COLORS.red }
    ].filter(item => item.value > 0);
  }

  // Fallback demo data scaled by timeRange if no dynamic items match
  if (data.length === 0) {
    const multiplier = timeRange === 'Last Week' ? 0.3 : timeRange === 'Last Month' ? 1 : timeRange === 'Last 6 Months' ? 2.5 : timeRange === 'Last Year' ? 4 : 5;
    data = [
      { name: 'Completed', value: Math.round(45 * multiplier), color: COLORS.green },
      { name: 'In Progress', value: Math.round(46 * multiplier), color: COLORS.blue },
      { name: 'Pending', value: Math.round(9 * multiplier), color: COLORS.gray },
      { name: 'Cancelled', value: Math.round(9 * multiplier), color: COLORS.red }
    ];
  }

  const legendItems = [
    { label: 'Completed', color: COLORS.green },
    { label: 'In Progress', color: COLORS.blue },
    { label: 'Pending', color: COLORS.gray },
    { label: 'Cancelled', color: COLORS.red }
  ];

  return (
    <div className="w-full flex flex-col">
      <TopLeftLegend items={legendItems} />
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
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
                color: data[index]?.color || '#3b82f6'
              });
            }}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 2. Bar Chart: Days Left to Due
export function DaysLeftBar({ workOrders = [], timeRange = 'Last Week' }: { workOrders?: ChartWorkOrder[]; timeRange?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const filteredOrders = workOrders.filter(w => isWithinTimeRange(w.dueDate || w.creationDate, timeRange));

  let data: Array<{ name: string; value?: number; color?: string; [key: string]: string | number | undefined }> = [];
  if (filteredOrders && filteredOrders.length > 0) {
    const counts = {
      overdue: { 'In Progress': 0, Pending: 0 },
      week: { 'In Progress': 0, Pending: 0 },
      month: { 'In Progress': 0, Pending: 0 },
      longer: { 'In Progress': 0, Pending: 0 }
    };
    
    filteredOrders.forEach(w => {
      const s = w.status;
      if (s === 'Finished' || s === 'Completed' || s === 'Rejected' || s === 'Cancelled') {
        return;
      }
      const typeKey = (s === 'Pending' || s === 'Observed') ? 'Pending' : 'In Progress';
      const due = parseDateString(w.dueDate);
      if (!due) return;
      
      const diffTime = due.getTime() - Date.now();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        counts.overdue[typeKey]++;
      } else if (diffDays <= 7) {
        counts.week[typeKey]++;
      } else if (diffDays <= 30) {
        counts.month[typeKey]++;
      } else {
        counts.longer[typeKey]++;
      }
    });
    
    data = [
      { name: 'Overdue', 'In Progress': counts.overdue['In Progress'], Pending: counts.overdue.Pending },
      { name: '0-7 days', 'In Progress': counts.week['In Progress'], Pending: counts.week.Pending },
      { name: '8-30 days', 'In Progress': counts.month['In Progress'], Pending: counts.month.Pending },
      { name: '> 30 days', 'In Progress': counts.longer['In Progress'], Pending: counts.longer.Pending }
    ];
  }

  if (data.length === 0 || data.every(d => d['In Progress'] === 0 && d.Pending === 0)) {
    const mult = timeRange === 'Last Week' ? 0.3 : timeRange === 'Last Month' ? 1 : timeRange === 'Last 6 Months' ? 2 : 3;
    data = [
      { name: 'Overdue', 'In Progress': Math.round(15 * mult), Pending: Math.round(5 * mult) },
      { name: '0-7 days', 'In Progress': Math.round(15 * mult), Pending: Math.round(15 * mult) },
      { name: '8-30 days', 'In Progress': 0, Pending: Math.round(80 * mult) },
      { name: '> 30 days', 'In Progress': 0, Pending: Math.round(75 * mult) }
    ];
  }

  const legendItems = [
    { label: 'In Progress', color: COLORS.blue },
    { label: 'Pending', color: COLORS.skyBlue }
  ];

  return (
    <div className="w-full flex flex-col">
      <TopLeftLegend items={legendItems} />
      <ResponsiveContainer width="100%" height={190}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={9}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-panel)', strokeWidth: 1 }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={9}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0b0f19',
              border: '1px solid #1e2a3a',
              borderRadius: 4,
              color: '#e2e8f0',
              fontSize: 9,
            }}
          />
          <Bar dataKey="In Progress" stackId="a" fill={COLORS.blue} barSize={44} />
          <Bar dataKey="Pending" stackId="a" fill={COLORS.skyBlue} barSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// 3. Donut Chart: Equipment by CBM Condition
export function EquipmentConditionPie({
  equipments = [],
  timeRange = 'Last Month',
  onConditionClick,
  selectedCondition
}: {
  equipments?: EquipmentChartData[];
  timeRange?: string;
  onConditionClick?: (condition: string) => void;
  selectedCondition?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const filteredEquips = equipments.filter(e => isWithinTimeRange(e.lastUpdate, timeRange));

  let data: Array<{ name: string; value?: number; color?: string; [key: string]: string | number | undefined }> = [];
  if (filteredEquips && filteredEquips.length > 0) {
    const counts = { Good: 0, Degraded: 0, Critical: 0, 'Machine Off': 0 };
    filteredEquips.forEach(e => {
      const cond = e.condition ? e.condition.split(' - ')[0] : '';
      if (cond === 'Good') counts.Good++;
      else if (cond === 'Degraded') counts.Degraded++;
      else if (cond === 'Critical') counts.Critical++;
      else if (cond === 'Machine Off') counts['Machine Off']++;
    });
    data = [
      { name: 'Good', value: counts.Good, color: COLORS.green },
      { name: 'Degraded', value: counts.Degraded, color: COLORS.orange },
      { name: 'Critical', value: counts.Critical, color: COLORS.red },
      { name: 'Pending', value: counts['Machine Off'], color: COLORS.gray }
    ].filter(item => item.value > 0);
  }

  if (data.length === 0) {
    const multiplier = timeRange === 'Last Week' ? 0.3 : timeRange === 'Last Month' ? 1 : timeRange === 'Last 6 Months' ? 2.5 : timeRange === 'Last Year' ? 4 : 5;
    data = [
      { name: 'Good', value: Math.round(45 * multiplier), color: COLORS.green },
      { name: 'Degraded', value: Math.round(46 * multiplier), color: COLORS.orange },
      { name: 'Critical', value: Math.round(9 * multiplier), color: COLORS.red },
      { name: 'Pending', value: Math.round(10 * multiplier), color: COLORS.gray }
    ];
  }

  const legendItems = [
    { label: 'Good', color: COLORS.green },
    { label: 'Degraded', color: COLORS.orange },
    { label: 'Critical', color: COLORS.red },
    { label: 'Pending', color: COLORS.gray }
  ];

  return (
    <div className="w-full flex flex-col">
      <TopLeftLegend items={legendItems} />
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={68}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => onConditionClick?.(entry.name || '')}
            style={{ cursor: onConditionClick ? 'pointer' : 'default' }}
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
                color: data[index]?.color || '#3b82f6'
              });
            }}
            labelLine={false}
          >
            {data.map((entry, index) => {
              const isSelected = selectedCondition === entry.name;
              const isDimmed = selectedCondition && !isSelected;
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
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// 4. Bar Chart: CBM Condition by Equipment Criticality
export function CbmCriticalityBar({
  equipments = [],
  timeRange = 'Last Week',
  onCriticalityClick,
}: {
  equipments?: EquipmentChartData[];
  timeRange?: string;
  onCriticalityClick?: (criticality: string) => void;
  selectedCriticality?: string | null;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const filteredEquips = equipments.filter(e => isWithinTimeRange(e.lastUpdate, timeRange));

  let data: Array<{ name: string; value?: number; color?: string; [key: string]: string | number | undefined }> = [];
  if (filteredEquips && filteredEquips.length > 0) {
    const groups = {
      High: { Good: 0, Degraded: 0, Critical: 0, Pending: 0 },
      Medium: { Good: 0, Degraded: 0, Critical: 0, Pending: 0 },
      Low: { Good: 0, Degraded: 0, Critical: 0, Pending: 0 }
    };
    filteredEquips.forEach(e => {
      const crit = e.criticality;
      const cond = e.condition ? e.condition.split(' - ')[0] : '';
      if (crit in groups) {
        const c = crit as keyof typeof groups;
        if (cond === 'Good') groups[c].Good++;
        else if (cond === 'Degraded') groups[c].Degraded++;
        else if (cond === 'Critical') groups[c].Critical++;
        else groups[c].Pending++;
      }
    });
    data = [
      { name: 'High', Good: groups.High.Good, Degraded: groups.High.Degraded, Critical: groups.High.Critical, Pending: groups.High.Pending },
      { name: 'Medium', Good: groups.Medium.Good, Degraded: groups.Medium.Degraded, Critical: groups.Medium.Critical, Pending: groups.Medium.Pending },
      { name: 'Low', Good: groups.Low.Good, Degraded: groups.Low.Degraded, Critical: groups.Low.Critical, Pending: groups.Low.Pending }
    ];
  }

  if (data.length === 0 || data.every(d => d.Good === 0 && d.Degraded === 0 && d.Critical === 0 && d.Pending === 0)) {
    const mult = timeRange === 'Last Week' ? 0.3 : timeRange === 'Last Month' ? 1 : timeRange === 'Last 6 Months' ? 2 : 3;
    data = [
      { name: 'High', Good: Math.round(15 * mult), Degraded: Math.round(12 * mult), Critical: Math.round(10 * mult), Pending: Math.round(10 * mult) },
      { name: 'Medium', Good: Math.round(15 * mult), Degraded: Math.round(12 * mult), Critical: Math.round(10 * mult), Pending: Math.round(10 * mult) },
      { name: 'Low', Good: Math.round(15 * mult), Degraded: Math.round(12 * mult), Critical: Math.round(10 * mult), Pending: Math.round(10 * mult) }
    ];
  }

  const legendItems = [
    { label: 'Good', color: COLORS.green },
    { label: 'Degraded', color: COLORS.orange },
    { label: 'Critical', color: COLORS.red },
    { label: 'Pending', color: COLORS.gray }
  ];

  return (
    <div className="w-full flex flex-col">
      <TopLeftLegend items={legendItems} />
      <ResponsiveContainer width="100%" height={190}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          onClick={(state) => {
            if (state && state.activeLabel) {
              onCriticalityClick?.(String(state.activeLabel));
            }
          }}
          style={{ cursor: onCriticalityClick ? 'pointer' : 'default' }}
        >
          <XAxis
            dataKey="name"
            stroke="var(--text-muted)"
            fontSize={9}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-panel)', strokeWidth: 1 }}
          />
          <YAxis
            stroke="var(--text-muted)"
            fontSize={9}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: '#0b0f19',
              border: '1px solid #1e2a3a',
              borderRadius: 4,
              color: '#e2e8f0',
              fontSize: 9,
            }}
          />
          <Bar dataKey="Pending" stackId="a" fill={COLORS.gray} barSize={48} />
          <Bar dataKey="Degraded" stackId="a" fill={COLORS.orange} barSize={48} />
          <Bar dataKey="Critical" stackId="a" fill={COLORS.red} barSize={48} />
          <Bar dataKey="Good" stackId="a" fill={COLORS.green} barSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
