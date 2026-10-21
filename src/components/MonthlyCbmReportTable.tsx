'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';

export interface EquipmentItem {
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
  thermographyStatus?: string;
  lastUpdate: string;
  observation?: string | null;
  frequency?: string | null;
  vibrationFrequency?: string | null;
  lubeOilFrequency?: string | null;
  lastVibrationUpdate?: string | null;
  lastLubeOilUpdate?: string | null;
  nonCollectionReason?: string | null;
  vibrationNonCollectionReason?: string | null;
  lubeOilNonCollectionReason?: string | null;
}

export interface AnalysisReportItem {
  id: number;
  equipmentTag: string;
  vibrationStatus: string;
  lubeOilStatus: string;
  overallCondition: string;
  facility: string;
  technology?: string | null;
  createdAt: string;
  raisedDate?: string | null;
  woNumber?: string | null;
}

export interface WorkOrderItem {
  id: number;
  reference: string;
  tagNumber: string;
  status: string;
}

interface MonthlyCbmReportTableProps {
  equipments: EquipmentItem[];
  reports: AnalysisReportItem[];
  workOrders: WorkOrderItem[];
  selectedTechnology: 'Vibration' | 'Lub Oil';
  selectedMonth: string; // e.g. '2026-10'
  prevMonth: string;     // e.g. '2026-09'
  selectedMonthLabel: string; // e.g. '26/oct'
  prevMonthLabel: string;     // e.g. '26/sep'
  onEquipmentClick?: (eq: EquipmentItem) => void;
}

function formatRoutineFrequency(rawFreq: string | null | undefined, tech: 'Vibration' | 'Lub Oil'): string {
  if (!rawFreq) return `1 Monthly ${tech}`;
  const clean = rawFreq.toUpperCase();
  if (clean.includes('84') || clean.includes('90') || clean.includes('QUARTER') || clean.includes('3')) {
    return `3 Monthly ${tech}`;
  }
  if (clean.includes('180') || clean.includes('6')) {
    return `6 Monthly ${tech}`;
  }
  return `1 Monthly ${tech}`;
}

function formatStatusTier(status?: string | null): string {
  if (!status) return 'Good - Tier 4';
  if (status.includes(' - Tier ')) return status;
  if (status.includes('Tier 1') || status.startsWith('Critical')) return 'Critical - Tier 1';
  if (status.includes('Tier 2') || status.startsWith('Degraded')) return 'Degraded - Tier 2';
  if (status.includes('Tier 3')) return 'Good - Tier 3';
  if (status.includes('Tier 4') || status.startsWith('Good')) return 'Good - Tier 4';
  return status;
}

