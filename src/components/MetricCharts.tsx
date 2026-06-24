'use client';
import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';

// Definindo as cores do OptSite correspondentes ao CSS do globals.css
const COLORS = {
  green: '#22c55e',   // var(--status-ok)
  blue: '#0ea5e9',    // var(--accent-blue)
  orange: '#f59e0b',  // var(--status-warn)
  red: '#ef4444',     // var(--status-error)
  gray: '#64748b'     // var(--text-muted)
};

// Interface para o Tooltip Customizado
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    payload?: Record<string, string | number>;
  }>;
}

// Tooltip customizado do OptSite
const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#111827] border border-[#1e2a3a] p-2 rounded shadow-lg text-[10px]">
        <p className="font-semibold text-[#e2e8f0]">{payload[0].name}</p>
        <p className="text-[#0ea5e9] font-medium mt-1">Valor: {payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

// Componente para desenhar as bolinhas com porcentagem ao redor do Donut Chart
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
  // Desloca o raio para fora da circunferência
  const radius = outerRadius + 14;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g>
      <circle cx={x - 6} cy={y - 3} r={3} fill={color} />
      <text
        x={x}
        y={y}
        fill="var(--text-primary)"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-[9px] font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    </g>
  );
};

// 1. Donut Chart: Work Order by Status
export function WorkOrderStatusPie() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const data = [
    { name: 'Completed', value: 45, color: COLORS.green },
    { name: 'In Progress', value: 46, color: COLORS.blue },
    { name: 'Pending', value: 9, color: COLORS.gray },
    { name: 'Cancelled', value: 1, color: COLORS.red }
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius={45}
          outerRadius={65}
          paddingAngle={2}
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
              color: data[index].color
            });
          }}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          iconType="circle"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 9, paddingTop: 10, fill: 'var(--text-muted)' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 2. Bar Chart: Days Left to Due
export function DaysLeftBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const data = [
    { name: 'Overdue', 'In Progress': 10, Pending: 10 },
    { name: '0-7 days', 'In Progress': 15, Pending: 15 },
    { name: '8-30 days', 'In Progress': 5, Pending: 75 },
    { name: '> 30 days', 'In Progress': 0, Pending: 75 }
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
          domain={[0, 80]}
          ticks={[0, 20, 40, 60, 80]}
        />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #1e2a3a',
            borderRadius: 4,
            color: '#e2e8f0',
            fontSize: 9,
          }}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 9, paddingTop: 10 }}
        />
        <Bar dataKey="In Progress" stackId="a" fill={COLORS.blue} barSize={32} />
        <Bar dataKey="Pending" stackId="a" fill={COLORS.gray} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// 3. Donut Chart: Equipment by CBM Condition
export function EquipmentConditionPie() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const data = [
    { name: 'Good', value: 45, color: COLORS.green },
    { name: 'Degraded', value: 46, color: COLORS.orange },
    { name: 'Critical', value: 9, color: COLORS.red },
    { name: 'Pending', value: 1, color: COLORS.gray }
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="48%"
          innerRadius={45}
          outerRadius={65}
          paddingAngle={2}
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
              color: data[index].color
            });
          }}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconSize={8}
          iconType="circle"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 9, paddingTop: 10 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// 4. Bar Chart: CBM Condition by Equipment Criticality
export function CbmCriticalityBar() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[220px] w-full" />;
  }

  const data = [
    { name: 'High', Good: 15, Degraded: 20, Critical: 10, Pending: 3 },
    { name: 'Medium', Good: 15, Degraded: 20, Critical: 10, Pending: 3 },
    { name: 'Low', Good: 15, Degraded: 20, Critical: 10, Pending: 3 }
  ];

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
          domain={[0, 80]}
          ticks={[0, 20, 40, 60, 80]}
        />
        <Tooltip
          contentStyle={{
            background: '#111827',
            border: '1px solid #1e2a3a',
            borderRadius: 4,
            color: '#e2e8f0',
            fontSize: 9,
          }}
        />
        <Legend
          iconSize={8}
          iconType="circle"
          verticalAlign="bottom"
          wrapperStyle={{ fontSize: 9, paddingTop: 10 }}
        />
        <Bar dataKey="Pending" stackId="a" fill={COLORS.gray} barSize={32} />
        <Bar dataKey="Degraded" stackId="a" fill={COLORS.orange} barSize={32} />
        <Bar dataKey="Critical" stackId="a" fill={COLORS.red} barSize={32} />
        <Bar dataKey="Good" stackId="a" fill={COLORS.green} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
