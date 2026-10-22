'use client';

import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, PlusCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  getWorstTechniqueStatus,
  calculateEquipmentCbmRisk,
  formatEquipmentClass,
} from '@/utils/riskMatrix';

export const NON_COLLECTION_REASONS = [
  'Not collected',
  'Awaiting Maintenance',
  'No Safe Access',
  'No Data Collector',
  'Incomplete Data',
  'Poor Quality Data',
  'Not Configured',
  'Operational Constraints',
  'On Standby',
  'Process Not Running',
  'No Reason',
] as const;

export type NonCollectionReason = (typeof NON_COLLECTION_REASONS)[number];

export interface Equipment {
  id: number;
  tag: string;
  fpso: string;
  name: string;
  class: string;
  system: string;
  criticality: string;
  objectType: string;
  condition: string;
  vibrationStatus: string;
  lubeOilStatus: string;
  lastUpdate: string;
  observation?: string | null;
  frequency?: string | null;
  vibrationFrequency?: string | null;
  lubeOilFrequency?: string | null;
  lastVibrationUpdate?: string | null;
  lastLubeOilUpdate?: string | null;
  collectionMethod?: string | null;
  vibrationNonCollectionReason?: string | null;
  lubeOilNonCollectionReason?: string | null;
  nonCollectionReason?: string | null;
}

export interface HistoryEntry {
  id: number;
  equipmentTag: string;
  vibrationStatus: string;
  lubeOilStatus: string;
  overallCondition: string;
  changedAt: string;
}

interface EquipmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
  history?: HistoryEntry[];
  onLogNewAnalysis?: () => void;
  onUpdateNonCollectionReason?: (reason: string) => Promise<void> | void;
}

const CHART_VALUE_MAP: Record<string, number> = {
  'Good - Tier 4': 4,
  'Good - Tier 3': 3,
  'Degraded - Tier 2': 2,
  'Critical - Tier 1': 1,
  'Good': 4,
  'Degraded': 2,
  'Critical': 1,
  'Machine Off': 0,
};

function formatFrequencyBadge(freq?: string | null, defaultDays = 24): string {
  if (!freq) return `${defaultDays} days`;
  if (/\d+/.test(freq)) {
    const num = freq.match(/\d+/)?.[0];
    return `${num} days`;
  }
  return `${defaultDays} days`;
}

function getFrequencyDays(frequency?: string | null, defaultDays = 30): number {
  if (!frequency) return defaultDays;
  const numMatch = frequency.match(/\d+/);
  if (numMatch) return parseInt(numMatch[0], 10);
  return defaultDays;
}

function parseDate(dateStr?: string | null): Date | null {
  if (!dateStr) return null;
  const clean = dateStr.split(',')[0].trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }
  const iso = new Date(dateStr);
  return isNaN(iso.getTime()) ? null : iso;
}

function calculateNextPlannedDate(
  lastUpdateStr?: string | null,
  frequency?: string | null,
  defaultDays = 30
): { plannedDateStr: string; isOverdue: boolean } {
  const lastDate = parseDate(lastUpdateStr) || new Date(2026, 7, 8);
  const freqDays = getFrequencyDays(frequency, defaultDays);
  const plannedDate = new Date(lastDate);
  plannedDate.setDate(plannedDate.getDate() + freqDays);

  const day = String(plannedDate.getDate()).padStart(2, '0');
  const month = String(plannedDate.getMonth() + 1).padStart(2, '0');
  const year = plannedDate.getFullYear();
  const plannedDateStr = `${day}/${month}/${year}`;

  const today = new Date();
  const planned = new Date(plannedDate.getFullYear(), plannedDate.getMonth(), plannedDate.getDate());
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const isOverdue = planned.getTime() < ref.getTime();

  return { plannedDateStr, isOverdue };
}

// Format status to compact SLB badge (e.g. 'T3 - Good', 'T1 - Critical')
function formatTierBadge(status?: string | null): { text: string; bgClass: string; textClass: string } {
  if (!status) return { text: 'T4 - Good', bgClass: 'bg-[#10b981]', textClass: 'text-black' };
  
  if (status.includes('Critical') || status.includes('Tier 1')) {
    return { text: 'T1 - Critical', bgClass: 'bg-[#ff5a5f]', textClass: 'text-black font-semibold' };
  }
  if (status.includes('Degraded') || status.includes('Tier 2')) {
    return { text: 'T2 - Warning', bgClass: 'bg-[#f59e0b]', textClass: 'text-black font-semibold' };
  }
  if (status.includes('Tier 3')) {
    return { text: 'T3 - Good', bgClass: 'bg-[#ffd000]', textClass: 'text-black font-semibold' };
  }
  return { text: 'T4 - Good', bgClass: 'bg-[#10b981]', textClass: 'text-black font-semibold' };
}

