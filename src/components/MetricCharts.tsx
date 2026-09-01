'use client';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, LabelList } from 'recharts';
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
  
  // Anchor to active operational timeline (August 31, 2026)
  const now = new Date('2026-08-31T23:59:59Z').getTime();
  const diffTime = now - d.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // If date is in the future relative to the timeline, still include unless looking backward
  if (diffDays < 0) return true;
  
  switch (timeRange) {
    case 'Last Week':
    case 'Last 7 Days':
      return diffDays <= 7;
    case 'Last Month':
    case 'Last 30 Days':
      return diffDays <= 30;
    case 'Last 3 Months':
    case 'Last 90 Days':
      return diffDays <= 90;
    case 'Last 6 Months':
    case 'Last 180 Days':
      return diffDays <= 180;
    case 'Last Year':
    case 'Last 365 Days':
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

// 5. Recommendations Page: Monthly CBM Status Stacked Bar Chart
export interface ReportChartItem {
  facility?: string | null;
  tagNumber?: string | null;
  overallCondition?: string | null;
  vibrationStatus?: string | null;
  lubeOilStatus?: string | null;
  raisedDate?: string | null;
  createdAt?: string | null;
}

export function MonthlyConditionBarChart({
  reports = [],
  selectedFpsos = ['DNY', 'UNY', 'PTY', 'ONE'],
  timeRange = 'All Time'
}: {
  reports?: ReportChartItem[];
  selectedFpsos?: string[] | string;
  timeRange?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[260px] w-full" />;
  }

  // 1. Filter reports by FPSO and Time Range
  const filteredReports = reports.filter(r => {
    if (selectedFpsos) {
      const fpsosArray = Array.isArray(selectedFpsos)
        ? selectedFpsos
        : selectedFpsos === 'All'
        ? ['DNY', 'UNY', 'PTY', 'ONE']
        : [selectedFpsos];

      if (fpsosArray.length < 4) {
        const fac = (r.facility || '').toUpperCase();
        const tag = (r.tagNumber || '').toUpperCase();
        const matches = fpsosArray.some(f => {
          const target = f.replace(/^FPSO\s+/i, '').trim().toUpperCase();
          return fac.includes(target) || tag.startsWith(target);
        });
        if (!matches) return false;
      }
    }
    const dateStr = r.raisedDate || r.createdAt;
    return isWithinTimeRange(dateStr, timeRange);
  });

  // 2. Group by month YYYY-MM
  const monthMap: Record<string, { tier4: number; tier3: number; tier2: number; tier1: number; total: number; label: string; rawDate: string }> = {};

  filteredReports.forEach(r => {
    const rawDate = r.raisedDate || r.createdAt || '2026-08-01';
    const parsed = new Date(rawDate);
    if (isNaN(parsed.getTime())) return;

    const yyyyMm = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = parsed.toLocaleDateString('en-GB', { month: 'short' }) + '-' + String(parsed.getFullYear()).slice(2);

    if (!monthMap[yyyyMm]) {
      monthMap[yyyyMm] = {
        tier4: 0,
        tier3: 0,
        tier2: 0,
        tier1: 0,
        total: 0,
        label: monthLabel,
        rawDate: yyyyMm
      };
    }

    const cond = r.overallCondition || 'Good - Tier 4';
    if (cond.includes('Tier 1') || cond.startsWith('Critical')) {
      monthMap[yyyyMm].tier1++;
    } else if (cond.includes('Tier 2') || cond.startsWith('Degraded')) {
      monthMap[yyyyMm].tier2++;
    } else if (cond.includes('Tier 3')) {
      monthMap[yyyyMm].tier3++;
    } else {
      monthMap[yyyyMm].tier4++;
    }
    monthMap[yyyyMm].total++;
  });

  // Sort chronologically
  const sortedMonths = Object.keys(monthMap).sort();
  let chartData = sortedMonths.map(k => {
    const item = monthMap[k];
    return {
      month: item.label,
      'Good - Tier 4': item.tier4,
      'Good - Tier 3': item.tier3,
      'Degraded - Tier 2': item.tier2,
      'Critical - Tier 1': item.tier1,
      total: item.total
    };
  });

  // Fallback only if initial database reports list is completely empty
  if (reports.length === 0 && chartData.length === 0) {
    chartData = [
      { month: 'Mar-26', 'Good - Tier 4': 9, 'Good - Tier 3': 1, 'Degraded - Tier 2': 1, 'Critical - Tier 1': 1, total: 12 },
      { month: 'Apr-26', 'Good - Tier 4': 9, 'Good - Tier 3': 1, 'Degraded - Tier 2': 1, 'Critical - Tier 1': 1, total: 12 },
      { month: 'May-26', 'Good - Tier 4': 10, 'Good - Tier 3': 2, 'Degraded - Tier 2': 2, 'Critical - Tier 1': 1, total: 15 },
      { month: 'Jun-26', 'Good - Tier 4': 78, 'Good - Tier 3': 2, 'Degraded - Tier 2': 1, 'Critical - Tier 1': 1, total: 82 },
      { month: 'Jul-26', 'Good - Tier 4': 12, 'Good - Tier 3': 3, 'Degraded - Tier 2': 2, 'Critical - Tier 1': 1, total: 18 },
      { month: 'Aug-26', 'Good - Tier 4': 14, 'Good - Tier 3': 4, 'Degraded - Tier 2': 3, 'Critical - Tier 1': 1, total: 22 }
    ];
  }

  const TIER_COLORS = {
    tier4: '#16a34a', // Dark Green
    tier3: '#84cc16', // Lime Green
    tier2: '#eab308', // Amber / Yellow
    tier1: '#ef4444'  // Red
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Top Legend matching SLB reference */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
        <div className="flex items-center gap-4 text-[10px] text-text-muted">
          <span className="font-bold text-text-primary uppercase tracking-wider text-[9px]">Condition</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
            <span>Good (Tier 4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#84cc16]" />
            <span>Good (Tier 3)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#eab308]" />
            <span>Degraded (Tier 2)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ef4444]" />
            <span>Critical (Tier 1)</span>
          </div>
        </div>

        <div className="text-[10px] text-text-muted">
          FPSO: <strong className="text-text-primary uppercase">
            {Array.isArray(selectedFpsos)
              ? selectedFpsos.length === 4
                ? 'All Units'
                : selectedFpsos.length === 0
                ? 'None'
                : selectedFpsos.join(', ')
              : selectedFpsos === 'All'
              ? 'All Units'
              : selectedFpsos}
          </strong>
        </div>
      </div>

      {/* Stacked Bar Chart */}
      <div className="relative">
        <span className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-text-muted font-semibold tracking-wider select-none pointer-events-none">
          Total Assets
        </span>

        <div className="pl-4">
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={chartData}
              margin={{ top: 22, right: 15, left: -10, bottom: 20 }}
            >
              <XAxis
                dataKey="month"
                stroke="var(--text-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-panel)', strokeWidth: 1 }}
                dy={6}
              />
              <YAxis
                stroke="var(--text-muted)"
                fontSize={9}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as Record<string, string | number>;
                    return (
                      <div className="bg-[#0b0f19] border border-[#1e2a3a] p-3 rounded-lg shadow-2xl text-[10px] flex flex-col gap-1.5 z-50">
                        <div className="font-bold text-[#e2e8f0] pb-1 border-b border-[#1e2a3a] flex items-center justify-between gap-4">
                          <span>{label}</span>
                          <span className="text-accent-blue font-bold">Total: {d.total}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[#ef4444]">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Critical (Tier 1):</span>
                          <strong>{d['Critical - Tier 1'] || 0}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[#eab308]">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#eab308]" /> Degraded (Tier 2):</span>
                          <strong>{d['Degraded - Tier 2'] || 0}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[#84cc16]">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#84cc16]" /> Good (Tier 3):</span>
                          <strong>{d['Good - Tier 3'] || 0}</strong>
                        </div>
                        <div className="flex items-center justify-between gap-3 text-[#16a34a]">
                          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#16a34a]" /> Good (Tier 4):</span>
                          <strong>{d['Good - Tier 4'] || 0}</strong>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Stacked Bars: Tier 4 (bottom) -> Tier 3 -> Tier 2 -> Tier 1 (top) */}
              <Bar dataKey="Good - Tier 4" stackId="a" fill={TIER_COLORS.tier4} barSize={44} />
              <Bar dataKey="Good - Tier 3" stackId="a" fill={TIER_COLORS.tier3} barSize={44} />
              <Bar dataKey="Degraded - Tier 2" stackId="a" fill={TIER_COLORS.tier2} barSize={44} />
              <Bar dataKey="Critical - Tier 1" stackId="a" fill={TIER_COLORS.tier1} barSize={44}>
                <LabelList dataKey="total" position="top" fill="#e2e8f0" fontSize={10} fontWeight="bold" dy={-4} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="text-center text-[9px] text-text-muted font-semibold tracking-wider -mt-3">
          Month
        </div>
      </div>
    </div>
  );
}
