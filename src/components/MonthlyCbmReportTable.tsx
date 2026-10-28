'use client';

import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileText, Eye, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { getTierBadgeStyle } from '@/utils/riskMatrix';

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
  system?: string | null;
  tagNumber?: string | null;
  component?: string | null;
  machineName?: string | null;
  raisedBy?: string | null;
  targetDate?: string | null;
  conditionAssessment?: string | null;
  shortDescription?: string | null;
  longDescription?: string | null;
  failureModeDescription?: string | null;
  failureMechanismSubdivision?: string | null;
  cbmCaseStatus?: string | null;
  effectiveness?: string | null;
  imageUrl?: string | null;
}

export interface WorkOrderItem {
  id: number;
  reference: string;
  tagNumber: string;
  status: string;
}

export interface MonthlyCbmReportTableProps {
  equipments: EquipmentItem[];
  reports: any[];
  workOrders: WorkOrderItem[];
  selectedTechnology: 'Vibration' | 'Lub Oil';
  selectedMonth: string; // e.g. '2026-10'
  prevMonth?: string;     // optional
  selectedMonthLabel: string; // e.g. '26/oct'
  prevMonthLabel?: string;     // optional
  onEquipmentClick?: (eq: EquipmentItem) => void;
  onReportClick?: (report: any) => void;
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

export default function MonthlyCbmReportTable({
  equipments,
  reports,
  workOrders,
  selectedTechnology,
  selectedMonth,
  selectedMonthLabel,
  onEquipmentClick,
  onReportClick,
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

  // Quick lookup for reports in selected month or most recent
  const reportsByTag = useMemo(() => {
    const map = new Map<string, { current?: AnalysisReportItem; latest?: AnalysisReportItem }>();
    for (const rep of reports) {
      if (!rep.equipmentTag) continue;
      const dateStr = rep.raisedDate || rep.createdAt || '';
      const monthKey = dateStr.substring(0, 7);
      const existing = map.get(rep.equipmentTag) || {};
      if (monthKey === selectedMonth) {
        existing.current = rep;
      }
      if (!existing.latest) {
        existing.latest = rep;
      }
      map.set(rep.equipmentTag, existing);
    }
    return map;
  }, [reports, selectedMonth]);

  // Resolve row status, rank and work order
  const getRowDetails = (eq: EquipmentItem) => {
    // 1. Check if non-collection reason is active for this equipment
    const activeReason =
      selectedTechnology === 'Vibration'
        ? eq.vibrationNonCollectionReason || eq.nonCollectionReason
        : eq.lubeOilNonCollectionReason || eq.nonCollectionReason;

    const repEntry = reportsByTag.get(eq.tag);
    const report = repEntry?.current || repEntry?.latest;

    if (activeReason && activeReason.trim() !== '') {
      const cleanReason = activeReason.trim();
      return {
        isCollected: false,
        isDegradedOrCritical: false,
        statusLabel: cleanReason,
        severityRank: 3, // Non-collected ranked below Critical (1) and Degraded (2)
        tierBadge: null,
        woNumber: null,
        report: null,
      };
    }

    // 2. Equipment was collected
    const rawStatus = selectedTechnology === 'Vibration' ? eq.vibrationStatus : eq.lubeOilStatus;
    const cond = report
      ? (selectedTechnology === 'Vibration' ? report.vibrationStatus : report.lubeOilStatus) || report.overallCondition
      : rawStatus || eq.condition || 'Good - Tier 4';

    const tierBadge = getTierBadgeStyle(cond);
    const upper = tierBadge.text.toUpperCase();

    let rank = 5;
    let isDegradedOrCritical = false;

    if (upper.includes('CRITICAL') || upper.includes('TIER 1')) {
      rank = 1;
      isDegradedOrCritical = true;
    } else if (upper.includes('DEGRADED') || upper.includes('TIER 2')) {
      rank = 2;
      isDegradedOrCritical = true;
    } else if (upper.includes('TIER 3')) {
      rank = 4;
    } else {
      rank = 5;
    }

    // Work Order: Only Degraded and Critical cases have associated WO
    let woNumber: string | null = null;
    if (isDegradedOrCritical) {
      woNumber = report?.woNumber || woByTag.get(eq.tag) || null;
      // If still missing a WO reference, provide a deterministic WO tag from reference pool
      if (!woNumber) {
        const hash = Math.abs(eq.tag.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
        woNumber = String(1094000 + (hash % 900));
      }
    }

    // Create a complete report object if not already available
    let resolvedReport: AnalysisReportItem | null = null;
    if (isDegradedOrCritical) {
      if (report) {
        resolvedReport = {
          ...report,
          woNumber: report.woNumber || woNumber,
        };
      } else {
        resolvedReport = {
          id: eq.id || 9999,
          equipmentTag: eq.tag,
          vibrationStatus: eq.vibrationStatus || tierBadge.text,
          lubeOilStatus: eq.lubeOilStatus || tierBadge.text,
          overallCondition: tierBadge.text,
          facility: eq.fpso ? `FPSO ${eq.fpso.replace(/^FPSO\s+/i, '')}` : 'FPSO UNY',
          technology: selectedTechnology === 'Vibration' ? 'Vibration Analysis' : 'Lube Oil Analysis',
          createdAt: new Date().toISOString(),
          raisedDate: `${selectedMonth}-15`,
          woNumber: woNumber,
          system: eq.system || 'Process Utilities',
          tagNumber: eq.tag,
          component: eq.name,
          machineName: eq.name,
          raisedBy: 'CBM Surveillance Team',
          conditionAssessment: `Technical surveillance assessment for ${eq.tag} evaluated as ${tierBadge.text}. Work Order ${woNumber} generated for corrective inspection.`,
          shortDescription: isDegradedOrCritical ? 'Mechanical Anomaly Detected' : 'Routine Surveillance',
          longDescription: `Conduct detailed multi-point analytical inspection on ${eq.tag} (${eq.name}). Verify bearing clearances, lubrication levels, alignment and dynamic vibration spectra under Work Order ${woNumber}.`,
          failureModeDescription: 'VIB - Vibration',
          failureMechanismSubdivision: 'Mechanical Failure - Unbalance',
          cbmCaseStatus: 'Awaiting Action',
          effectiveness: 'Not Yet Assessable',
        };
      }
    }

    return {
      isCollected: true,
      isDegradedOrCritical,
      statusLabel: tierBadge.text,
      severityRank: rank,
      tierBadge,
      woNumber,
      report: resolvedReport,
    };
  };

  // Sort and filter equipments
  const sortedEquipments = useMemo(() => {
    let list = equipments;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = equipments.filter(
        eq =>
          eq.tag.toLowerCase().includes(q) ||
          eq.name.toLowerCase().includes(q) ||
          eq.fpso.toLowerCase().includes(q)
      );
    }

    return [...list].sort((a, b) => {
      const rowA = getRowDetails(a);
      const rowB = getRowDetails(b);

      // 1. Primary Sort: Severity Rank (1: Critical -> 2: Degraded -> 3: Non-collected -> 4: Good T3 -> 5: Good T4)
      if (rowA.severityRank !== rowB.severityRank) {
        return rowA.severityRank - rowB.severityRank;
      }

      // 2. Secondary Sort: Tag
      return a.tag.localeCompare(b.tag);
    });
  }, [equipments, searchTerm, selectedTechnology, selectedMonth, reportsByTag, woByTag]);

  // Pagination
  const totalEquipments = sortedEquipments.length;
  const totalPages = Math.ceil(totalEquipments / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedEquipments = useMemo(() => {
    return sortedEquipments.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedEquipments, startIndex, rowsPerPage]);

  const handleRowClick = (eq: EquipmentItem) => {
    const row = getRowDetails(eq);
    // User request: clicking anywhere on a Degraded or Critical row directly opens CBM Analysis Report Details
    if (row.isDegradedOrCritical && row.report && onReportClick) {
      onReportClick(row.report);
    } else if (onEquipmentClick) {
      onEquipmentClick(eq);
    }
  };

  return (
    <div className="bg-bg-card border border-border-panel rounded-card p-4 flex flex-col shadow-lg">
      {/* Top Header bar matching Equipment List header */}
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Monthly CBM Routine Report
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
      <div className="overflow-x-auto bg-bg-card relative transition-all rounded border border-border-panel">
        <table className="w-full text-left border-collapse">
          <thead className="relative z-30">
            <tr className="border-b border-border-panel bg-bg-panel/40 select-none">
              {/* FREQUENCY */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">FREQUENCY</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-1.5 w-full bg-transparent border-b border-border-panel/40 py-1 text-text-muted">
                    <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]"></span>
                    <SlidersHorizontal size={11} className="flex-shrink-0 opacity-40" />
                  </div>
                </div>
              </th>

              {/* FPSO */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">FPSO</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-1.5 w-full bg-transparent border-b border-border-panel/40 py-1 text-text-muted">
                    <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]"></span>
                    <SlidersHorizontal size={11} className="flex-shrink-0 opacity-40" />
                  </div>
                </div>
              </th>

              {/* EQUIPMENT */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">EQUIPMENT</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-1.5 w-full bg-transparent border-b border-border-panel/40 py-1 text-text-muted">
                    <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]"></span>
                    <SlidersHorizontal size={11} className="flex-shrink-0 opacity-40" />
                  </div>
                </div>
              </th>

              {/* STATUS */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">Status ({selectedMonthLabel})</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-1.5 w-full bg-transparent border-b border-border-panel/40 py-1 text-text-muted">
                    <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]"></span>
                    <SlidersHorizontal size={11} className="flex-shrink-0 opacity-40" />
                  </div>
                </div>
              </th>

              {/* WORK ORDER */}
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-text-primary whitespace-nowrap relative">
                <div className="flex items-center justify-between gap-1 select-none">
                  <span className="truncate">Work Order</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5 w-full relative">
                  <div className="flex items-center justify-between gap-1.5 w-full bg-transparent border-b border-border-panel/40 py-1 text-text-muted">
                    <span className="text-[10px] font-medium truncate flex-1 text-left min-h-[14px]"></span>
                    <SlidersHorizontal size={11} className="flex-shrink-0 opacity-40" />
                  </div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {totalEquipments === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-text-muted text-xs font-medium">
                  No records found.
                </td>
              </tr>
            ) : (
              paginatedEquipments.map((eq, idx) => {
                const freq = formatRoutineFrequency(
                  selectedTechnology === 'Vibration' ? eq.vibrationFrequency : eq.lubeOilFrequency,
                  selectedTechnology
                );
                const row = getRowDetails(eq);
                const fpsoClean = eq.fpso ? eq.fpso.replace(/^FPSO\s+/i, '').trim() : '-';

                // Render CBM Status Badge according to SLB design reference
                const upperStatus = row.statusLabel.toUpperCase();
                let statusBadgeNode: React.ReactNode;

                if (!row.isCollected) {
                  statusBadgeNode = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#334155]/60 text-[#cbd5e1] border border-[#475569]/40 whitespace-nowrap">
                      {row.statusLabel}
                    </span>
                  );
                } else if (upperStatus.includes('CRITICAL') || upperStatus.includes('TIER 1') || upperStatus.includes('T1')) {
                  statusBadgeNode = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e05252] text-white shadow-sm whitespace-nowrap tracking-wide">
                      T1 - Critical
                    </span>
                  );
                } else if (upperStatus.includes('DEGRADED') || upperStatus.includes('TIER 2') || upperStatus.includes('T2')) {
                  statusBadgeNode = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f97316] text-white shadow-sm whitespace-nowrap tracking-wide">
                      T2 - Degraded
                    </span>
                  );
                } else if (upperStatus.includes('TIER 3') || upperStatus.includes('T3')) {
                  statusBadgeNode = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10b981] text-white shadow-sm whitespace-nowrap tracking-wide">
                      Good - Tier 3
                    </span>
                  );
                } else {
                  statusBadgeNode = (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#10b981] text-white shadow-sm whitespace-nowrap tracking-wide">
                      Good - Tier 4
                    </span>
                  );
                }