// Custom Y-Axis Tick matching SLB image labels
const CustomYAxisTick = ({ x, y, payload }: any) => {
  let color = '#94a3b8';
  let text = '';

  switch (payload.value) {
    case 4:
      color = '#94a3b8';
      text = 'Good - T4';
      break;
    case 3:
      color = '#94a3b8';
      text = 'Good - T3';
      break;
    case 2:
      color = '#94a3b8';
      text = 'Warn - T2';
      break;
    case 1:
      color = '#94a3b8';
      text = 'Crit. - T1';
      break;
    default:
      text = '';
  }

  return (
    <text x={x} y={y + 3} textAnchor="end" fill={color} fontSize={9} fontWeight={500}>
      {text}
    </text>
  );
};

// Tooltip matching SLB Side Drawer style
interface TooltipPayloadEntry {
  name: string;
  payload: {
    name: string;
    overallLabel: string;
    vibrationLabel: string;
    lubeOilLabel: string;
  };
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-[#121929] border border-[#222e47] p-2.5 rounded-lg shadow-2xl text-[11px] text-[#cbd5e1] flex flex-col gap-1.5 min-w-[190px]">
        <p className="font-bold text-[#f8fafc] text-xs pb-1 border-b border-[#222e47]">
          {data.name}
        </p>
        <p className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
            Vibration Status:
          </span>
          <span className="font-semibold text-[#c084fc]">
            {data.vibrationLabel}
          </span>
        </p>
        <p className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-[#94a3b8]">
            <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
            Lube Oil Status:
          </span>
          <span className="font-semibold text-[#fbbf24]">
            {data.lubeOilLabel}
          </span>
        </p>
      </div>
    );
  }
  return null;
};