export default function MonthlyCbmReportTable({
  equipments,
  reports,
  workOrders,
  selectedTechnology,
  selectedMonth,
  prevMonth,
  selectedMonthLabel,
  prevMonthLabel,
  onEquipmentClick,
}: MonthlyCbmReportTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);

  // Quick lookup for work orders by tag
  const woByTag = useMemo(() => {
    const map = new Map<string, string>();
    for (const wo of workOrders) {
      if (wo.tagNumber && !map.has(wo.tagNumber)) {
        map.set(wo.tagNumber, wo.reference);
      }
    }
    return map;
  }, [workOrders]);

  // Quick lookup for reports in previous and selected months
  const reportsByTagAndMonth = useMemo(() => {
    const map = new Map<string, { prev?: AnalysisReportItem; current?: AnalysisReportItem }>();
    for (const rep of reports) {
      if (!rep.equipmentTag) continue;
      const dateStr = rep.raisedDate || rep.createdAt || '';
      const monthKey = dateStr.substring(0, 7);
      const existing = map.get(rep.equipmentTag) || {};
      if (monthKey === prevMonth) {
        existing.prev = rep;
      }
      if (monthKey === selectedMonth) {
        existing.current = rep;
      }
      map.set(rep.equipmentTag, existing);
    }
    return map;
  }, [reports, selectedMonth, prevMonth]);

  // Determine monthly status with SLB dot indicator + White text (matching Equipment List)
  const getStatusIndicator = (eq: EquipmentItem, isPrevious: boolean) => {
    const repData = reportsByTagAndMonth.get(eq.tag);
    const reportForMonth = isPrevious ? repData?.prev : repData?.current;

    // Check reason on equipment
    const activeReason =
      selectedTechnology === 'Vibration'
        ? eq.vibrationNonCollectionReason || eq.nonCollectionReason
        : eq.lubeOilNonCollectionReason || eq.nonCollectionReason;

    // If there is an active non-collection reason or overdue
    if (activeReason && activeReason.trim() !== '') {
      const cleanReason = activeReason.trim();
      const isNotCollected = cleanReason.toLowerCase() === 'not collected';
      return {
        label: cleanReason,
        dotColor: isNotCollected ? 'bg-slate-400' : 'bg-orange-500',
      };
    }

    // Condition with Tier
    const rawStatus =
      selectedTechnology === 'Vibration' ? eq.vibrationStatus : eq.lubeOilStatus;
    const cond = reportForMonth
      ? (selectedTechnology === 'Vibration' ? reportForMonth.vibrationStatus : reportForMonth.lubeOilStatus) || reportForMonth.overallCondition
      : rawStatus || eq.condition || 'Good - Tier 4';

    const formattedTier = formatStatusTier(cond);
    const upper = formattedTier.toUpperCase();

    if (upper.includes('CRITICAL') || upper.includes('TIER 1')) {
      return {
        label: formattedTier,
        dotColor: 'bg-status-error',
      };
    }
    if (upper.includes('DEGRADED') || upper.includes('TIER 2')) {
      return {
        label: formattedTier,
        dotColor: 'bg-status-warn',
      };
    }
    return {
      label: formattedTier,
      dotColor: 'bg-status-ok',
    };
  };

  // Filtered equipments
  const filteredEquipments = useMemo(() => {
    if (!searchTerm.trim()) return equipments;
    const q = searchTerm.toLowerCase();
    return equipments.filter(
      eq =>
        eq.tag.toLowerCase().includes(q) ||
        eq.name.toLowerCase().includes(q) ||
        eq.fpso.toLowerCase().includes(q)
    );
  }, [equipments, searchTerm]);

  // Pagination
  const totalEquipments = filteredEquipments.length;
  const totalPages = Math.ceil(totalEquipments / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedEquipments = useMemo(() => {
    return filteredEquipments.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredEquipments, startIndex, rowsPerPage]);

  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col">
      {/* Top Header bar matching Equipment List header */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            Monthly CBM Routine Report
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-accent-blue/10 text-accent-blue border border-accent-blue/30">
              {selectedTechnology} Routine
            </span>
          </h3>
        </div>

        {/* Quick Search */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={12} className="absolute left-2.5 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search equipment, tag, FPSO..."
              className="w-full bg-[#111827] border border-border-panel/80 rounded pl-7 pr-2.5 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none placeholder:text-text-muted/60"
            />
          </div>
        </div>
      </div>

      {/* Table matching Equipment List / CustomTable styling */}
      <div className="overflow-x-auto bg-bg-card relative transition-all">
        <table className="w-full text-left border-collapse">
          <thead className="relative z-30">
            <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
              {/* Frequency */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">Frequency</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>

              {/* FPSO */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">FPSO</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>

              {/* Equipment */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">Equipment</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>

              {/* Previous Month */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">{prevMonthLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>

              {/* Selected Month */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">{selectedMonthLabel}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>

              {/* WO */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">WO</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full">
                  <div className="w-full border-b border-border-panel/40 py-1 min-h-[14px]" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {totalEquipments === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-text-muted text-xs font-medium">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedEquipments.map((eq, idx) => {
                const freq = formatRoutineFrequency(
                  selectedTechnology === 'Vibration' ? eq.vibrationFrequency : eq.lubeOilFrequency,
                  selectedTechnology
                );
                const prevStatus = getStatusIndicator(eq, true);
                const curStatus = getStatusIndicator(eq, false);
                const woNumber = woByTag.get(eq.tag);
                const fpsoClean = eq.fpso ? eq.fpso.replace(/^FPSO\s+/i, '').trim() : '-';

                return (
                  <tr
                    key={eq.tag || idx}
                    onClick={() => onEquipmentClick && onEquipmentClick(eq)}
                    className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors last:border-b-0 cursor-pointer group"
                    title="Click to view equipment details"
                  >
                    {/* 1. Frequency */}
                    <td className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal whitespace-nowrap">
                      {freq}
                    </td>

                    {/* 2. FPSO */}
                    <td className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal whitespace-nowrap">
                      {fpsoClean}
                    </td>

                    {/* 3. Equipment: Tag - Name */}
                    <td className="px-4 py-2.5 text-[11px] font-normal break-words whitespace-normal">
                      <div className="flex items-center justify-between gap-2">
                        <span className="group-hover:text-accent-blue transition-colors">
                          <strong className="text-text-primary font-semibold">{eq.tag}</strong>
                          <span className="text-[#a2b4cd] font-normal"> - {eq.name}</span>
                        </span>
                        <Eye size={12} className="opacity-0 group-hover:opacity-100 text-accent-blue shrink-0 transition-opacity" />
                      </div>
                    </td>

                    {/* 4. Previous Month Status: colored dot + WHITE text */}
                    <td className="px-4 py-2.5 text-[11px] font-normal whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${prevStatus.dotColor}`} />
                        <span className="text-text-primary font-medium">{prevStatus.label}</span>
                      </span>
                    </td>

                    {/* 5. Selected Month Status: colored dot + WHITE text */}
                    <td className="px-4 py-2.5 text-[11px] font-normal whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${curStatus.dotColor}`} />
                        <span className="text-text-primary font-medium">{curStatus.label}</span>
                      </span>
                    </td>

                    {/* 6. WO */}
                    <td className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal whitespace-nowrap">
                      {woNumber ? (
                        <span className="text-accent-blue hover:underline cursor-pointer font-medium hover:text-[#38bdf8] transition-colors">
                          {woNumber}
                        </span>
                      ) : (
                        <span className="text-text-muted/40">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component matching CustomTable / Equipment List */}
      <div className="flex items-center justify-end gap-6 mt-4 text-[11px] text-text-muted select-none">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-bg-card border border-border-panel rounded px-1.5 py-0.5 text-text-primary focus:outline-none text-[11px] cursor-pointer"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={totalEquipments}>All</option>
          </select>
        </div>
        <div>
          <span>
            {totalEquipments > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + rowsPerPage, totalEquipments)} of {totalEquipments}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="First Page"
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Previous Page"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="px-2 text-text-primary font-semibold">{currentPage}</span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Next Page"
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted cursor-pointer transition-colors"
            title="Last Page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