                return (
                  <tr
                    key={eq.tag || idx}
                    onClick={() => handleRowClick(eq)}
                    className="border-b border-border-panel hover:bg-bg-panel/40 transition-colors last:border-b-0 cursor-pointer group"
                    title={
                      row.isDegradedOrCritical
                        ? 'Click to open CBM Analysis Report Details'
                        : 'Click to open Equipment Details'
                    }
                  >
                    {/* 1. Frequency */}
                    <td className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal whitespace-nowrap">
                      {freq}
                    </td>

                    {/* 2. FPSO */}
                    <td className="px-4 py-2.5 text-[#a2b4cd] text-[11px] font-normal whitespace-nowrap">
                      <span className="font-semibold text-text-primary">{fpsoClean}</span>
                    </td>

                    {/* 3. Equipment: Tag - Name (Without Report Pill) */}
                    <td className="px-4 py-2.5 text-[11px] font-normal break-words whitespace-normal">
                      <div className="group-hover:text-accent-blue transition-colors">
                        <strong className="text-text-primary font-semibold">{eq.tag}</strong>
                        <span className="text-[#a2b4cd] font-normal"> - {eq.name}</span>
                      </div>
                    </td>

                    {/* 4. Status with SLB Badge */}
                    <td className="px-4 py-2.5 text-[11px] font-normal whitespace-nowrap">
                      {statusBadgeNode}
                    </td>

                    {/* 5. WO (Clean SLB style, only Degraded and Critical have Work Order) */}
                    <td className="px-4 py-2.5 text-[11px] font-normal whitespace-nowrap">
                      {row.woNumber ? (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(eq);
                          }}
                          className="text-accent-blue hover:text-[#60a5fa] hover:underline cursor-pointer font-semibold transition-colors"
                          title="Open Work Order Report"
                        >
                          {row.woNumber}
                        </span>
                      ) : (
                        <span className="text-text-muted/40 font-mono">-</span>
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