export default function EquipmentDetailModal({
  isOpen,
  onClose,
  equipment,
  history = [],
  onLogNewAnalysis,
  onUpdateNonCollectionReason,
}: EquipmentDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSavingReason, setIsSavingReason] = useState(false);
  const [isReasonSaved, setIsReasonSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReasonChange = async (reason: string) => {
    if (!onUpdateNonCollectionReason) return;
    setIsSavingReason(true);
    setIsReasonSaved(false);
    try {
      await onUpdateNonCollectionReason(reason);
      setIsReasonSaved(true);
      setTimeout(() => {
        setIsReasonSaved(false);
      }, 2500);
    } finally {
      setIsSavingReason(false);
    }
  };

  if (!isOpen || !equipment) return null;

  const modalOverallCondition = getWorstTechniqueStatus(
    equipment.vibrationStatus,
    equipment.lubeOilStatus,
    equipment.condition
  );
  const eqCbmRisk = calculateEquipmentCbmRisk(equipment);

  const vibDate = equipment.lastVibrationUpdate || equipment.lastUpdate;
  const oilDate = equipment.lastLubeOilUpdate || equipment.lastUpdate;
  const vibFreq = formatFrequencyBadge(equipment.vibrationFrequency, 24);
  const oilFreq = formatFrequencyBadge(equipment.lubeOilFrequency, 84);

  const vibNext = calculateNextPlannedDate(vibDate, vibFreq, 24);
  const oilNext = calculateNextPlannedDate(oilDate, oilFreq, 84);

  const vibLastDateStr = vibDate ? vibDate.split(',')[0] : '08/09/2026';
  const oilLastDateStr = oilDate ? oilDate.split(',')[0] : '08/09/2026';

  const overallBadge = formatTierBadge(modalOverallCondition);
  const vibBadge = formatTierBadge(equipment.vibrationStatus);
  const oilBadge = formatTierBadge(equipment.lubeOilStatus);

  const formatStatusText = (status?: string | null) => {
    if (!status) return 'Good - Tier 4';
    if (status.includes(' - Tier ')) return status;
    if (status.includes('Good')) return 'Good - Tier 4';
    if (status.includes('Degraded')) return 'Degraded - Tier 2';
    if (status.includes('Critical')) return 'Critical - Tier 1';
    return status;
  };

  const getChartData = () => {
    if (!history || history.length === 0) {
      return [
        { name: '14 May', vibration: 4, vibrationLabel: 'Good - Tier 4', lubeOil: 4, lubeOilLabel: 'Good - Tier 4' },
        { name: '28 Jun', vibration: 3, vibrationLabel: 'Good - Tier 3', lubeOil: 4, lubeOilLabel: 'Good - Tier 4' },
        { name: '8 Sept', vibration: 1, vibrationLabel: 'Critical - Tier 1', lubeOil: 1, lubeOilLabel: 'Critical - Tier 1' },
      ];
    }

    return [...history].reverse().map((h) => {
      const date = new Date(h.changedAt);
      const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      const overallStr = formatStatusText(h.overallCondition);
      const vibrationStr = formatStatusText(h.vibrationStatus);
      const lubeStr = formatStatusText(h.lubeOilStatus);

      return {
        name: label,
        overall: CHART_VALUE_MAP[overallStr] ?? 4,
        overallLabel: overallStr,
        vibration: CHART_VALUE_MAP[vibrationStr] ?? 4,
        vibrationLabel: vibrationStr,
        lubeOil: CHART_VALUE_MAP[lubeStr] ?? 4,
        lubeOilLabel: lubeStr,
      };
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[998] flex justify-end animate-fadeIn">
      {/* Click outside to close backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* SLB Side Drawer Panel */}
      <aside
        data-testid="equipment-detail-drawer"
        className={`bg-[#0c1220] border-l border-[#1a233a] h-full h-screen shadow-2xl relative flex flex-col justify-between transition-all duration-300 ease-in-out z-10 ${
          isExpanded ? 'w-full max-w-[760px]' : 'w-full max-w-[490px]'
        }`}
      >
        {/* Scrollable Container */}
        <div className="overflow-y-auto flex-1 p-6 text-left">
          {/* Top Actions: Maximize / Minimize + Close X */}
          <div className="flex items-center justify-end gap-2 mb-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#94a3b8] hover:text-[#f8fafc] p-1.5 rounded-md hover:bg-[#19233c] transition-colors cursor-pointer"
              title={isExpanded ? 'Collapse drawer' : 'Expand drawer'}
            >
              {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-[#f8fafc] p-1.5 rounded-md hover:bg-[#19233c] transition-colors cursor-pointer"
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drawer Title */}
          <div className="mb-5">
            <h2 className="text-base font-bold text-[#f8fafc] tracking-wide">
              {equipment.tag} {equipment.name}
            </h2>
          </div>

          {/* Metadata Grid (Overall Status, Equipment Class, Latest Observation, Risk Indicators) */}
          <div className="flex flex-col gap-3 py-3 border-y border-[#18233a] text-xs">
            {/* Overall Status */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2">
              <span className="text-[#8a94a6] font-medium">Overall Status</span>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${overallBadge.bgClass} ${overallBadge.textClass}`}
                >
                  {overallBadge.text}
                </span>
              </div>
            </div>

            {/* Equipment Class */}
            <div className="grid grid-cols-[140px_1fr] items-start gap-2">
              <span className="text-[#8a94a6] font-medium">Equipment Class</span>
              <span className="text-[#f1f5f9] font-medium">
                {equipment.class ? `${formatEquipmentClass(equipment.class)} - ` : ''}
                {equipment.name}
              </span>
            </div>

            {/* Latest Observation */}
            <div className="grid grid-cols-[140px_1fr] items-start gap-2">
              <span className="text-[#8a94a6] font-medium">Latest Observation</span>
              <p className="text-[#f1f5f9] leading-relaxed">
                {equipment.observation || 'High vibration amplitude and particle contamination detected.'}
              </p>
            </div>

            {/* Preserved CBM Risk Indicators */}
            <div className="grid grid-cols-[140px_1fr] items-center gap-2 pt-1 border-t border-[#18233a]/60">
              <span className="text-[#8a94a6] font-medium">Risk Indicators</span>
              <div className="flex items-center gap-2">
                <span
                  className="bg-[#141b2d] border border-[#23314f] text-[10px] font-semibold px-2 py-0.5 rounded"
                  title={`Fault Risk: ${eqCbmRisk.faultRisk}/12`}
                >
                  <span className="text-[#8a94a6]">Fault: </span>
                  <span style={{ color: eqCbmRisk.faultColorHex }} className="font-bold">
                    {eqCbmRisk.faultRisk}/12
                  </span>
                </span>

                <span
                  className="bg-[#141b2d] border border-[#23314f] text-[10px] font-semibold px-2 py-0.5 rounded"
                  title={`Compliance Risk: ${eqCbmRisk.complianceRisk}/15`}
                >
                  <span className="text-[#8a94a6]">Compliance: </span>
                  <span style={{ color: eqCbmRisk.complianceResult.colorHex }} className="font-bold">
                    {eqCbmRisk.complianceRisk}/15
                  </span>
                </span>

                <span
                  className="bg-[#141b2d] border border-[#23314f] text-[10px] font-semibold px-2 py-0.5 rounded"
                  title={`Total CBM Risk: ${eqCbmRisk.totalRisk}/15`}
                >
                  <span className="text-[#8a94a6]">Total: </span>
                  <span style={{ color: eqCbmRisk.totalColorHex }} className="font-bold">
                    {eqCbmRisk.totalRisk}/15
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Techniques Section (Vibration & Lube Oil Analysis) */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-y border-[#1c253b] my-4 divide-y md:divide-y-0 md:divide-x divide-[#1c253b]">
            {/* Vibration Analysis Column */}
            <div className="py-3 md:pr-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#f8fafc] font-bold text-[13px] tracking-wide">
                  Vibration Analysis
                </span>
                <span className="bg-[#242f48] text-[#94a3b8] text-[10px] font-medium rounded px-2 py-0.5 shrink-0">
                  {vibFreq}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Tier:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase ${vibBadge.bgClass} ${vibBadge.textClass}`}
                  >
                    {vibBadge.text}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Last:</span>
                  <span className="text-[#f8fafc] text-xs font-normal">
                    {vibLastDateStr}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Next:</span>
                  <span className={`text-xs ${vibNext.isOverdue ? 'text-[#ff5a5f] font-semibold' : 'text-[#f8fafc] font-normal'}`}>
                    {vibNext.plannedDateStr}
                  </span>
                </div>
              </div>
            </div>

            {/* Lube Oil Analysis Column */}
            <div className="py-3 md:pl-4 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[#f8fafc] font-bold text-[13px] tracking-wide">
                  Lube Oil Analysis
                </span>
                <span className="bg-[#242f48] text-[#94a3b8] text-[10px] font-medium rounded px-2 py-0.5 shrink-0">
                  {oilFreq}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Tier:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase ${oilBadge.bgClass} ${oilBadge.textClass}`}
                  >
                    {oilBadge.text}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Last:</span>
                  <span className="text-[#f8fafc] text-xs font-normal">
                    {oilLastDateStr}
                  </span>
                </div>
                <div>
                  <span className="text-[#8a94a6] text-[11px] block mb-1">Next:</span>
                  <span className={`text-xs ${oilNext.isOverdue ? 'text-[#ff5a5f] font-semibold' : 'text-[#f8fafc] font-normal'}`}>
                    {oilNext.plannedDateStr}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* General Non-collection Reason (Enabled if Vibration, Lube Oil or both are Overdue) */}
          {(vibNext.isOverdue || oilNext.isOverdue) && (
            <div className="bg-[#101726]/80 border border-[#1c253b] rounded-lg p-3 my-3 animate-fadeIn">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-semibold text-[#ff5a5f] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff5a5f]" />
                  Non-collection Reason (Overdue)
                </span>
                {isSavingReason && (
                  <span className="text-[10px] text-[#94a3b8] animate-pulse">Saving...</span>
                )}
                {isReasonSaved && (
                  <span className="text-[10px] text-[#10b981] font-semibold">Saved ✓</span>
                )}
              </div>
              <select
                aria-label="Non-collection Reason"
                value={equipment.nonCollectionReason || 'Not collected'}
                onChange={(e) => handleReasonChange(e.target.value)}
                className="bg-[#0b101d] border border-[#2d3a58] hover:border-[#3b82f6] focus:border-[#38bdf8] text-[#f8fafc] text-xs rounded px-2.5 py-1.5 outline-none transition-colors cursor-pointer w-full"
              >
                {NON_COLLECTION_REASONS.map((r) => (
                  <option key={r} value={r} className="bg-[#0b101d] text-[#f8fafc]">
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Historical Condition Trend */}
          <div className="my-5">
            <h4 className="text-xs font-bold text-[#f8fafc] mb-4">
              Historical condition trend
            </h4>

            {mounted ? (
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={getChartData()} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c253b" vertical={false} opacity={0.6} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: '#1c253b', strokeWidth: 1 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={9}
                    axisLine={false}
                    tickLine={false}
                    domain={[0.5, 4.3]}
                    ticks={[1, 2, 3, 4]}
                    tick={<CustomYAxisTick />}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />

                  {/* Vibration Trend: Purple Dashed with Solid Dots */}
                  <Line
                    name="Vibration Status"
                    type="monotone"
                    dataKey="vibration"
                    stroke="#a855f7"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 4, fill: '#a855f7', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />

                  {/* Lube Oil Trend: Amber/Orange Dashed with Solid Dots */}
                  <Line
                    name="Lube Oil Status"
                    type="monotone"
                    dataKey="lubeOil"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    strokeDasharray="2 2"
                    dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[230px] flex items-center justify-center text-[#64748b] text-xs">
                Loading trend...
              </div>
            )}
          </div>
        </div>

        {/* Drawer Bottom Bar: Log New Analysis Button */}
        {onLogNewAnalysis && (
          <div className="p-6 bg-transparent flex items-center justify-end">
            <button
              type="button"
              onClick={onLogNewAnalysis}
              className="border border-[#334155] bg-[#0c1220] hover:border-[#38bdf8] text-[#f8fafc] px-6 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-md"
            >
              Log New Analysis
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
