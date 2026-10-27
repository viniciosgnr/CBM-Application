'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import KpiMetricCard from '@/components/KpiMetricCard';
import CustomTable from '@/components/CustomTable';
import EquipmentDetailModal from '@/components/EquipmentDetailModal';
import MonthlyCbmReportTable from '@/components/MonthlyCbmReportTable';
import { CollectionCompliancePie, FailureMechanismsPie } from '@/components/KpiSecondaryCharts';
import { 
  ArrowLeft, 
  X, 
  RefreshCw, 
  FileText, 
  PlusCircle,
  Calendar,
  User,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Search,
  Activity,
  Filter,
  Maximize2,
  Minimize2,
  Trash2,
  Download,
  Info,
} from 'lucide-react';
import {
  WorkOrderStatusPie,
  DaysLeftBar,
  EquipmentConditionPie,
  CbmCriticalityBar,
  MonthlyConditionBarChart,
  isWithinTimeRange
} from '@/components/MetricCharts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';
import {
  calculateCombinedRisk,
  calculateRiskScore,
  getWorstTechniqueStatus,
  calculateOverallHealth,
  calculateFleetCbmRiskSummary,
  formatEquipmentClass,
  getTierBadgeStyle,
} from '@/utils/riskMatrix';
import { resolveCbmCaseStatus } from '@/utils/cbmCaseStatus';
import {
  FAILURE_MODE_OPTIONS,
  FAILURE_MECHANISM_SUBDIVISION_OPTIONS,
} from '@/utils/taxonomy';

interface Equipment {
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

interface HistoryEntry {
  id: number;
  equipmentTag: string;
  vibrationStatus: string;
  lubeOilStatus: string;
  overallCondition: string;
  changedAt: string;
}

interface AnalysisReport {
  id: number;
  equipmentTag: string;
  vibrationStatus: string;
  lubeOilStatus: string;
  thermographyStatus?: string | null;
  overallCondition: string;
  facility: string;
  system: string;
  tagNumber: string;
  cmmsNumber?: string | null;
  cof?: string | null;
  location?: string | null;
  machineName?: string | null;
  mcProtection?: string | null;
  operatingContext?: string | null;
  technology?: string | null;
  component?: string | null;
  raisedBy: string;
  raisedDate: string;
  targetDate?: string | null;
  shortDescription: string;
  woNumber?: string | null;
  conditionAssessment: string;
  longDescription: string;
  imageUrl?: string | null;
  equipmentClass?: string | null;
  subunit?: string | null;
  maintainableItem?: string | null;
  failureModeDescription?: string | null;
  failureMechanismSubdivision?: string | null;
  effectiveness?: string | null;
  cbmCaseStatus?: string | null;
  createdAt: string;
}

const EFFECTIVENESS_DESCRIPTIONS: Record<string, string> = {
  'Effective': 'Effective: the executed action addressed the identified condition and the available evidence supports the intended technical outcome;',
  'Partially Effective': 'Partially Effective: the action addressed part of the identified condition, but further action or monitoring remains necessary;',
  'Ineffective': 'Ineffective: the action did not address the identified condition or did not produce the intended technical outcome; or',
  'Not Yet Assessable': 'Not Yet Assessable: available feedback or post-action evidence is insufficient to determine effectiveness.',
  'Pending Assessment': 'Pending Assessment: Work Order action completed. Awaiting CBM technical assessment to close the case.',
  'N/A': 'N/A: Not applicable (routine baseline surveillance with no corrective action required).',
};

interface WorkOrder {
  id: number;
  reference: string;
  fpso: string;
  description: string;
  priority: string;
  status: string;
  tagNumber: string;
  tagDescription: string;
  monitoringTechnique: string;
  creationDate: string;
  dueDate: string;
  reportId?: number | null;
  woSite?: string | null;
  directive?: string | null;
  maintOrg?: string | null;
  workType?: string | null;
  externalSource?: string | null;
  externalSourceId?: string | null;
  faultDesc?: string | null;
  symptom?: string | null;
  discovery?: string | null;
  actionId?: string | null;
  operationalStatus?: string | null;
  attachedFilename?: string | null;
  attachedFileSize?: number | null;
}


const ALL_RECOM_FPSOS = ['DNY', 'UNY', 'PTY', 'ONE'];

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'work-order' | 'recommendations' | 'kpis'>('work-order');
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);

  // KPIs tab states (SLB Optisite standard)
  const [selectedKpiFpsos, setSelectedKpiFpsos] = useState<Set<string>>(new Set());
  const [kpiFpsoPopoverOpen, setKpiFpsoPopoverOpen] = useState(false);
  const [kpiFpsoSearch, setKpiFpsoSearch] = useState('');
  const kpiFpsoPopoverRef = useRef<HTMLDivElement>(null);
  const [kpiTrendTimeRange, setKpiTrendTimeRange] = useState<string>('Last 6 Months');

  // Technology, Month & Trend Tab filters for KPIs
  const [selectedKpiTechnology, setSelectedKpiTechnology] = useState<'Vibration' | 'Lub Oil'>('Vibration');
  const [selectedKpiMonth, setSelectedKpiMonth] = useState<string>('2026-10');
  const [kpiMonthPopoverOpen, setKpiMonthPopoverOpen] = useState(false);
  const kpiMonthPopoverRef = useRef<HTMLDivElement>(null);
  const [selectedTrendTab, setSelectedTrendTab] = useState<'health' | 'compliance' | 'risk'>('health');

  const availableKpiMonths = useMemo(() => [
    { key: '2026-10', label: 'October (Current)', shortLabel: 'October', prevKey: '2026-09', prevShortLabel: 'September' },
    { key: '2026-09', label: 'September', shortLabel: 'September', prevKey: '2026-08', prevShortLabel: 'August' },
    { key: '2026-08', label: 'August', shortLabel: 'August', prevKey: '2026-07', prevShortLabel: 'July' },
    { key: '2026-07', label: 'July', shortLabel: 'July', prevKey: '2026-06', prevShortLabel: 'June' },
    { key: '2026-06', label: 'June', shortLabel: 'June', prevKey: '2026-05', prevShortLabel: 'May' },
    { key: '2026-05', label: 'May', shortLabel: 'May', prevKey: '2026-04', prevShortLabel: 'April' },
  ], []);

  const currentMonthConfig = useMemo(() => {
    return availableKpiMonths.find(m => m.key === selectedKpiMonth) || availableKpiMonths[0];
  }, [availableKpiMonths, selectedKpiMonth]);

  // Per-chart time range states
  const [woStatusTimeRange, setWoStatusTimeRange] = useState('Last Month');
  const [daysLeftTimeRange, setDaysLeftTimeRange] = useState('Last Week');
  const [equipCondTimeRange, setEquipCondTimeRange] = useState('Last Month');
  const [cbmCritTimeRange, setCbmCritTimeRange] = useState('Last Month');

  // Interactive bi-directional filter states for Equipment page
  const [selectedEquipmentFilters, setSelectedEquipmentFilters] = useState<Record<string, Set<string>>>({});
  const [selectedConditionChart, setSelectedConditionChart] = useState<string | null>(null);
  const [selectedCriticalityChart, setSelectedCriticalityChart] = useState<string | null>(null);

  // Global time range handler for Equipment page
  const handleEquipGlobalTimeRangeChange = (newRange: string) => {
    setEquipCondTimeRange(newRange);
    setCbmCritTimeRange(newRange);
  };

  // Toggle chart condition selection (Donut -> Table sync)
  const handleChartConditionClick = (conditionName: string) => {
    const nextCondition = selectedConditionChart === conditionName ? null : conditionName;
    setSelectedConditionChart(nextCondition);

    setSelectedEquipmentFilters(prev => {
      const next = { ...prev };
      if (nextCondition) {
        next['condition'] = new Set([nextCondition]);
      } else {
        delete next['condition'];
      }
      return next;
    });
  };

  // Toggle chart criticality selection (Bar -> Table sync)
  const handleChartCriticalityClick = (criticalityName: string) => {
    const nextCrit = selectedCriticalityChart === criticalityName ? null : criticalityName;
    setSelectedCriticalityChart(nextCrit);

    setSelectedEquipmentFilters(prev => {
      const next = { ...prev };
      if (nextCrit) {
        next['criticality'] = new Set([nextCrit]);
      } else {
        delete next['criticality'];
      }
      return next;
    });
  };

  // Clear all equipment filters
  const handleClearAllEquipFilters = () => {
    setSelectedEquipmentFilters({});
    setSelectedConditionChart(null);
    setSelectedCriticalityChart(null);
  };

  // States for DB data
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);

  // Equipments filtered by active table column popover selections for feeding the KPI charts (excluding unique text fields tag, name, observation)
  const equipmentsFilteredByTable = useMemo(() => {
    const EXCLUDED_CHART_FILTER_KEYS = ['tag', 'name', 'observation'];
    return equipments.filter(equip => {
      return Object.entries(selectedEquipmentFilters).every(([colKey, setVals]) => {
        if (!setVals || setVals.size === 0) return true;
        // Exclude unique text fields from affecting chart metrics
        if (EXCLUDED_CHART_FILTER_KEYS.includes(colKey)) return true;
        
        // Keep chart slices visible when chart click highlight is active
        if (colKey === 'condition' && selectedConditionChart) return true;
        if (colKey === 'criticality' && selectedCriticalityChart) return true;
        
        let cellVal = String(equip[colKey as keyof Equipment] || '');
        if (colKey === 'condition') {
          cellVal = getWorstTechniqueStatus(equip.vibrationStatus, equip.lubeOilStatus, equip.condition);
        }
        return setVals.has(cellVal);
      });
    });
  }, [equipments, selectedEquipmentFilters, selectedConditionChart, selectedCriticalityChart]);

  // Unique FPSO Trigrams available in Equipment List (e.g. SEP, CDI, UNY, DNY, ONE, PTY)
  const availableKpiFpsos = useMemo(() => {
    const set = new Set<string>();
    equipments.forEach(e => {
      if (e.fpso) {
        const trigram = e.fpso.replace(/^FPSO\s+/i, '').trim();
        if (trigram) set.add(trigram.toUpperCase());
      }
    });
    return Array.from(set).sort();
  }, [equipments]);

  // Target equipments for KPI calculation based on selected vessel trigrams (or all if none/all selected)
  const currentKpiEquipments = useMemo(() => {
    if (selectedKpiFpsos.size === 0 || selectedKpiFpsos.size === availableKpiFpsos.length) {
      return equipments;
    }
    return equipments.filter(e => {
      const trigram = e.fpso ? e.fpso.replace(/^FPSO\s+/i, '').trim().toUpperCase() : '';
      return selectedKpiFpsos.has(trigram);
    });
  }, [equipments, selectedKpiFpsos, availableKpiFpsos]);

  // Display label for the FPSO capsule button
  const kpiFpsoLabel = useMemo(() => {
    if (availableKpiFpsos.length === 0) return 'All FPSOs';
    if (selectedKpiFpsos.size === 0 || selectedKpiFpsos.size === availableKpiFpsos.length) {
      return 'All FPSOs';
    }
    if (selectedKpiFpsos.size === 1) {
      return Array.from(selectedKpiFpsos)[0];
    }
    if (selectedKpiFpsos.size === 2) {
      return Array.from(selectedKpiFpsos).join(', ');
    }
    return `${selectedKpiFpsos.size} FPSOs`;
  }, [selectedKpiFpsos, availableKpiFpsos]);

  // Overall Health calculation (dynamically filtered by vessel scope and selected technology)
  const overallHealthData = useMemo(() => {
    return calculateOverallHealth(currentKpiEquipments, selectedKpiTechnology);
  }, [currentKpiEquipments, selectedKpiTechnology]);

  // CBMnet Fleet Risk Summary (Fault Risk, Compliance Risk, CBM Total Risk for selected technology)
  const fleetRiskSummary = useMemo(() => {
    return calculateFleetCbmRiskSummary(currentKpiEquipments, selectedKpiTechnology);
  }, [currentKpiEquipments, selectedKpiTechnology]);

  // Reports state
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Multi-Index Trend Data aggregated monthly based on Report Date and vessel scope
  const overallHealthTrendData = useMemo(() => {
    const currentScore = overallHealthData.healthPercentage;
    const currentPts = overallHealthData.healthPoints;
    const maxPts = overallHealthData.maxPoints;
    const currentAtRisk = overallHealthData.tier1Count + overallHealthData.tier2Count;
    const currentCompliance = fleetRiskSummary.compliancePercentage;
    const currentTotalHealth = fleetRiskSummary.totalHealthPercentage;
    const currentOverdue =
      fleetRiskSummary.complianceCount.lowDelay +
      fleetRiskSummary.complianceCount.moderateDelay +
      fleetRiskSummary.complianceCount.severeDelay;

    // Monthly aggregation configs matching selected time range
    const monthConfigs = kpiTrendTimeRange === 'Last Month'
      ? [
          { key: '2026-09', label: 'Sep 26' },
          { key: '2026-10', label: 'Oct 26' },
        ]
      : kpiTrendTimeRange === 'Last 3 Months'
      ? [
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
          { key: '2026-10', label: 'Oct 26' },
        ]
      : kpiTrendTimeRange === 'Last 6 Months'
      ? [
          { key: '2026-05', label: 'May 26' },
          { key: '2026-06', label: 'Jun 26' },
          { key: '2026-07', label: 'Jul 26' },
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
          { key: '2026-10', label: 'Oct 26' },
        ]
      : [
          { key: '2026-04', label: 'Apr 26' },
          { key: '2026-05', label: 'May 26' },
          { key: '2026-06', label: 'Jun 26' },
          { key: '2026-07', label: 'Jul 26' },
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
          { key: '2026-10', label: 'Oct 26' },
        ];

    // Filter reports in vessel scope
    const scopeReports = reports.filter(r => {
      if (selectedKpiFpsos.size === 0 || selectedKpiFpsos.size === availableKpiFpsos.length) return true;
      const fac = (r.facility || '').toUpperCase();
      const trigram = fac.replace(/^FPSO\s+/i, '').trim();
      return selectedKpiFpsos.has(trigram);
    });

    const totalMachines = currentKpiEquipments.length;
    const vesselMaxPts = totalMachines * 12;

    if (totalMachines === 0) {
      return monthConfigs.map(m => ({
        label: m.label,
        healthPercentage: 100,
        compliancePercentage: 100,
        totalHealthPercentage: 100,
        points: 0,
        maxPoints: 0,
        atRisk: 0,
        overdueCount: 0,
      }));
    }

    return monthConfigs.map(cfg => {
      if (cfg.key === '2026-10') {
        return {
          label: cfg.label,
          healthPercentage: currentScore,
          compliancePercentage: currentCompliance,
          totalHealthPercentage: currentTotalHealth,
          points: currentPts,
          maxPoints: maxPts,
          atRisk: currentAtRisk,
          overdueCount: currentOverdue,
        };
      }

      // Reports up to this month
      const relevantReports = scopeReports.filter(r => {
        const dt = r.raisedDate || r.createdAt;
        return dt && dt.substring(0, 7) <= cfg.key;
      });

      // Sort ascending to find latest condition
      const sorted = [...relevantReports].sort((a, b) => {
        const da = a.raisedDate || a.createdAt || '';
        const db = b.raisedDate || b.createdAt || '';
        return da.localeCompare(db);
      });

      const latestCondition = new Map<string, string>();
      sorted.forEach(r => {
        if (r.equipmentTag) {
          const techStatus = selectedKpiTechnology === 'Vibration' ? r.vibrationStatus : r.lubeOilStatus;
          latestCondition.set(r.equipmentTag, techStatus || r.overallCondition);
        }
      });

      let deducted = 0;
      let atRisk = 0;
      let overdueCount = 0;

      currentKpiEquipments.forEach(eq => {
        const cond = latestCondition.get(eq.tag) || (selectedKpiTechnology === 'Vibration' ? eq.vibrationStatus : eq.lubeOilStatus) || 'Good - Tier 4';
        const crit = eq.criticality || 'Medium';

        if (cond.includes('Tier 1') || cond.includes('Critical')) {
          const score = crit === 'High' ? 12 : crit === 'Medium' ? 8 : 4;
          deducted += score;
          atRisk++;
        } else if (cond.includes('Tier 2') || cond.includes('Degraded')) {
          const score = crit === 'High' ? 8 : crit === 'Medium' ? 6 : 2;
          deducted += score;
          atRisk++;
        }

        const activeReason = selectedKpiTechnology === 'Vibration'
          ? (eq.vibrationNonCollectionReason || eq.nonCollectionReason)
          : (eq.lubeOilNonCollectionReason || eq.nonCollectionReason);
        if (activeReason && activeReason.trim() !== '') {
          overdueCount++;
        }
      });

      const healthPts = Math.max(0, vesselMaxPts - deducted);
      const healthPct = Number(((healthPts / vesselMaxPts) * 100).toFixed(1));

      // Historical compliance & total risk
      const compDeduction = overdueCount * 5; // delay points
      const maxCompPts = totalMachines * 15;
      const compPct = Number((Math.max(0, maxCompPts - compDeduction) / maxCompPts * 100).toFixed(1));

      const totalDeduction = deducted + (0.2 * compDeduction);
      const maxTotalPts = totalMachines * 15;
      const totalPct = Number((Math.max(0, maxTotalPts - totalDeduction) / maxTotalPts * 100).toFixed(1));

      return {
        label: cfg.label,
        healthPercentage: healthPct,
        compliancePercentage: compPct,
        totalHealthPercentage: totalPct,
        points: healthPts,
        maxPoints: vesselMaxPts,
        atRisk,
        overdueCount,
      };
    });
  }, [
    overallHealthData,
    fleetRiskSummary,
    kpiTrendTimeRange,
    reports,
    selectedKpiFpsos,
    availableKpiFpsos,
    currentKpiEquipments,
    selectedKpiTechnology,
  ]);
  const [selectedRecomFpsos, setSelectedRecomFpsos] = useState<Set<string>>(new Set(ALL_RECOM_FPSOS));
  const [recomFpsoPopoverOpen, setRecomFpsoPopoverOpen] = useState(false);
  const [recomFpsoSearch, setRecomFpsoSearch] = useState('');
  const recomFpsoPopoverRef = useRef<HTMLDivElement>(null);
  const [recomAnalysisType, setRecomAnalysisType] = useState<string>('All');
  const [recomTimeRange, setRecomTimeRange] = useState<string>('All Time');

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true);
  const [woSearchQuery, setWoSearchQuery] = useState('');


  // Modal states (Equipment Detail View)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Bulk Update State (Overdue + Good - Tier 4)
  const [selectedBulkTags, setSelectedBulkTags] = useState<Set<string>>(new Set());
  const [bulkConfirmModalOpen, setBulkConfirmModalOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const selectedBulkEquipments = useMemo(() => {
    return equipments.filter(e => selectedBulkTags.has(e.tag));
  }, [equipments, selectedBulkTags]);


  // Report Creation Form state
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<'Vibration' | 'Lube Oil'>('Vibration');
  const [formFields, setFormFields] = useState({
    facility: '',
    system: '',
    tagNumber: '',
    cmmsNumber: '',
    cof: 'Medium',
    location: '',
    machineName: '',
    mcProtection: '',
    operatingContext: '',
    technology: 'Vibration Analysis',
    component: '',
    raisedBy: 'Gustavo Silva',
    raisedDate: '',
    targetDate: '',
    shortDescription: '',
    woNumber: '',
    conditionAssessment: '',
    longDescription: '',
    vibrationStatus: 'Good',
    lubeOilStatus: 'Good',
    cbmStatus: 'Good - Tier 4',
    imageUrl: '',
    equipmentClass: '',
    subunit: '',
    maintainableItem: '',
    failureModeDescription: '',
    failureMechanismSubdivision: '',
  });

  // Report Detail Viewer state
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);
  const [isReportDrawerMaximized, setIsReportDrawerMaximized] = useState(false);
  const [isSavingEffectiveness, setIsSavingEffectiveness] = useState(false);

  // States and Handlers for Work Order (Fault Report) creation
  const [workOrderFormOpen, setWorkOrderFormOpen] = useState(false);
  const [selectedReportForWo, setSelectedReportForWo] = useState<AnalysisReport | null>(null);
  const [woFormFields, setWoFormFields] = useState({
    woSite: '',
    directive: '',
    maintOrg: 'MECHTS',
    workType: 'CM',
    externalSource: '',
    externalSourceId: '',
    faultDesc: '',
    symptom: 'VIB',
    discovery: '04',
    actionId: '6',
    operationalStatus: '01',
    attachedFilename: '',
    attachedFileSize: 0,
  });
  const [woFormFieldsError, setWoFormFieldsError] = useState({
    directive: '',
  });
  const [isSubmittingWo, setIsSubmittingWo] = useState(false);
  const [woSuccessAlert, setWoSuccessAlert] = useState<string | null>(null);

  const navigateToWorkOrder = (ref: string) => {
    setReportDetailsOpen(false);
    setActiveTab('work-order');
    setWoSearchQuery(ref);
  };

  const openWorkOrderForm = (report: AnalysisReport) => {
    setSelectedReportForWo(report);
    
    let extSrc = 'CBM';
    const tech = report.technology || '';
    const cond = report.overallCondition || '';
    const critChar = cond === 'Critical' ? 'H' : 'M';
    if (tech.toLowerCase().includes('vibration')) {
      extSrc = `CBM-VIB/${critChar}`;
    } else if (tech.toLowerCase().includes('lube') || tech.toLowerCase().includes('oil')) {
      extSrc = `CBM-LUB/${critChar}`;
    }

    setWoFormFields({
      woSite: equipments.find(e => e.tag === report.equipmentTag)?.fpso || 'UNY',
      directive: '',
      maintOrg: 'MECHTS',
      workType: 'CM',
      externalSource: extSrc,
      externalSourceId: `CBM-${report.id}`,
      faultDesc: `Anomaly: ${report.conditionAssessment}\n\nRecommendation: ${report.longDescription}`,
      symptom: tech.toLowerCase().includes('vibration') ? 'VIB' : 'ELU',
      discovery: '04',
      actionId: tech.toLowerCase().includes('vibration') ? '6' : '7',
      operationalStatus: '01',
      attachedFilename: '',
      attachedFileSize: 0,
    });
    
    setWoFormFieldsError({
      directive: '',
    });
    setWorkOrderFormOpen(true);
  };

  const handleWoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!woFormFields.directive.trim()) {
      setWoFormFieldsError({ directive: 'Directive is required.' });
      return;
    }
    
    setIsSubmittingWo(true);
    try {
      const res = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReportForWo?.id,
          ...woFormFields,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWoSuccessAlert(`Work Order ${data.reference} successfully created!`);
        await fetchReports();
        await fetchWorkOrders();
        setTimeout(() => {
          setWorkOrderFormOpen(false);
          setWoSuccessAlert(null);
          setReportDetailsOpen(false);
        }, 3000);
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create work order.');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating work order.');
    } finally {
      setIsSubmittingWo(false);
    }
  };

  // Fetch all equipments on load
  const fetchEquipments = async () => {
    try {
      const res = await fetch('/api/equipments');
      if (res.ok) {
        const data = await res.json();
        setEquipments(data);
      }
    } catch (err) {
      console.error('Error fetching equipments:', err);
    } finally {
      setLoadingEquipments(false);
    }
  };

  // Fetch all reports on load
  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoadingReports(false);
    }
  };

  // Fetch all work orders on load
  const fetchWorkOrders = async () => {
    try {
      const res = await fetch('/api/work-orders');
      if (res.ok) {
        const data = await res.json();
        setWorkOrders(data);
      }
    } catch (err) {
      console.error('Error fetching work orders:', err);
    } finally {
      setLoadingWorkOrders(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
    fetchReports();
    fetchWorkOrders();

    function handleClickOutsideRecomFpso(event: MouseEvent) {
      if (recomFpsoPopoverRef.current && !recomFpsoPopoverRef.current.contains(event.target as Node)) {
        setRecomFpsoPopoverOpen(false);
      }
    }
    function handleClickOutsideKpiFpso(event: MouseEvent) {
      if (kpiFpsoPopoverRef.current && !kpiFpsoPopoverRef.current.contains(event.target as Node)) {
        setKpiFpsoPopoverOpen(false);
      }
    }
    function handleClickOutsideKpiMonth(event: MouseEvent) {
      if (kpiMonthPopoverRef.current && !kpiMonthPopoverRef.current.contains(event.target as Node)) {
        setKpiMonthPopoverOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutsideRecomFpso);
    document.addEventListener('mousedown', handleClickOutsideKpiFpso);
    document.addEventListener('mousedown', handleClickOutsideKpiMonth);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRecomFpso);
      document.removeEventListener('mousedown', handleClickOutsideKpiFpso);
      document.removeEventListener('mousedown', handleClickOutsideKpiMonth);
    };
  }, []);

  // Fetch single equipment history logs
  const fetchEquipmentHistory = async (tag: string) => {
    try {
      const res = await fetch(`/api/equipments/${tag}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    }
  };

  // Open modal for selected equipment row
  const handleRowClick = async (row: Record<string, string>) => {
    const equip = equipments.find(e => e.tag === row.tag);
    if (!equip) return;

    setSelectedEquipment(equip);
    setHistory([]);
    setModalOpen(true);

    await fetchEquipmentHistory(equip.tag);
  };



  // Open detailed side panel/modal for selected report row
  const handleReportRowClick = (row: Record<string, string>) => {
    const report = reports.find(r => String(r.id) === row.id);
    if (report) {
      setSelectedReport(report);
      setReportDetailsOpen(true);
    }
  };

  // Pre-fill and open report creation modal
  const openReportForm = () => {
    if (!selectedEquipment) return;
    
    const today = new Date().toISOString().split('T')[0];
    const target = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // +30 days

    const eqClassCode = formatEquipmentClass(selectedEquipment.class);
    const defaultFailureMode = 'VIB - Vibration';
    const defaultFailureMech = 'Mechanical Failure - Vibration';

    setAnalysisType('Vibration');
    setFormFields({
      facility: `FPSO ${selectedEquipment.fpso}`,
      system: selectedEquipment.system,
      tagNumber: selectedEquipment.tag,
      cmmsNumber: '',
      cof: selectedEquipment.criticality,
      location: 'Module 3',
      machineName: selectedEquipment.tag.includes('COCE') ? 'MIGC C' : 'TURB A',
      mcProtection: 'Vibration Trip',
      operatingContext: 'Continuous Gas Export',
      technology: 'Vibration Analysis',
      component: selectedEquipment.name,
      raisedBy: 'Gustavo Silva',
      raisedDate: today,
      targetDate: target,
      shortDescription: '',
      woNumber: '',
      conditionAssessment: '',
      longDescription: '',
      vibrationStatus: selectedEquipment.vibrationStatus,
      lubeOilStatus: selectedEquipment.lubeOilStatus,
      cbmStatus: selectedEquipment.condition || 'Good - Tier 4',
      imageUrl: '',
      equipmentClass: eqClassCode,
      subunit: 'N/A',
      maintainableItem: 'N/A',
      failureModeDescription: defaultFailureMode,
      failureMechanismSubdivision: defaultFailureMech,
    });

    setReportFormOpen(true);
  };

  // Handle report creation submit
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEquipment) return;

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formFields,
          analysisType,
          equipmentTag: selectedEquipment.tag,
        }),
      });

      if (res.ok) {
        const newReport = await res.json();
        
        // Refresh local UI states
        await fetchEquipments();
        await fetchReports();
        
        // Update currently selected equipment view statuses with server resolved values
        setSelectedEquipment({
          ...selectedEquipment,
          vibrationStatus: newReport.vibrationStatus,
          lubeOilStatus: newReport.lubeOilStatus,
          condition: newReport.overallCondition,
          lastUpdate: new Date().toLocaleString('en-GB'),
        });
        
        await fetchEquipmentHistory(selectedEquipment.tag);

        
        // Close form modal
        setReportFormOpen(false);
      } else {
        const err = await res.json();
        alert(`Error saving report: ${err.error}`);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
    }
  };

  const handleUpdateNonCollectionReason = async (reason: string) => {
    if (!selectedEquipment) return;
    try {
      const res = await fetch(`/api/equipments/${encodeURIComponent(selectedEquipment.tag)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonCollectionReason: reason }),
      });
      if (res.ok) {
        setSelectedEquipment(prev => prev ? { ...prev, nonCollectionReason: reason } : null);
        setEquipments(prev => prev.map(eq => eq.tag === selectedEquipment.tag ? { ...eq, nonCollectionReason: reason } : eq));
      }
    } catch (err) {
      console.error('Failed to update non-collection reason:', err);
    }
  };

  const isEquipmentEligibleForBulkUpdate = (row: Record<string, string>) => {
    return (
      row.collectionStatus === 'Overdue' &&
      (row.condition === 'Good - Tier 4' || row.condition.includes('Tier 4') || row.condition === 'Good') &&
      !row.condition.includes('Tier 3') &&
      !row.condition.includes('Tier 2') &&
      !row.condition.includes('Tier 1')
    );
  };

  const handleExecuteBulkUpdate = async () => {
    if (selectedBulkTags.size === 0) return;
    setIsBulkUpdating(true);
    try {
      const tagsArray = Array.from(selectedBulkTags);
      const res = await fetch('/api/equipments/bulk-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: tagsArray }),
      });
      if (res.ok) {
        const data = await res.json();
        setEquipments(prev => prev.map(eq => {
          if (selectedBulkTags.has(eq.tag)) {
            return {
              ...eq,
              lastUpdate: data.updatedDate,
              lastVibrationUpdate: data.updatedDate,
              lastLubeOilUpdate: data.updatedDate,
              vibrationStatus: 'Good - Tier 4',
              lubeOilStatus: 'Good - Tier 4',
              condition: 'Good - Tier 4',
              nonCollectionReason: null,
              vibrationNonCollectionReason: null,
              lubeOilNonCollectionReason: null,
            };
          }
          return eq;
        }));
        setSelectedBulkTags(new Set());
        setBulkConfirmModalOpen(false);
      } else {
        const err = await res.json();
        alert(`Failed to perform bulk update: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to execute bulk update:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handle uploading/updating image directly for a report
  const handleReportImageUpload = async (reportId: number, file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      try {
        const res = await fetch('/api/reports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: reportId, imageUrl: base64Image }),
        });
        if (res.ok) {
          const updated = await res.json();
          setSelectedReport(updated);
          await fetchReports();
        }
      } catch (err) {
        console.error('Failed to attach evidence image:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle removing evidence image directly for a report
  const handleReportImageRemove = async (reportId: number) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId, imageUrl: null }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSelectedReport(updated);
        await fetchReports();
      }
    } catch (err) {
      console.error('Failed to remove evidence image:', err);
    }
  };

  // Handle updating recommendation effectiveness classification
  const handleEffectivenessChange = async (newVal: string) => {
    if (!selectedReport) return;
    setIsSavingEffectiveness(true);

    const linkedWo = selectedReport.woNumber ? workOrders.find(w => w.reference === selectedReport.woNumber) : undefined;
    const resolved = resolveCbmCaseStatus(selectedReport.overallCondition || '', linkedWo?.status, newVal);

    // Optimistic UI update
    const updated = { ...selectedReport, effectiveness: newVal, cbmCaseStatus: resolved.cbmCaseStatus };
    setSelectedReport(updated);
    setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, effectiveness: newVal, cbmCaseStatus: resolved.cbmCaseStatus } : r));

    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReport.id, effectiveness: newVal, cbmCaseStatus: resolved.cbmCaseStatus }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSelectedReport(saved);
        await fetchReports();
      } else {
        console.error('Failed to update effectiveness');
      }
    } catch (err) {
      console.error('Error updating effectiveness:', err);
    } finally {
      setIsSavingEffectiveness(false);
    }
  };

  // Handle updating linked work order for a report (interactive WO selection in report details)
  const handleReportWoChange = async (reportId: number, newWo: string) => {
    if (!selectedReport) return;
    setIsSavingEffectiveness(true);

    const targetWo = newWo === 'N/A' ? null : newWo;
    const linkedWo = targetWo ? workOrders.find(w => w.reference === targetWo) : undefined;
    const resolved = resolveCbmCaseStatus(selectedReport.overallCondition || '', linkedWo?.status, selectedReport.effectiveness);

    // Optimistic UI update
    setSelectedReport(prev => prev ? {
      ...prev,
      woNumber: targetWo,
      cbmCaseStatus: resolved.cbmCaseStatus,
      effectiveness: resolved.effectiveness,
    } : null);
    setReports(prev => prev.map(r => r.id === reportId ? {
      ...r,
      woNumber: targetWo,
      cbmCaseStatus: resolved.cbmCaseStatus,
      effectiveness: resolved.effectiveness,
    } : r));

    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          woNumber: targetWo,
          cbmCaseStatus: resolved.cbmCaseStatus,
          effectiveness: resolved.effectiveness,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        setSelectedReport(saved);
        await fetchReports();
      } else {
        console.error('Failed to update linked work order');
      }
    } catch (err) {
      console.error('Error updating linked work order:', err);
    } finally {
      setIsSavingEffectiveness(false);
    }
  };

  // Work orders matching currently selected equipment for report creation
  const availableWosForEquipment = useMemo(() => {
    if (!selectedEquipment) return [];
    const eqTag = (selectedEquipment.tag || '').trim().toUpperCase();
    return workOrders.filter(w => (w.tagNumber || '').trim().toUpperCase() === eqTag);
  }, [workOrders, selectedEquipment]);

  // Work orders matching currently selected report for linking by Equipment Tag
  const availableWosForReport = useMemo(() => {
    if (!selectedReport) return [];
    const repTag = (selectedReport.equipmentTag || selectedReport.tagNumber || '').trim().toUpperCase();
    if (!repTag) return [];
    const matching = workOrders.filter(w => (w.tagNumber || '').trim().toUpperCase() === repTag);
    if (selectedReport.woNumber && selectedReport.woNumber !== 'N/A' && !matching.some(w => w.reference === selectedReport.woNumber)) {
      const currentWo = workOrders.find(w => w.reference === selectedReport.woNumber);
      if (currentWo) {
        matching.push(currentWo);
      } else {
        matching.push({
          id: -1,
          reference: selectedReport.woNumber,
          description: 'Assigned Work Order',
          status: 'Open',
          tagNumber: selectedReport.equipmentTag || selectedReport.tagNumber || '',
          tagDescription: '',
          priority: 'Medium',
          fpso: selectedReport.facility || '',
          monitoringTechnique: selectedReport.technology || 'CBM Analysis',
          creationDate: '',
          dueDate: '',
        });
      }
    }
    return matching;
  }, [workOrders, selectedReport]);

  function parseDate(dateStr?: string | null): Date | null {
    if (!dateStr) return null;
    if (dateStr.includes('/')) {
      const parts = dateStr.split(',')[0].trim().split('/');
      if (parts.length === 3) {
        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      }
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  function formatFrequencyBadge(freq?: string | null, defaultDays = 24): string {
    if (!freq) return `${defaultDays} Days`;
    if (/\d+/.test(freq)) {
      const num = freq.match(/\d+/)?.[0];
      return `${num} Days`;
    }
    return `${defaultDays} Days`;
  }

  function getFrequencyDays(frequency?: string | null, defaultDays = 30): number {
    if (!frequency) return defaultDays;
    const numMatch = frequency.match(/\d+/);
    if (numMatch) return parseInt(numMatch[0], 10);
    return defaultDays;
  }

  function calculateNextPlannedDate(lastUpdateStr?: string | null, frequency?: string | null, defaultDays = 30): { plannedDateStr: string; isOverdue: boolean } {
    const lastDate = parseDate(lastUpdateStr) || new Date(2026, 6, 23);
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

  const formatSurveillanceTier = (status: string | undefined | null) => {
    if (!status) return 'Good - Tier 4';
    if (status.includes(' - Tier ')) return status;
    if (status.includes('Good')) return 'Good - Tier 4';
    if (status.includes('Degraded')) return 'Degraded - Tier 2';
    if (status.includes('Critical')) return 'Critical - Tier 1';
    return status;
  };

  // Formatação das bolinhas coloridas de status (Priority / Condition / Status)
  const getStatusDot = (status: string) => {
    if (!status) return null;
    const baseStatus = status.split(' - ')[0];
    
    if (status === 'Very High' || status.includes('Critical') || baseStatus === 'Rejected' || status === 'Overdue') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status === 'High') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status === 'Moderate' || status.includes('Degraded')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warn" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status === 'Low' || status.includes('Good') || baseStatus === 'Accepted' || status === 'On Time') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-status-ok" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status === 'Machine Off') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
          <span className="text-text-muted">{status}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
        <span className="text-text-muted">{status}</span>
      </span>
    );
  };

  // Design sóbrio do CBM Case Status (somente bola colorida + texto, sem pílula/borda)
  const getCaseStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'Awaiting Action':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-text-primary font-medium">Awaiting Action</span>
          </span>
        );
      case 'Awaiting Feedback':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
            <span className="text-text-primary font-medium">Awaiting Feedback</span>
          </span>
        );
      case 'Closed':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-text-primary font-medium">Closed</span>
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span className="text-text-primary font-medium">Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span className="text-text-primary font-medium">{status || 'Awaiting Action'}</span>
          </span>
        );
    }
  };


  // Definição de colunas da tabela de Work Orders
  const woColumns = [
    {
      key: 'reference',
      header: 'WO Reference',
      render: (val: string) => (
        <span className="text-accent-blue hover:underline cursor-pointer font-medium hover:text-[#38bdf8] transition-colors">
          {val}
        </span>
      )
    },
    { key: 'fpso', header: 'FPSO' },
    { key: 'description', header: 'WO Description' },
    { key: 'priority', header: 'Priority', render: (val: string) => getStatusDot(val) },
    { key: 'tagNumber', header: 'Tag Number' },
    { key: 'tagDescription', header: 'Tag Description' },
    { key: 'monitoringTechnique', header: 'Monitoring Technique' },
    { key: 'creationDate', header: 'Creation Date' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'status', header: 'WO Status', render: (val: string) => getStatusDot(val) },
  ];

  // Definição de colunas da tabela de Equipamentos
  const equipColumns = [
    {
      key: 'tag',
      header: 'Equipment Tag',
      render: (val: string) => <span className="font-semibold text-text-primary">{val}</span>
    },
    { key: 'fpso', header: 'FPSO' },
    { key: 'name', header: 'Name' },
    { 
      key: 'class', 
      header: 'Equipment Class',
      render: (val: string) => <span className="font-medium text-text-primary">{formatEquipmentClass(val)}</span>
    },
    { key: 'system', header: 'System' },
    { key: 'criticality', header: 'Criticality' },
    { key: 'objectType', header: 'Object Type' },
    { key: 'collectionStatus', header: 'Collection Status', render: (val: string) => getStatusDot(val) },
    { 
      key: 'nextCollect', 
      header: 'Next Collect',
      sortable: true,
      render: (val: string) => <span className="font-normal text-text-primary">{val || '-'}</span>
    },
    { key: 'condition', header: 'Equip. CBM Condition', render: (val: string) => getStatusDot(val) },
    { key: 'lastUpdate', header: 'Last Update' },
  ];

  // Definição de colunas para Tabela de Recomendações (Reports) - 11 colunas conforme ISO 14224
  const reportColumns = [
    { key: 'fpso', header: 'FPSO' },
    {
      key: 'tagNumber',
      header: 'Tag Number',
      render: (val: string) => <span className="font-semibold text-text-primary">{val}</span>
    },
    { key: 'name', header: 'Name' },
    { 
      key: 'equipmentClass', 
      header: 'Equipment Class',
      render: (val: string) => <span className="font-medium text-text-primary">{formatEquipmentClass(val)}</span>
    },
    { key: 'analysisType', header: 'Analysis Type' },
    { key: 'shortDescription', header: 'Short Description' },
    { key: 'cbmStatus', header: 'CBM Status', render: (val: string) => getStatusDot(val) },
    { 
      key: 'cbmCaseStatus', 
      header: 'CBM Case Status', 
      render: (val: string) => getCaseStatusBadge(val) 
    },
    { key: 'failureModeDescription', header: 'Failure Mode Description' },
    { key: 'raisedDate', header: 'Raised Date' },
    { key: 'raisedBy', header: 'Raised By' },
    { 
      key: 'recommendation', 
      header: 'Recommendation',
      render: (val: string) => (
        <span 
          className="block max-w-[280px] truncate text-[#a2b4cd]" 
          title={val}
        >
          {val ? val.replace(/\s+/g, ' ') : '-'}
        </span>
      )
    },
  ];

  const formattedEquipments = equipments
    .filter(e => isWithinTimeRange(e.lastUpdate, equipCondTimeRange))
    .map(e => {
      const vibDate = e.lastVibrationUpdate || e.lastUpdate;
      const oilDate = e.lastLubeOilUpdate || e.lastUpdate;
      const vibFreq = formatFrequencyBadge(e.vibrationFrequency, 24);
      const oilFreq = formatFrequencyBadge(e.lubeOilFrequency, 84);

      const nextVib = calculateNextPlannedDate(vibDate, vibFreq, 24);
      const nextOil = calculateNextPlannedDate(oilDate, oilFreq, 84);
      const isOverdue = nextVib.isOverdue || nextOil.isOverdue;
      const collectionStatus = isOverdue ? 'Overdue' : 'On Time';

      // Earliest next collection date between Vibration and Lube Oil
      const dVib = parseDate(nextVib.plannedDateStr);
      const dOil = parseDate(nextOil.plannedDateStr);
      let nextCollect = nextVib.plannedDateStr;
      if (dOil && (!dVib || dOil.getTime() < dVib.getTime())) {
        nextCollect = nextOil.plannedDateStr;
      }

      // Overall condition is the worst outcome between individual surveillance techniques (Vibration and Lube Oil)
      const overallCondition = getWorstTechniqueStatus(e.vibrationStatus, e.lubeOilStatus, e.condition);
      const riskCalc = calculateCombinedRisk(e.criticality, overallCondition, collectionStatus);
      const rawScore = calculateRiskScore(overallCondition, e.criticality);

      return {
        id: String(e.id),
        tag: e.tag,
        fpso: e.fpso ? e.fpso.replace(/^FPSO\s+/i, '') : e.fpso,
        name: e.name,
        class: e.class,
        system: e.system,
        criticality: e.criticality,
        objectType: e.objectType,
        condition: overallCondition,
        combinedRiskPriority: riskCalc.finalCategory,
        riskScore: String(rawScore),
        lastUpdate: e.lastUpdate,
        lastVibrationUpdate: vibDate,
        lastLubeOilUpdate: oilDate,
        vibrationFrequency: vibFreq,
        lubeOilFrequency: oilFreq,
        collectionStatus,
        nextCollect,
        plannedNextVibrationDate: nextVib.plannedDateStr,
        plannedNextOilDate: nextOil.plannedDateStr,
        vibrationNonCollectionReason: e.vibrationNonCollectionReason || '',
        lubeOilNonCollectionReason: e.lubeOilNonCollectionReason || '',
        nonCollectionReason: e.nonCollectionReason || '',
        observation: e.observation || '',
      };
    });

  const filteredReportsList = useMemo(() => {
    return reports.filter(r => {
      // 1. FPSO Filter
      if (selectedRecomFpsos.size < ALL_RECOM_FPSOS.length) {
        const fac = (r.facility || '').toUpperCase();
        const tag = (r.tagNumber || '').toUpperCase();
        const matches = Array.from(selectedRecomFpsos).some(f => {
          const target = f.trim().toUpperCase();
          return fac.includes(target) || tag.startsWith(target);
        });
        if (!matches) return false;
      }
      // 2. Analysis Type Filter
      if (recomAnalysisType !== 'All') {
        const tech = r.technology || '';
        if (tech !== recomAnalysisType) return false;
      }
      // 3. Time Range Filter
      const dateStr = r.raisedDate || r.createdAt;
      return isWithinTimeRange(dateStr, recomTimeRange);
    });
  }, [reports, selectedRecomFpsos, recomAnalysisType, recomTimeRange]);

  const formattedReports = filteredReportsList.map(r => {
    const techniqueStatus = r.technology === 'Lube Oil Analysis'
      ? r.lubeOilStatus
      : r.technology === 'Thermography Analysis'
      ? r.thermographyStatus
      : r.vibrationStatus || r.overallCondition;

    const linkedWo = r.woNumber ? workOrders.find(w => w.reference === r.woNumber) : undefined;
    const resolved = resolveCbmCaseStatus(r.overallCondition || '', linkedWo?.status, r.effectiveness);

    return {
      id: String(r.id),
      fpso: (r.facility || 'UNY').replace(/^FPSO\s+/i, ''),
      tagNumber: r.tagNumber,
      name: r.machineName || r.component || 'Compressor Performance',
      equipmentClass: r.equipmentClass || 'Centrifugal Compressor',
      analysisType: r.technology || 'Vibration Analysis',
      effectiveness: resolved.effectiveness,
      shortDescription: r.shortDescription || '-',
      cbmStatus: formatSurveillanceTier(techniqueStatus),
      cbmCaseStatus: resolved.cbmCaseStatus,
      failureModeDescription: r.failureModeDescription || '-',
      raisedDate: r.raisedDate,
      raisedBy: r.raisedBy,
      recommendation: r.longDescription || '',
    };
  });

  const formattedWorkOrders = workOrders
    .filter(w => {
      if (!woSearchQuery) return true;
      return w.reference.toLowerCase().includes(woSearchQuery.toLowerCase());
    })
    .map(w => ({
      id: String(w.id),
      reference: w.reference,
      fpso: w.fpso,
      description: w.description,
      priority: w.priority,
      tagNumber: w.tagNumber,
      tagDescription: w.tagDescription,
      monitoringTechnique: w.monitoringTechnique,
      creationDate: w.creationDate,
      dueDate: w.dueDate,
      status: w.status,
    }));

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col">
      {/* Topbar Layout */}
      <Header />
      
      {/* Sidebar Layout */}
      <Sidebar />
 
      {/* Main Container */}
      <main className="flex-1 pt-14 pr-16 pl-6 pb-6 flex flex-col gap-6 max-w-[1440px] mx-auto w-full">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-border-panel/40 pb-3 mt-2">
          <div className="flex items-center gap-3">
            <button className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-border-panel/20 transition-colors cursor-pointer">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-base font-semibold text-text-primary tracking-wide">CBM Dashboard</h2>
          </div>
          
          {/* Aba de navegação principal (Switch entre as três visualizações) */}
          <div className="flex items-center gap-6 select-none">
            <button
              onClick={() => setActiveTab('equipment')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'equipment' ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Equipment
              {activeTab === 'equipment' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent-blue" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('work-order')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'work-order' ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Work Order
              {activeTab === 'work-order' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent-blue" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                activeTab === 'recommendations' ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Recommendations
              {activeTab === 'recommendations' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent-blue" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('kpis')}
              className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'kpis' ? 'text-accent-blue font-bold' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Activity size={13} className={activeTab === 'kpis' ? 'text-accent-blue' : 'text-text-muted'} />
              KPIs
              {activeTab === 'kpis' && (
                <span className="absolute bottom-[-13px] left-0 right-0 h-[2px] bg-accent-blue shadow-[0_0_8px_rgba(56,189,248,0.6)]" />
              )}
            </button>
          </div>
        </div>

        {/* Lógica SPA: Alternando as três telas */}
        {activeTab === 'work-order' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Cards superiores com gráficos (Work Order) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Work Order by Status"
                timeRange={woStatusTimeRange}
                onTimeRangeChange={setWoStatusTimeRange}
                onMaximize={() => setMaximizedChart('wo-status')}
              >
                <WorkOrderStatusPie workOrders={workOrders} timeRange={woStatusTimeRange} />
              </DashboardCard>
              
              <DashboardCard
                title="Days Left to Due"
                timeRange={daysLeftTimeRange}
                onTimeRangeChange={setDaysLeftTimeRange}
                onMaximize={() => setMaximizedChart('days-due')}
              >
                <DaysLeftBar workOrders={workOrders} timeRange={daysLeftTimeRange} />
              </DashboardCard>
            </div>

            {/* Seção inferior com tabela (Work Orders) */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              {loadingWorkOrders ? (
                <div className="py-8 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-accent-blue" size={14} />
                  Loading work orders...
                </div>
              ) : (
                <>
                  {woSearchQuery && (
                    <div className="mb-3 flex items-center justify-between text-xs bg-accent-blue/10 border border-accent-blue/20 rounded p-2.5 text-accent-blue font-semibold select-none animate-fadeIn">
                      <span>Showing filtered results for WO reference: <strong className="text-white bg-accent-blue/20 px-1.5 py-0.5 rounded ml-1">{woSearchQuery}</strong></span>
                      <button 
                        onClick={() => setWoSearchQuery('')} 
                        className="underline cursor-pointer hover:text-white font-bold uppercase text-[9px] bg-accent-blue/20 hover:bg-accent-blue/40 px-2 py-1 rounded transition-colors"
                      >
                        Clear Filter
                      </button>
                    </div>
                  )}
                  <CustomTable title="Work Order List" columns={woColumns} data={formattedWorkOrders} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Cards superiores com gráficos (Equipment) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Equipment by CBM Condition"
                timeRange={equipCondTimeRange}
                onTimeRangeChange={handleEquipGlobalTimeRangeChange}
                onMaximize={() => setMaximizedChart('equip-condition')}
              >
                <EquipmentConditionPie
                  equipments={equipmentsFilteredByTable}
                  timeRange={equipCondTimeRange}
                  onConditionClick={handleChartConditionClick}
                  selectedCondition={selectedConditionChart}
                />
              </DashboardCard>
              
              <DashboardCard
                title="CBM Condition by Equipment Criticality"
                timeRange={cbmCritTimeRange}
                onTimeRangeChange={handleEquipGlobalTimeRangeChange}
                onMaximize={() => setMaximizedChart('cbm-criticality')}
              >
                <CbmCriticalityBar
                  equipments={equipmentsFilteredByTable}
                  timeRange={cbmCritTimeRange}
                  onCriticalityClick={handleChartCriticalityClick}
                  selectedCriticality={selectedCriticalityChart}
                />
              </DashboardCard>
            </div>

            {/* Seção inferior com tabela (Equipment) */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              {loadingEquipments ? (
                <div className="py-8 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-accent-blue" size={14} />
                  Loading equipments from database...
                </div>
              ) : (
                <CustomTable 
                  title="Equipment List" 
                  columns={equipColumns} 
                  data={formattedEquipments} 
                  onRowClick={handleRowClick}
                  timeRange={equipCondTimeRange}
                  onTimeRangeChange={handleEquipGlobalTimeRangeChange}
                  selectedFiltersState={selectedEquipmentFilters}
                  onFilterChange={setSelectedEquipmentFilters}
                  onClearFilters={handleClearAllEquipFilters}
                  initialSortColumn="nextCollect"
                  initialSortDirection="asc"
                  selectable={true}
                  isRowSelectable={isEquipmentEligibleForBulkUpdate}
                  selectedRowKeys={selectedBulkTags}
                  onSelectionChange={setSelectedBulkTags}
                  bulkActionLabel={`Update Status in Bulk (${selectedBulkTags.size})`}
                  onBulkAction={() => setBulkConfirmModalOpen(true)}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Monthly CBM Surveillance Outcomes Stacked Bar Chart Card with Integrated Filters */}
            <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border-panel/50">
                {/* Left: Title & Description */}
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Monthly Surveillance Outcomes & CBM Condition</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">Distribution of monitored asset conditions across collection routines by month</p>
                </div>

                {/* Right: Integrated Compact Filter Controls */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* FPSO Multi-Select Popover Filter */}
                  <div className="relative" ref={recomFpsoPopoverRef}>
                    <div
                      onClick={() => setRecomFpsoPopoverOpen(prev => !prev)}
                      className="flex items-center gap-2 bg-[#111827] border border-border-panel/80 hover:border-accent-blue rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors min-w-[100px] justify-between text-xs"
                      title="Filter by FPSO"
                    >
                      <span className="text-xs font-medium text-text-primary truncate">
                        {selectedRecomFpsos.size === ALL_RECOM_FPSOS.length
                          ? 'All FPSOs'
                          : selectedRecomFpsos.size === 0
                          ? 'No FPSO'
                          : Array.from(selectedRecomFpsos).join(', ')}
                      </span>
                      <ChevronDown size={13} className={`text-text-muted transition-transform shrink-0 ${recomFpsoPopoverOpen ? 'rotate-180 text-accent-blue' : ''}`} />
                    </div>

                    {/* Multi-Select Popover */}
                    {recomFpsoPopoverOpen && (
                      <div className="absolute top-full right-0 mt-1.5 w-56 bg-[#0d121f] border border-border-panel rounded-lg shadow-2xl p-3 z-50 animate-fadeIn text-left text-xs text-text-primary">
                        {/* Search Input */}
                        <div className="relative mb-2.5">
                          <Search size={12} className="absolute left-2.5 top-2.5 text-text-muted" />
                          <input
                            type="text"
                            value={recomFpsoSearch}
                            onChange={e => setRecomFpsoSearch(e.target.value)}
                            placeholder="Search FPSO..."
                            className="w-full bg-[#111827] border border-border-panel/80 rounded pl-7 pr-2.5 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none"
                          />
                        </div>

                        {/* Options Checklist */}
                        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-1">
                          {/* (Select All) Checkbox */}
                          <label className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg-panel/40 cursor-pointer font-semibold select-none text-text-primary">
                            <input
                              type="checkbox"
                              checked={selectedRecomFpsos.size === ALL_RECOM_FPSOS.length}
                              ref={el => {
                                if (el) {
                                  el.indeterminate =
                                    selectedRecomFpsos.size > 0 &&
                                    selectedRecomFpsos.size < ALL_RECOM_FPSOS.length;
                                }
                              }}
                              onChange={() => {
                                if (selectedRecomFpsos.size === ALL_RECOM_FPSOS.length) {
                                  setSelectedRecomFpsos(new Set());
                                } else {
                                  setSelectedRecomFpsos(new Set(ALL_RECOM_FPSOS));
                                }
                              }}
                              className="accent-accent-blue cursor-pointer"
                            />
                            <span className="text-xs font-semibold">
                              (Select All)
                            </span>
                          </label>

                          <hr className="border-border-panel/40 my-1" />

                          {/* FPSO Codes without 'FPSO ' prefix */}
                          {ALL_RECOM_FPSOS.filter(f =>
                            f.toLowerCase().includes(recomFpsoSearch.toLowerCase())
                          ).map(fpso => {
                            const isChecked = selectedRecomFpsos.has(fpso);
                            return (
                              <label
                                key={fpso}
                                className="flex items-center gap-2 px-2 py-1 rounded hover:bg-bg-panel/40 cursor-pointer text-text-primary select-none text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const next = new Set(selectedRecomFpsos);
                                    if (next.has(fpso)) {
                                      next.delete(fpso);
                                    } else {
                                      next.add(fpso);
                                    }
                                    setSelectedRecomFpsos(next);
                                  }}
                                  className="accent-accent-blue cursor-pointer"
                                />
                                <span>{fpso}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Analysis Type Dropdown Filter */}
                  <div className="relative inline-block">
                    <select
                      value={recomAnalysisType}
                      onChange={e => setRecomAnalysisType(e.target.value)}
                      className="bg-[#111827] border border-border-panel/80 text-text-primary text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer hover:border-accent-blue focus:outline-none focus:border-accent-blue transition-colors"
                      title="Filter by Analysis Type"
                    >
                      <option value="All" className="bg-[#0b0f19] text-text-primary">All Analysis</option>
                      <option value="Vibration Analysis" className="bg-[#0b0f19] text-text-primary">Vibration Analysis</option>
                      <option value="Lube Oil Analysis" className="bg-[#0b0f19] text-text-primary">Lube Oil Analysis</option>
                      <option value="Thermography Analysis" className="bg-[#0b0f19] text-text-primary">Thermography Analysis</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                      <ChevronDown size={13} />
                    </div>
                  </div>

                  {/* Time Range Dropdown Filter */}
                  <div className="relative inline-block">
                    <select
                      value={recomTimeRange}
                      onChange={e => setRecomTimeRange(e.target.value)}
                      className="bg-[#111827] border border-border-panel/80 text-text-primary text-xs font-medium rounded-lg px-2.5 py-1.5 pr-7 appearance-none cursor-pointer hover:border-accent-blue focus:outline-none focus:border-accent-blue transition-colors"
                      title="Filter by Time Range"
                    >
                      <option value="All Time" className="bg-[#0b0f19] text-text-primary">All Time</option>
                      <option value="Last Month" className="bg-[#0b0f19] text-text-primary">Last Month</option>
                      <option value="Last 3 Months" className="bg-[#0b0f19] text-text-primary">Last 3 Months</option>
                      <option value="Last 6 Months" className="bg-[#0b0f19] text-text-primary">Last 6 Months</option>
                      <option value="Last Year" className="bg-[#0b0f19] text-text-primary">Last Year</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-muted">
                      <ChevronDown size={13} />
                    </div>
                  </div>

                  {/* Total Outcomes Count Pill */}
                  <span className="text-[10px] text-text-muted bg-[#111827] px-2.5 py-1 rounded-full border border-border-panel whitespace-nowrap shrink-0">
                    {filteredReportsList.length} Outcomes
                  </span>
                </div>
              </div>

              <MonthlyConditionBarChart
                reports={reports}
                selectedFpsos={Array.from(selectedRecomFpsos)}
                analysisType={recomAnalysisType}
                timeRange={recomTimeRange}
              />
            </div>

            {/* Tabela do Registro de Recomendações */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              {loadingReports ? (
                <div className="py-8 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-accent-blue" size={14} />
                  Loading recommendation reports...
                </div>
              ) : (
                <CustomTable 
                  title="Recommendations & Analysis Outcomes Register" 
                  columns={reportColumns} 
                  data={formattedReports} 
                  onRowClick={handleReportRowClick}
                />
              )}
            </div>
          </div>
        )}

        {/* Lógica SPA: Tela de KPIs & Overall Health (Strictly SLB Optisite DashboardCards) */}
        {activeTab === 'kpis' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Top Filter Bar: Vessel Scope, Month, Technology (SLB Optisite Standard) */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-bg-card border border-border-panel rounded-card px-4 py-2.5 shadow-sm select-none">
              <div className="flex flex-wrap items-center gap-4">
                {/* 1. Vessel Scope Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">Vessel Scope:</span>
                  <div className="relative" ref={kpiFpsoPopoverRef}>
                    <button
                      type="button"
                      onClick={() => setKpiFpsoPopoverOpen(prev => !prev)}
                      className="flex items-center gap-2 bg-[#0c101d] hover:bg-[#121829] border border-[#202742] hover:border-accent-blue/80 rounded-full px-3.5 py-1.5 cursor-pointer transition-all shadow-sm text-xs"
                      title="Filter by FPSO"
                    >
                      <Filter size={12} className="text-accent-blue shrink-0" />
                      <span className="font-semibold text-text-primary tracking-wide">{kpiFpsoLabel}</span>
                      <ChevronDown size={12} className={`text-text-muted transition-transform shrink-0 ${kpiFpsoPopoverOpen ? 'rotate-180 text-accent-blue' : ''}`} />
                    </button>

                    {/* Multi-Select Capsule Popover */}
                    {kpiFpsoPopoverOpen && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-[#0c101d] border border-[#202742] rounded-2xl shadow-2xl p-3 z-50 animate-fadeIn text-left text-xs text-text-primary">
                        {/* Search Input */}
                        <div className="relative mb-2.5">
                          <Search size={13} className="absolute left-2.5 top-2.5 text-text-muted" />
                          <input
                            type="text"
                            value={kpiFpsoSearch}
                            onChange={e => setKpiFpsoSearch(e.target.value)}
                            placeholder="Search FPSO..."
                            className="w-full bg-[#111728] border border-[#202742] rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-text-primary focus:border-accent-blue focus:outline-none placeholder:text-text-muted/60"
                          />
                        </div>

                        {/* Options Checklist */}
                        <div className="flex flex-col gap-0.5 max-h-52 overflow-y-auto pr-1">
                          {/* (Select All) Checkbox */}
                          <label className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#172033] cursor-pointer font-semibold select-none text-text-primary transition-colors">
                            <input
                              type="checkbox"
                              checked={selectedKpiFpsos.size === availableKpiFpsos.length || selectedKpiFpsos.size === 0}
                              ref={el => {
                                if (el) {
                                  el.indeterminate =
                                    selectedKpiFpsos.size > 0 &&
                                    selectedKpiFpsos.size < availableKpiFpsos.length;
                                }
                              }}
                              onChange={() => {
                                if (selectedKpiFpsos.size === availableKpiFpsos.length || selectedKpiFpsos.size === 0) {
                                  setSelectedKpiFpsos(new Set());
                                } else {
                                  setSelectedKpiFpsos(new Set(availableKpiFpsos));
                                }
                              }}
                              className="accent-accent-blue cursor-pointer rounded"
                            />
                            <span className="text-xs font-semibold">(Select All)</span>
                          </label>

                          <hr className="border-[#202742] my-1" />

                          {availableKpiFpsos
                            .filter(f => f.toLowerCase().includes(kpiFpsoSearch.toLowerCase()))
                            .map(trigram => {
                              const isChecked = selectedKpiFpsos.has(trigram) || selectedKpiFpsos.size === 0;
                              return (
                                <label
                                  key={trigram}
                                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#172033] cursor-pointer select-none text-text-primary transition-colors"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        const next = new Set(selectedKpiFpsos.size === 0 ? availableKpiFpsos : selectedKpiFpsos);
                                        if (next.has(trigram)) {
                                          next.delete(trigram);
                                        } else {
                                          next.add(trigram);
                                        }
                                        setSelectedKpiFpsos(next);
                                      }}
                                      className="accent-accent-blue cursor-pointer rounded"
                                    />
                                    <span className="text-xs font-medium">{trigram}</span>
                                  </div>
                                </label>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Month Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">Month:</span>
                  <div className="relative" ref={kpiMonthPopoverRef}>
                    <button
                      type="button"
                      onClick={() => setKpiMonthPopoverOpen(prev => !prev)}
                      className="flex items-center gap-2 bg-[#0c101d] hover:bg-[#121829] border border-[#202742] hover:border-accent-blue/80 rounded-full px-3.5 py-1.5 cursor-pointer transition-all shadow-sm text-xs"
                      title="Select Reference Month"
                    >
                      <Calendar size={12} className="text-accent-blue shrink-0" />
                      <span className="font-semibold text-text-primary tracking-wide">
                        {currentMonthConfig.label}
                      </span>
                      <ChevronDown size={12} className={`text-text-muted transition-transform shrink-0 ${kpiMonthPopoverOpen ? 'rotate-180 text-accent-blue' : ''}`} />
                    </button>

                    {kpiMonthPopoverOpen && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-[#0c101d] border border-[#202742] rounded-2xl shadow-2xl p-2 z-50 animate-fadeIn text-left text-xs text-text-primary">
                        <div className="flex flex-col gap-1">
                          {availableKpiMonths.map(m => (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => {
                                setSelectedKpiMonth(m.key);
                                setKpiMonthPopoverOpen(false);
                              }}
                              className={`flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                                selectedKpiMonth === m.key
                                  ? 'bg-accent-blue text-white font-semibold'
                                  : 'hover:bg-[#172033] text-text-primary'
                              }`}
                            >
                              <span>{m.label}</span>
                              {selectedKpiMonth === m.key && <span className="text-[10px]">●</span>}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Technology Segmented Filter (Vibration | Lub Oil) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-muted font-medium">Technology:</span>
                  <div className="flex items-center bg-[#0c101d] p-0.5 rounded-full border border-[#202742]">
                    <button
                      type="button"
                      onClick={() => setSelectedKpiTechnology('Vibration')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        selectedKpiTechnology === 'Vibration'
                          ? 'bg-accent-blue text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Vibration
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedKpiTechnology('Lub Oil')}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                        selectedKpiTechnology === 'Lub Oil'
                          ? 'bg-accent-blue text-white shadow-sm'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Lub Oil
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-xs text-text-muted font-medium hidden md:flex items-center gap-1.5">
                <span>Evaluated ({selectedKpiTechnology}):</span>
                <strong className="text-text-primary font-bold">{overallHealthData.totalMachines}</strong>
              </div>
            </div>

            {/* Row 1: 3 KPI Snapshot Cards Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Fault Risk & Overall Health */}
              <KpiMetricCard
                title={kpiFpsoLabel === 'All FPSOs' ? 'Fault Risk & Overall Health' : `${kpiFpsoLabel} Fault Risk & Health`}
                subtitle="Fleet Mechanical Integrity"
                value={`${overallHealthData.healthPercentage}%`}
                infoTitle="Fault Risk & Fleet Health Methodology"
                infoContent={
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-accent-blue block text-[11px]">Formula:</span>
                      <code className="text-[10px] block mt-0.5 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Fault Risk = Condition Tier (1 to 4) × IFS Criticality (1 to 3)
                      </code>
                      <span className="text-[10px] text-text-muted mt-0.5 block">Scale: 1 to 12 pts (Critical: ≥12, High: 8-11, Medium: 4-7, Low: 1-3)</span>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Variables:</span>
                      <ul className="list-disc pl-4 text-[10px] space-y-0.5 text-[#94a3b8]">
                        <li><strong className="text-[#f8fafc]">Condition:</strong> Worst of Vibration & Lube Oil (Tier 1 Crit = 4, Tier 2 Deg = 3, Tier 3 Good = 2, Tier 4 Good = 1).</li>
                        <li><strong className="text-[#f8fafc]">IFS Criticality:</strong> High / SECE = 3, Medium = 2, Low = 1 (from IFS RAM master).</li>
                      </ul>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Fleet Health Deduction (100%):</span>
                      <p className="text-[10px] text-[#94a3b8] leading-tight">
                        Max fleet potential is <code>N × 12 pts</code>. Machines with active anomalies (Tier 1 & 2) deduct their Fault Risk score. Tier 3 & 4 deduct 0.
                      </p>
                      <code className="text-[10px] block mt-1 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Health % = [(Max Points - Deductions) / Max Points] × 100%
                      </code>
                    </div>
                  </div>
                }
              />

              {/* Card 2: Compliance Risk (FAR Overdue PM Matrix) */}
              <KpiMetricCard
                title="Compliance Risk (Overdue PM)"
                subtitle="PM Schedule Adherence"
                value={`${fleetRiskSummary.compliancePercentage}%`}
                infoTitle="Compliance Risk & Overdue PM Methodology"
                infoContent={
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-accent-blue block text-[11px]">Formula:</span>
                      <code className="text-[10px] block mt-0.5 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Compliance Risk = IFS Criticality (1 to 3) × Overdue Index (0 to 5)
                      </code>
                      <span className="text-[10px] text-text-muted mt-0.5 block">Scale: 0 to 15 pts (Worst of Vibration & Lube Oil delay)</span>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">PM Overdue Formula (FAR Standard):</span>
                      <code className="text-[10px] block mt-0.5 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Overdue % = [(Today - Due Date) / PM Interval] × 100%
                      </code>
                      <div className="grid grid-cols-2 gap-1 text-[9px] text-[#94a3b8] mt-1 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        <span>≤0%: Index 0 (On Sched)</span>
                        <span>0-50%: Index 1 (Low)</span>
                        <span>50-100%: Index 2 (Mod)</span>
                        <span>100-150%: Index 3 (High)</span>
                        <span>150-200%: Index 4 (Severe)</span>
                        <span>&gt;200%: Index 5 (Crit)</span>
                      </div>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Fleet Compliance Deduction (100%):</span>
                      <p className="text-[10px] text-[#94a3b8] leading-tight">
                        Max fleet potential is <code>N × 15 pts</code>. Every overdue machine deducts its Compliance Risk score.
                      </p>
                      <code className="text-[10px] block mt-1 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Compliance % = [(Max Points - Deductions) / Max Points] × 100%
                      </code>
                    </div>
                  </div>
                }
              />

              {/* Card 3: CBM Total Risk */}
              <KpiMetricCard
                title="CBM Total Risk"
                subtitle="Combined Operational Health"
                value={`${fleetRiskSummary.totalHealthPercentage}%`}
                infoTitle="CBM Total Risk Methodology (CBMnet §1.6)"
                infoContent={
                  <div className="space-y-2">
                    <div>
                      <span className="font-semibold text-accent-blue block text-[11px]">Formula (CBMnet Aligned):</span>
                      <code className="text-[10px] block mt-0.5 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        CBM Total Risk = Fault Risk + (20% × Compliance Risk)
                      </code>
                      <span className="text-[10px] text-text-muted mt-0.5 block">Scale: 1.0 to 15.0 pts (Critical: ≥12, High: 8-11.9, Med: 4-7.9, Low: &lt;4)</span>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Weighting Rationale:</span>
                      <p className="text-[10px] text-[#94a3b8] leading-tight">
                        Condition is prioritized as primary risk (Fault Risk up to 12). Operational compliance delay acts as a 20% modifier (up to 3.0 pts).
                      </p>
                    </div>

                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Fleet Total Health Deduction (100%):</span>
                      <p className="text-[10px] text-[#94a3b8] leading-tight">
                        Max fleet potential is <code>N × 15.0 pts</code>. Deductions combine active fault penalties plus 20% of overdue compliance penalties.
                      </p>
                      <code className="text-[10px] block mt-1 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Total Health % = [(Max Points - Total Deductions) / Max Points] × 100%
                      </code>
                    </div>
                  </div>
                }
              />
            </div>

            {/* Row 2: Secondary Donut Charts (Collection Compliance & Failure Mechanisms) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Collection Compliance & Non-Collection Reasons */}
              <DashboardCard
                title="Collection Compliance & Non-Collection Reasons"
                timeRange={currentMonthConfig?.label || 'Current Month'}
                onMaximize={() => setMaximizedChart('kpi-collection-compliance')}
                infoTitle="Collection Compliance Methodology"
                infoContent={
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#94a3b8] leading-tight">
                      Displays the percentage of equipment with routine data collected for the selected month, along with the detailed distribution of non-collection reasons.
                    </p>
                    <div className="border-t border-[#1e2538] pt-1.5">
                      <span className="font-semibold text-accent-blue block text-[11px]">Compliance Formula:</span>
                      <code className="text-[10px] block mt-0.5 bg-[#141a29] p-1.5 rounded border border-[#232d48]">
                        Surveyed % = (Surveyed Machines / Total Evaluated) × 100%
                      </code>
                    </div>
                  </div>
                }
              >
                <CollectionCompliancePie
                  equipments={currentKpiEquipments}
                  selectedTechnology={selectedKpiTechnology}
                />
              </DashboardCard>

              {/* Chart 2: Failure Mechanisms */}
              <DashboardCard
                title="Failure Mechanisms"
                timeRange={currentMonthConfig?.label || 'Current Month'}
                onMaximize={() => setMaximizedChart('kpi-failure-mechanisms')}
                infoTitle="Failure Mechanisms Methodology (ISO 14224)"
                infoContent={
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#94a3b8] leading-tight">
                      Displays the distribution of diagnosed failure mechanisms recorded in technical assessments (Log New Analysis) according to ISO 14224 taxonomy.
                    </p>
                  </div>
                }
              >
                <FailureMechanismsPie
                  reports={reports}
                  selectedMonth={selectedKpiMonth}
                  selectedTechnology={selectedKpiTechnology}
                />
              </DashboardCard>
            </div>

            {/* Row 3: Full-Width Trends with Tab Selector (Overall Health | Compliance Risk | CBM Total Risk) */}
            <div className="w-full">
              <DashboardCard
                title={
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-text-primary">
                      {selectedTrendTab === 'health'
                        ? 'Overall Health Trend'
                        : selectedTrendTab === 'compliance'
                        ? 'Compliance Risk Trend'
                        : 'CBM Total Risk Trend'}
                    </span>
                    {/* Discrete SLB Standard Blue Segmented Tabs */}
                    <div className="flex items-center bg-[#070b14] p-0.5 rounded-lg border border-[#1e293b]">
                      <button
                        type="button"
                        onClick={() => setSelectedTrendTab('health')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedTrendTab === 'health'
                            ? 'bg-accent-blue text-white shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Overall Health
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTrendTab('compliance')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedTrendTab === 'compliance'
                            ? 'bg-accent-blue text-white shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        Compliance Risk
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTrendTab('risk')}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                          selectedTrendTab === 'risk'
                            ? 'bg-accent-blue text-white shadow-sm'
                            : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        CBM Total Risk
                      </button>
                    </div>
                  </div>
                }
                timeRange={kpiTrendTimeRange}
                onTimeRangeChange={setKpiTrendTimeRange}
                onMaximize={() => setMaximizedChart('kpi-trend')}
              >
                <div className="w-full h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overallHealthTrendData} margin={{ top: 15, right: 25, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={{ stroke: '#334155' }} 
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        stroke="#64748b" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={{ stroke: '#334155' }}
                        tickFormatter={(val) => `${val}%`}
                      />
                      <RechartsTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            if (selectedTrendTab === 'compliance') {
                              return (
                                <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px]">
                                  <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-0.5">{label}</p>
                                  <p className="text-accent-blue font-bold mt-1">Compliance Rate: {item.compliancePercentage}%</p>
                                  <p className="text-text-muted mt-0.5">Technology: {selectedKpiTechnology}</p>
                                  <p className={item.overdueCount > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>
                                    Overdue: {item.overdueCount || 0} machines
                                  </p>
                                </div>
                              );
                            }
                            if (selectedTrendTab === 'risk') {
                              return (
                                <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px]">
                                  <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-0.5">{label}</p>
                                  <p className="text-accent-blue font-bold mt-1">Total Health Index: {item.totalHealthPercentage}%</p>
                                  <p className="text-text-muted mt-0.5">Technology: {selectedKpiTechnology}</p>
                                  <p className={item.atRisk > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>
                                    At Risk: {item.atRisk} machines
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px]">
                                <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-0.5">{label}</p>
                                <p className="text-accent-blue font-bold mt-1">Overall Health: {item.healthPercentage}%</p>
                                <p className="text-text-muted mt-0.5">Points: {item.points.toLocaleString()} / {item.maxPoints.toLocaleString()}</p>
                                <p className={item.atRisk > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>At Risk: {item.atRisk} machines</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="linear" 
                        dataKey={
                          selectedTrendTab === 'health'
                            ? 'healthPercentage'
                            : selectedTrendTab === 'compliance'
                            ? 'compliancePercentage'
                            : 'totalHealthPercentage'
                        } 
                        stroke="#5b9bf3" 
                        strokeWidth={2}
                        dot={{
                          r: 4.5,
                          fill: '#60a5fa',
                          stroke: '#0e1726',
                          strokeWidth: 2
                        }}
                        activeDot={{ r: 6.5, fill: '#ffffff', stroke: '#38bdf8', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>

            {/* Row 3: Full-Width Monthly CBM Routine Report Table */}
            <div className="w-full">
              <MonthlyCbmReportTable
                equipments={currentKpiEquipments}
                reports={reports}
                workOrders={workOrders}
                selectedTechnology={selectedKpiTechnology}
                selectedMonth={selectedKpiMonth}
                selectedMonthLabel={currentMonthConfig?.shortLabel || 'October'}
                onEquipmentClick={(eq) => handleRowClick({ tag: eq.tag })}
                onReportClick={(report) => {
                  setSelectedReport(report as any);
                  setReportDetailsOpen(true);
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Modal padronizada SLB OptiSite (Equipment Detail) */}
      <EquipmentDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        equipment={selectedEquipment}
        history={history}
        onLogNewAnalysis={openReportForm}
        onUpdateNonCollectionReason={handleUpdateNonCollectionReason}
      />

      {/* Detailed Bulk Update Modal (SLB OptiSite Full-Width Table Design) */}
      {bulkConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[999] flex items-center justify-center p-4 sm:p-6">
          <div className="bg-[#0b101c] border border-[#1a263d] rounded-2xl w-full max-w-4xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-6 sm:p-7 animate-fadeIn text-left flex flex-col max-h-[92vh]">
            {/* Header: Title + Pill Badge + Close Button */}
            <div className="flex items-center justify-between pb-4 border-b border-[#1a263d]/70">
              <div className="flex items-center gap-3">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Update Status in Bulk
                </h3>
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#162136] text-[#7dd3fc] border border-[#38bdf8]/25">
                  {selectedBulkEquipments.length} {selectedBulkEquipments.length === 1 ? 'equipment' : 'equipments'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBulkConfirmModalOpen(false)}
                className="p-1 rounded-lg text-[#64748b] hover:text-white hover:bg-[#162136] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={19} />
              </button>
            </div>

            {/* Subtitle / context description */}
            <div className="py-3 text-xs text-[#94a3b8] flex flex-wrap items-center justify-between gap-2 border-b border-[#1a263d]/40">
              <span>
                Confirm update of <strong className="text-white">{selectedBulkEquipments.length}</strong> equipment(s) to the current date maintaining <span className="text-[#10b981] font-semibold">Good - Tier 4</span>.
              </span>
              <span className="text-[11px] text-[#64748b]">
                Good - Tier 4 Overdue Surveillance
              </span>
            </div>

            {/* Full-Width Table of Selected Equipments */}
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto py-2 flex-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-10 bg-[#0b101c] text-[#6b82a3] text-[10px] uppercase font-bold tracking-wider border-b border-[#1a263d] select-none">
                  <tr>
                    <th className="py-2.5 px-3">Asset</th>
                    <th className="py-2.5 px-3 w-20">FPSO</th>
                    <th className="py-2.5 px-3">Equipment Name</th>
                    <th className="py-2.5 px-3 w-48">Class</th>
                    <th className="py-2.5 px-3 w-40">System</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#162032]/70">
                  {selectedBulkEquipments.map((eq) => {
                    const fpsoClean = eq.fpso ? eq.fpso.replace(/^FPSO\s+/i, '').trim() : '-';
                    const classFormatted = formatEquipmentClass(eq.class);
                    return (
                      <tr key={eq.tag} className="hover:bg-[#11192e] transition-colors">
                        {/* Asset Tag */}
                        <td className="py-3 px-3 whitespace-nowrap font-bold text-white text-xs tracking-tight">
                          {eq.tag}
                        </td>
                        {/* FPSO */}
                        <td className="py-3 px-3 whitespace-nowrap text-[11px] text-[#94a3b8]">
                          {fpsoClean}
                        </td>
                        {/* Name */}
                        <td className="py-3 px-3 text-[#cbd5e1] text-[11px] font-normal">
                          {eq.name}
                        </td>
                        {/* Class */}
                        <td className="py-3 px-3 text-[#94a3b8] text-[11px]">
                          {classFormatted}
                        </td>
                        {/* System */}
                        <td className="py-3 px-3 text-[#94a3b8] text-[11px]">
                          {eq.system}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-5 border-t border-[#1a263d]/70">
              <button
                type="button"
                onClick={() => setBulkConfirmModalOpen(false)}
                disabled={isBulkUpdating}
                className="px-5 py-2 text-xs font-semibold rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#162136] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkUpdate}
                disabled={isBulkUpdating}
                className="px-6 py-2.5 text-xs font-bold rounded-lg bg-[#38bdf8] hover:bg-[#0ea5e9] text-[#070e1b] hover:text-white transition-all flex items-center gap-2 shadow-lg cursor-pointer"
              >
                {isBulkUpdating && <RefreshCw className="animate-spin" size={13} />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Form para preencher Relatório de CBM (Excel Digitization) */}
      {reportFormOpen && selectedEquipment && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <form 
            onSubmit={handleReportSubmit}
            className="bg-[#111625] border border-[#222b45] rounded-xl w-full max-w-[760px] relative animate-fadeIn shadow-2xl text-left overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header da Modal SLB Figma Style */}
            <div className="px-6 py-5 border-b border-[#222b45] relative bg-[#111625]">
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="absolute top-5 right-5 text-[#8a94a6] hover:text-white transition-colors cursor-pointer p-1"
                title="Close"
              >
                <X size={20} />
              </button>

              <h2 className="text-base font-bold text-[#f8fafc] tracking-tight">
                Submit CBM Analysis Report
              </h2>

              <div className="flex items-center gap-2 text-xs text-[#8a94a6] mt-2 font-medium">
                <span>Overall CBM status:</span>
                <span className={`font-semibold ${
                  selectedEquipment.condition?.startsWith('Good') ? 'text-[#10b981]' :
                  selectedEquipment.condition?.startsWith('Degraded') ? 'text-[#f59e0b]' :
                  selectedEquipment.condition?.startsWith('Critical') ? 'text-[#f87171]' : 'text-[#8a94a6]'
                }`}>
                  {selectedEquipment.condition}
                </span>
              </div>
            </div>

            {/* Conteúdo do Form em Estilo SLB Figma */}
            <div className="p-6 flex-1 overflow-y-auto text-xs flex flex-col gap-5 bg-[#111625]">
              
              {/* Seção 1: Analysis Parameters & Metadata */}
              <div className="flex flex-col gap-3">
                <h4 className="text-[10px] font-bold text-[#8a94a6] uppercase tracking-wider">ANALYSIS PARAMETERS & METADATA</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Analysis Type Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Analysis Type</label>
                    <div className="relative">
                      <select
                        value={analysisType}
                        onChange={(e) => {
                          const val = e.target.value as 'Vibration' | 'Lube Oil';
                          setAnalysisType(val);
                          setFormFields(prev => ({
                            ...prev,
                            technology: val === 'Vibration' ? 'Vibration Analysis' : 'Lube Oil Analysis',
                          }));
                        }}
                        className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8"
                      >
                        <option value="Vibration" className="bg-[#0c101d]">Vibration Analysis</option>
                        <option value="Lube Oil" className="bg-[#0c101d]">Lube Oil Analysis</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Unified CBM Status Dropdown */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">CBM Status</label>
                    <div className="relative">
                      <select
                        value={formFields.cbmStatus}
                        onChange={e => setFormFields({ ...formFields, cbmStatus: e.target.value })}
                        className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8"
                      >
                        <option value="Good - Tier 4" className="bg-[#0c101d]">Good - Tier 4</option>
                        <option value="Good - Tier 3" className="bg-[#0c101d]">Good - Tier 3</option>
                        <option value="Degraded - Tier 2" className="bg-[#0c101d]">Degraded - Tier 2</option>
                        <option value="Critical - Tier 1" className="bg-[#0c101d]">Critical - Tier 1</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Component</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Compressor"
                      value={formFields.component}
                      onChange={e => setFormFields({ ...formFields, component: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs placeholder:text-[#475569]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Raised By</label>
                    <input
                      type="text"
                      required
                      value={formFields.raisedBy}
                      onChange={e => setFormFields({ ...formFields, raisedBy: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Raised Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.raisedDate}
                      onChange={e => setFormFields({ ...formFields, raisedDate: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors cursor-pointer text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Target Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.targetDate}
                      onChange={e => setFormFields({ ...formFields, targetDate: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors cursor-pointer text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Short Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Instrumentation Failure"
                      value={formFields.shortDescription}
                      onChange={e => setFormFields({ ...formFields, shortDescription: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs placeholder:text-[#475569]"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#94a3b8] font-medium text-xs">Work Order Number</label>
                    <div className="relative">
                      <select
                        value={formFields.woNumber || 'N/A'}
                        onChange={e => setFormFields({ ...formFields, woNumber: e.target.value === 'N/A' ? '' : e.target.value })}
                        className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8 transition-colors font-medium"
                      >
                        <option value="N/A" className="bg-[#0c101d] text-[#94a3b8]">N/A (No Work Order)</option>
                        {availableWosForEquipment.map(wo => (
                          <option key={wo.id} value={wo.reference} className="bg-[#0c101d] text-[#f1f5f9]">
                            {wo.reference} - {wo.description.substring(0, 35)}... ({wo.status})
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                        <ChevronDown size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 2: Failure Mode Details */}
              <div className="flex flex-col gap-3 pt-2">
                <h4 className="text-[10px] font-bold text-[#8a94a6] uppercase tracking-wider">FAILURE MODE DETAILS</h4>
                
                {/* Single Row: Equipment Class (Read-only), Failure Mode Description, Failure Mechanism Subdivision */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Equipment Class (Read-Only) */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#8a94a6] font-bold text-[10px] uppercase tracking-wider">EQUIPMENT CLASS</label>
                    <input
                      type="text"
                      readOnly
                      value={formFields.equipmentClass || 'N/A'}
                      className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] font-medium text-xs outline-none cursor-default select-all transition-colors"
                      title="Equipment Class is synchronized from equipment metadata"
                    />
                  </div>

                  {/* Failure Mode Description */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#8a94a6] font-bold text-[10px] uppercase tracking-wider">FAILURE MODE DESCRIPTION</label>
                    <div className="relative">
                      <select
                        value={formFields.failureModeDescription || FAILURE_MODE_OPTIONS[0]}
                        onChange={(e) => setFormFields({ ...formFields, failureModeDescription: e.target.value })}
                        className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8 transition-colors"
                      >
                        <option value="N/A" className="bg-[#0c101d] text-[#f1f5f9]">
                          N/A
                        </option>
                        {FAILURE_MODE_OPTIONS.map((mode) => (
                          <option key={mode} value={mode} className="bg-[#0c101d] text-[#f1f5f9]">
                            {mode}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>

                  {/* Failure Mechanism Subdivision */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[#8a94a6] font-bold text-[10px] uppercase tracking-wider">FAILURE MECHANISM SUBDIVISION</label>
                    <div className="relative">
                      <select
                        value={formFields.failureMechanismSubdivision || FAILURE_MECHANISM_SUBDIVISION_OPTIONS[0]}
                        onChange={(e) => setFormFields({ ...formFields, failureMechanismSubdivision: e.target.value })}
                        className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8 transition-colors"
                      >
                        <option value="N/A" className="bg-[#0c101d] text-[#f1f5f9]">
                          N/A
                        </option>
                        {FAILURE_MECHANISM_SUBDIVISION_OPTIONS.map((mech) => (
                          <option key={mech} value={mech} className="bg-[#0c101d] text-[#f1f5f9]">
                            {mech}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção 3: Condition Assessment & Recommendations */}
              <div className="flex flex-col gap-3.5 pt-2">
                <h4 className="text-[10px] font-bold text-[#8a94a6] uppercase tracking-wider">CONDITION ASSESSMENT & RECOMMENDATIONS</h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#94a3b8] font-medium text-xs">Condition assessment (observations)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Insert detailed observations regarding the equipment conditions..."
                    value={formFields.conditionAssessment}
                    onChange={e => setFormFields({ ...formFields, conditionAssessment: e.target.value })}
                    className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs resize-none placeholder:text-[#475569]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[#94a3b8] font-medium text-xs">Long description (recommendations)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Insert recommended maintenance actions (e.g.: Check connections, replace sensors, top up oil)..."
                    value={formFields.longDescription}
                    onChange={e => setFormFields({ ...formFields, longDescription: e.target.value })}
                    className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs resize-none placeholder:text-[#475569]"
                  />
                </div>

                {/* Seção 4: Attachments (Optional) - Dashed Dropzone */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[#94a3b8] font-medium text-xs">Attachments (Optional)</label>
                  <label
                    htmlFor="modal-file-upload"
                    className="border border-dashed border-[#2b3552] hover:border-[#3b82f6] rounded-md p-4 bg-[#0c101d]/60 flex items-center justify-center gap-2 text-xs text-[#8a94a6] cursor-pointer transition-colors group"
                  >
                    <svg className="w-4 h-4 stroke-current text-[#8a94a6] group-hover:text-[#3b82f6]" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <span>Drag and drop files or <span className="text-[#4589ff] font-medium hover:underline">browse</span></span>
                  </label>
                  <input
                    id="modal-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormFields(prev => ({ ...prev, imageUrl: reader.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />
                  {formFields.imageUrl && (
                    <div className="mt-2 relative w-32 h-20 border border-[#232a42] rounded overflow-hidden">
                      <img src={formFields.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormFields(prev => ({ ...prev, imageUrl: '' }))}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-red-600 cursor-pointer"
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Footer com Botões Pílula SLB */}
            <div className="px-6 py-4 border-t border-[#222b45] bg-[#111625] flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="border border-[#2b3552] text-[#cbd5e1] hover:text-white hover:border-[#475569] px-6 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#5096ff] hover:bg-[#3b82f6] text-[#0a1020] font-semibold px-6 py-2 rounded-full text-xs shadow-md transition-colors cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CBM Analysis Report Details SLB Side Drawer */}
      {reportDetailsOpen && selectedReport && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-end p-0 transition-opacity animate-fadeIn"
          onClick={() => setReportDetailsOpen(false)}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`bg-[#0b0f19] border-l border-[#202742] h-full flex flex-col shadow-2xl relative transition-all duration-300 ease-out animate-slideLeft ${
              isReportDrawerMaximized ? 'w-full max-w-full' : 'w-full md:w-[85vw] max-w-6xl'
            }`}
          >
            {/* Top Bar Header with Section Title & Window Controls */}
            <div className="border-b border-[#202742] bg-[#0d121f] px-6 py-3.5 flex items-center justify-between select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-[#1e2746] flex items-center justify-center text-accent-blue text-xs font-bold">
                  <Activity size={13} />
                </span>
                <h3 className="text-sm font-bold text-text-primary tracking-wide">
                  CBM Analysis Report Details
                </h3>
              </div>

              {/* Controls: Maximize / Minimize / Close */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsReportDrawerMaximized(prev => !prev)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-[#1a233a] rounded transition-all cursor-pointer"
                  title={isReportDrawerMaximized ? 'Restore Drawer' : 'Maximize Drawer'}
                >
                  {isReportDrawerMaximized ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                </button>
                <button
                  type="button"
                  onClick={() => setReportDetailsOpen(false)}
                  className="p-1.5 text-text-muted hover:text-text-primary hover:bg-[#1a233a] rounded transition-all cursor-pointer"
                  title="Close Drawer"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Main Drawer Scrollable Content: 2 Cards matching SLB Reference Layout */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT CARD: Details (~42% on desktop) */}
                <div className="lg:col-span-5 bg-[#0c101d] border border-[#202742] rounded-xl p-5 shadow-lg">
                  {/* Card Header: Details & Info icon */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#202742]/80 mb-1 select-none">
                    <h4 className="text-sm font-semibold text-text-primary tracking-wide">
                      Details
                    </h4>
                    <span title="Report Equipment Details">
                      <Info size={15} className="text-text-muted hover:text-accent-blue transition-colors cursor-pointer" />
                    </span>
                  </div>

                  {/* Rows List */}
                  <div className="space-y-0 text-xs">
                    {/* Status */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-center">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Status:</span>
                      <div className="col-span-7 flex items-center justify-end gap-2">
                        {(() => {
                          const reportCondition = selectedReport.technology === 'Lube Oil Analysis'
                            ? (selectedReport.lubeOilStatus || selectedReport.overallCondition)
                            : selectedReport.technology === 'Thermography Analysis'
                            ? (selectedReport.thermographyStatus || selectedReport.overallCondition)
                            : (selectedReport.vibrationStatus || selectedReport.overallCondition);
                          const cbmTierBadge = getTierBadgeStyle(reportCondition);
                          return (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold tracking-wide ${cbmTierBadge.bgClass} ${cbmTierBadge.textClass}`}>
                              {cbmTierBadge.text}
                            </span>
                          );
                        })()}
                        {(() => {
                          const linkedWo = selectedReport.woNumber ? workOrders.find(w => w.reference === selectedReport.woNumber) : undefined;
                          const resolved = resolveCbmCaseStatus(selectedReport.overallCondition || '', linkedWo?.status, selectedReport.effectiveness);
                          return getCaseStatusBadge(resolved.cbmCaseStatus);
                        })()}
                      </div>
                    </div>

                    {/* FPSO */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">FPSO:</span>
                      <span className="col-span-7 font-semibold text-text-primary text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.fpso ? equipments.find(e => e.tag === selectedReport.equipmentTag)?.fpso.replace(/^FPSO\s+/i, '').trim() : (selectedReport.facility?.replace(/^FPSO\s+/i, '').trim() || '-')}
                      </span>
                    </div>

                    {/* System */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">System:</span>
                      <span className="col-span-7 text-text-primary text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.system || selectedReport.system || 'Oil & Process'}
                      </span>
                    </div>

                    {/* Equipment Tag */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Equipment Tag</span>
                      <span className="col-span-7 font-bold text-[#fbbf24] font-mono break-all text-right">
                        {selectedReport.equipmentTag}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Name</span>
                      <span className="col-span-7 text-text-primary text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.name || selectedReport.component || selectedReport.machineName}
                      </span>
                    </div>

                    {/* Equipment Class */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Equipment Class</span>
                      <span className="col-span-7 text-text-primary text-right">
                        {formatEquipmentClass(equipments.find(e => e.tag === selectedReport.equipmentTag)?.class || selectedReport.equipmentClass || 'PUCE')}
                      </span>
                    </div>

                    {/* Criticality */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Criticality</span>
                      <span className="col-span-7 text-text-primary text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.criticality || selectedReport.cof || 'Medium'}
                      </span>
                    </div>

                    {/* Object Type */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Object Type</span>
                      <span className="col-span-7 text-text-primary text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.objectType || 'NCE'}
                      </span>
                    </div>

                    {/* Last update */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Last update</span>
                      <span className="col-span-7 text-text-primary font-mono text-[11px] text-right">
                        {equipments.find(e => e.tag === selectedReport.equipmentTag)?.lastUpdate || selectedReport.raisedDate || selectedReport.createdAt?.substring(0, 10)}
                      </span>
                    </div>

                    {/* Condition Assessment (Observations) */}
                    <div className="grid grid-cols-12 py-2.5 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Condition Assesment (Observations)</span>
                      <span className="col-span-7 text-text-primary leading-relaxed text-[11px] text-right">
                        {selectedReport.conditionAssessment || `Surveillance assessment for ${selectedReport.equipmentTag} evaluated as ${selectedReport.overallCondition || 'Tier 1'} based on Vibration Analysis parameters.`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT CARD: Supporting Images / Analytical Evidence (~58% on desktop) */}
                <div className="lg:col-span-7 bg-[#0c101d] border border-[#202742] rounded-xl p-5 shadow-lg space-y-5">
                  {/* Card Header: Title & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#202742]/80 gap-3 select-none">
                    <h4 className="text-sm font-semibold text-text-primary tracking-wide">
                      Supporting Images / Analytical Evidence
                    </h4>
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Remove image button (only when image exists) */}
                      {selectedReport.imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleReportImageRemove(selectedReport.id)}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#f87171]/40 text-[#f87171] hover:bg-[#f87171]/10 text-xs font-medium transition-colors cursor-pointer"
                          title="Remove attached image"
                        >
                          <Trash2 size={12} />
                          Remove
                        </button>
                      )}

                      {/* Change Image / Attach Image button */}
                      <label className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#202742] bg-[#121626] hover:border-accent-blue text-xs text-text-primary font-medium transition-colors cursor-pointer">
                        <RefreshCw size={12} className="text-accent-blue" />
                        {selectedReport.imageUrl ? 'Change Image' : 'Change Image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleReportImageUpload(selectedReport.id, file);
                          }}
                        />
                      </label>

                      {/* Download Image button */}
                      <button
                        type="button"
                        disabled={!selectedReport.imageUrl}
                        onClick={() => {
                          if (!selectedReport.imageUrl) return;
                          const a = document.createElement('a');
                          a.href = selectedReport.imageUrl;
                          a.download = `analytical_evidence_${selectedReport.equipmentTag || 'report'}.png`;
                          a.click();
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#202742] bg-[#121626] text-xs font-medium transition-colors ${
                          selectedReport.imageUrl
                            ? 'hover:border-accent-blue text-text-primary cursor-pointer'
                            : 'opacity-40 text-text-muted cursor-not-allowed'
                        }`}
                        title={selectedReport.imageUrl ? 'Download Image' : 'No image to download'}
                      >
                        <Download size={12} className={selectedReport.imageUrl ? 'text-accent-blue' : 'text-text-muted'} />
                        Download Image
                      </button>
                    </div>
                  </div>

                  {/* ONLY render image container when imageUrl exists; otherwise DO NOT USE ANY SPACE */}
                  {selectedReport.imageUrl && (
                    <div className="p-3 bg-white rounded-lg border border-[#202742] flex items-center justify-center">
                      <img
                        src={selectedReport.imageUrl}
                        alt="Analytical Evidence"
                        className="max-h-[300px] w-auto object-contain mx-auto"
                      />
                    </div>
                  )}

                  {/* Metadata Rows List */}
                  <div className="space-y-0 text-xs">
                    {/* Component */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Component</span>
                      <span className="col-span-7 font-normal text-text-primary">{selectedReport.component || 'Main assembly'}</span>
                    </div>

                    {/* Raised by */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Raised by</span>
                      <span className="col-span-7 font-normal text-text-primary">{selectedReport.raisedBy || 'Fernanda Lima'}</span>
                    </div>

                    {/* Raised Date */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Raised Date</span>
                      <span className="col-span-7 font-normal text-text-primary font-mono text-[11px]">{selectedReport.raisedDate || selectedReport.createdAt?.substring(0, 10)}</span>
                    </div>

                    {/* Target Date */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Target Date</span>
                      <span className="col-span-7 font-normal text-text-primary font-mono text-[11px]">{selectedReport.targetDate || selectedReport.raisedDate || 'N/A'}</span>
                    </div>

                    {/* Short Description */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Short Description</span>
                      <span className="col-span-7 font-normal text-text-primary">{selectedReport.shortDescription || 'Cavitation'}</span>
                    </div>

                    {/* W.O. Number */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-center">
                      <span className="col-span-5 text-[#8a94a6] font-medium">W.O. Number</span>
                      <div className="col-span-7 flex items-center justify-end gap-2">
                        <select
                          value={selectedReport.woNumber || 'N/A'}
                          onChange={(e) => handleReportWoChange(selectedReport.id, e.target.value)}
                          className="bg-[#141a2e] border border-[#263152] text-accent-blue font-semibold rounded px-2 py-1 text-xs focus:outline-none focus:border-accent-blue transition-colors font-mono cursor-pointer max-w-[210px] truncate"
                          title="Select Work Order assigned to this equipment"
                        >
                          <option value="N/A" className="bg-[#141a2e] text-text-muted">N/A (No Work Order)</option>
                          {availableWosForReport.map(wo => (
                            <option key={wo.id || wo.reference} value={wo.reference} className="bg-[#141a2e] text-text-primary">
                              {wo.reference} ({wo.status})
                            </option>
                          ))}
                        </select>
                        {selectedReport.woNumber && selectedReport.woNumber !== 'N/A' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReportDetailsOpen(false);
                              navigateToWorkOrder(selectedReport.woNumber!);
                            }}
                            className="text-[10px] text-accent-blue hover:underline font-semibold cursor-pointer whitespace-nowrap"
                          >
                            (View WO)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Failure Mode Description */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Failure Mode Description</span>
                      <span className="col-span-7 font-medium text-[#f59e0b]">{selectedReport.failureModeDescription || 'NOI - Abnormal Noise'}</span>
                    </div>

                    {/* Failure Mechanism Subdivision */}
                    <div className="grid grid-cols-12 py-2.5 border-b border-[#182035]/80 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Failure Mechanism Subdivision</span>
                      <span className="col-span-7 font-normal text-text-primary">{selectedReport.failureMechanismSubdivision || 'Mechanical Failure - Cavitation'}</span>
                    </div>

                    {/* Long Description (Recommendations) */}
                    <div className="grid grid-cols-12 py-2.5 items-start">
                      <span className="col-span-5 text-[#8a94a6] font-medium">Long Description (Recommendations)</span>
                      <span className="col-span-7 font-normal text-text-primary leading-relaxed whitespace-pre-line text-[11px]">
                        {selectedReport.longDescription || 'Inspect suction strainer and upstream isolation valves for blockage or throttling. Verify net positive suction head (NPSHa) against pump design curve (NPSHr). Check suction pressure transmitters and discharge recirculation line operation. Inspect pump impeller vanes and wear rings for cavitation pitting.'}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation Effectiveness Classification (ISO 6.4.6.1) & Action Buttons */}
                  <div className="border-t border-[#202742] pt-4 space-y-4">
                    {(() => {
                      const linkedWo = selectedReport.woNumber ? workOrders.find(w => w.reference === selectedReport.woNumber) : undefined;
                      const resolved = resolveCbmCaseStatus(selectedReport.overallCondition || '', linkedWo?.status, selectedReport.effectiveness);
                      const currentCaseStatus = resolved.cbmCaseStatus;
                      const isGood = selectedReport.overallCondition?.includes('Good') || selectedReport.overallCondition?.includes('Tier 3') || selectedReport.overallCondition?.includes('Tier 4');
                      const isAwaitingFeedback = currentCaseStatus === 'Awaiting Feedback';
                      const isClosed = currentCaseStatus === 'Closed';
                      const isCancelled = currentCaseStatus === 'Cancelled';
                      const isAwaitingAction = currentCaseStatus === 'Awaiting Action';

                      // Only enabled when Awaiting Feedback or Closed (and not Good Tier 3/4 or Cancelled)
                      const isSelectEnabled = !isGood && !isCancelled && (isAwaitingFeedback || isClosed);

                      let helperMsg = '';
                      if (isGood) {
                        helperMsg = 'N/A: Not applicable (routine baseline surveillance with no corrective action required).';
                      } else if (isCancelled) {
                        helperMsg = 'Case Cancelled: Work Order was cancelled, no effectiveness evaluation required.';
                      } else if (!selectedReport.woNumber || selectedReport.woNumber === 'N/A') {
                        helperMsg = 'Awaiting Action: No Work Order linked. Select an assigned Work Order above. Effectiveness selection will be enabled once the Work Order is Completed.';
                      } else if (isAwaitingAction) {
                        helperMsg = `Awaiting Action: Work Order ${selectedReport.woNumber} is currently ${linkedWo?.status || 'Open'}. Effectiveness selection will be enabled once the Work Order is Completed.`;
                      } else if (isAwaitingFeedback) {
                        helperMsg = `Awaiting Feedback: Work Order ${selectedReport.woNumber} has been Completed! Please assign the Recommendation Effectiveness below to finalize and Close this CBM case.`;
                      } else {
                        helperMsg = EFFECTIVENESS_DESCRIPTIONS[selectedReport.effectiveness || 'Not Yet Assessable'] || EFFECTIVENESS_DESCRIPTIONS['Not Yet Assessable'];
                      }

                      const currentVal = isGood 
                        ? 'N/A' 
                        : (selectedReport.effectiveness || 'Pending Assessment');

                      return (
                        <div className="bg-[#101422]/60 border border-[#202742] rounded-lg p-3.5 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-text-primary uppercase tracking-wider">
                              <CheckCircle2 size={13} className="text-[#10b981]" />
                              Recommendation Effectiveness Classification (ISO 6.4.6.1)
                            </div>
                            {isSavingEffectiveness && (
                              <span className="text-[9px] text-[#60a5fa] font-semibold animate-pulse lowercase">
                                saving...
                              </span>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <label className="text-[#8a94a6] font-medium text-xs flex items-center gap-1.5">
                              Effectiveness Status:
                              {!isSelectEnabled && (
                                <span className="text-[10px] text-text-muted lowercase">
                                  (locked)
                                </span>
                              )}
                            </label>
                            <div className="relative min-w-[220px]">
                              <select
                                disabled={!isSelectEnabled}
                                value={currentVal}
                                onChange={(e) => handleEffectivenessChange(e.target.value)}
                                className={`w-full bg-[#0c101d] border rounded px-3 py-1.5 text-xs appearance-none pr-8 transition-colors font-semibold ${
                                  isSelectEnabled
                                    ? 'border-[#3b82f6] text-[#f1f5f9] cursor-pointer hover:border-[#60a5fa]'
                                    : 'border-[#232a42] text-[#64748b] cursor-not-allowed opacity-80'
                                }`}
                              >
                                {isGood ? (
                                  <option value="N/A" className="bg-[#0c101d] text-[#f1f5f9]">N/A</option>
                                ) : (
                                  <>
                                    <option value="Pending Assessment" disabled className="bg-[#0c101d] text-[#94a3b8]">
                                      Pending Assessment (Select to Close)
                                    </option>
                                    <option value="Effective" className="bg-[#0c101d] text-[#f1f5f9]">Effective</option>
                                    <option value="Partially Effective" className="bg-[#0c101d] text-[#f1f5f9]">Partially Effective</option>
                                    <option value="Ineffective" className="bg-[#0c101d] text-[#f1f5f9]">Ineffective</option>
                                    <option value="Not Yet Assessable" className="bg-[#0c101d] text-[#f1f5f9]">Not Yet Assessable</option>
                                  </>
                                )}
                              </select>
                              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                                <ChevronDown size={14} />
                              </div>
                            </div>
                          </div>

                          <div className={`text-[11px] italic border rounded p-2.5 leading-relaxed ${
                            isAwaitingFeedback
                              ? 'bg-[#0284c7]/10 border-[#0284c7]/30 text-[#38bdf8]'
                              : 'bg-[#0c101d]/80 border-[#1e2538] text-[#94a3b8]'
                          }`}>
                            {helperMsg}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Bottom Action Buttons */}
                    <div className="flex justify-end gap-3 select-none">
                      {selectedReport.woNumber && selectedReport.woNumber !== 'N/A' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReportDetailsOpen(false);
                            navigateToWorkOrder(selectedReport.woNumber!);
                          }}
                          className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-2 rounded-full text-xs transition-colors cursor-pointer shadow active:scale-95"
                        >
                          <FileText size={14} />
                          View Work Order ({selectedReport.woNumber})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openWorkOrderForm(selectedReport)}
                          className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-2 rounded-full text-xs transition-colors cursor-pointer shadow active:scale-95"
                        >
                          <PlusCircle size={14} />
                          Generate Work Order (Fault Report)
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Work Order Modal SLB Style */}
      {workOrderFormOpen && selectedReportForWo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-[#202742] rounded-xl p-6 w-full max-w-[700px] relative animate-fadeIn shadow-2xl text-left flex flex-col max-h-[90vh]">
            
            {/* Header Compacto SLB */}
            <div className="flex items-center justify-between pb-4 border-b border-[#202742]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#60a5fa]/10 border border-[#60a5fa]/30 flex items-center justify-center text-[#60a5fa]">
                  <Wrench size={16} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-text-primary uppercase tracking-wide flex items-center gap-2">
                    Raise Fault Report (Work Order)
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium mt-0.5">
                    <span className="bg-[#222944] text-[#60a5fa] px-2 py-0.5 rounded font-mono font-bold">{selectedReportForWo.equipmentTag}</span>
                    <span>•</span>
                    <span>{selectedReportForWo.facility}</span>
                    <span>•</span>
                    <span>{selectedReportForWo.system}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setWorkOrderFormOpen(false)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#202742] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleWoSubmit} className="flex-1 overflow-y-auto mt-4 pr-1 flex flex-col gap-4 text-xs">
              
              {/* Success Alert Banner inside Modal */}
              {woSuccessAlert && (
                <div className="bg-status-ok/10 border border-status-ok/30 text-status-ok p-3 rounded-lg flex items-center gap-2 font-medium animate-fadeIn">
                  <RefreshCw className="animate-spin" size={14} />
                  <span>{woSuccessAlert}</span>
                </div>
              )}

              {/* Bloco 1 SLB: Dados de Identificação do CMMS (Read-only Metadata) */}
              <div className="bg-[#101422]/60 border border-[#202742] rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#60a5fa] uppercase tracking-wider block border-b border-[#202742] pb-2">
                  1. External CMMS Integration Details
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">WO Site</label>
                    <input
                      type="text"
                      value={woFormFields.woSite}
                      disabled
                      className="bg-[#121626] border border-[#2a3254]/50 rounded-lg p-2 text-text-muted font-medium cursor-not-allowed text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Work Type</label>
                    <input
                      type="text"
                      value={woFormFields.workType}
                      disabled
                      className="bg-[#121626] border border-[#2a3254]/50 rounded-lg p-2 text-text-muted font-medium cursor-not-allowed text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">External Source</label>
                    <input
                      type="text"
                      value={woFormFields.externalSource}
                      disabled
                      className="bg-[#121626] border border-[#2a3254]/50 rounded-lg p-2 text-text-muted font-medium cursor-not-allowed text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">External Source ID</label>
                    <input
                      type="text"
                      value={woFormFields.externalSourceId}
                      onChange={(e) => setWoFormFields({ ...woFormFields, externalSourceId: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary focus:border-accent-blue focus:outline-none transition-colors text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Discovery Context</label>
                    <input
                      type="text"
                      value={`${woFormFields.discovery} - Periodic condition monitoring`}
                      disabled
                      className="bg-[#121626] border border-[#2a3254]/50 rounded-lg p-2 text-text-muted font-medium cursor-not-allowed text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2 SLB: Parâmetros Operacionais & Diretivas */}
              <div className="bg-[#101422]/60 border border-[#202742] rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#60a5fa] uppercase tracking-wider block border-b border-[#202742] pb-2">
                  2. Directive & Maintenance Parameters
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1 col-span-2">
                    <label className="text-text-primary font-bold uppercase text-[9px] tracking-wider flex items-center gap-1">
                      Directive <span className="text-status-error">*</span>
                      <span className="text-[8px] text-text-muted normal-case font-normal">(Use capital letters, e.g. OIL REPLACE)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter directive title in CAPITAL letters"
                      value={woFormFields.directive}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        setWoFormFields({ ...woFormFields, directive: val });
                        if (val.trim()) setWoFormFieldsError({ directive: '' });
                      }}
                      className={`bg-[#121626] border rounded-lg p-2.5 text-text-primary focus:border-accent-blue focus:outline-none transition-colors text-xs ${
                        woFormFieldsError.directive ? 'border-status-error' : 'border-[#2a3254]'
                      }`}
                    />
                    {woFormFieldsError.directive && (
                      <span className="text-status-error text-[10px] mt-0.5">{woFormFieldsError.directive}</span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Maint. Org.</label>
                    <select
                      value={woFormFields.maintOrg}
                      onChange={(e) => setWoFormFields({ ...woFormFields, maintOrg: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="MECHTS">MECHTS - Mechanic - Topside</option>
                      <option value="MECHER">MECHER - Mechanic - Engine Room</option>
                      <option value="INSTR">INSTR - Instrument</option>
                      <option value="ELEC">ELEC - Electrical</option>
                      <option value="DCS">DCS - Distributed Control System</option>
                      <option value="EX_INSP">EX_INSP - Ex Inspector</option>
                      <option value="FABRIC">FABRIC - Fabric Maintenance</option>
                      <option value="CARGO">CARGO - Cargo</option>
                      <option value="MEDIC">MEDIC - Medic</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Symptom</label>
                    <select
                      value={woFormFields.symptom}
                      onChange={(e) => setWoFormFields({ ...woFormFields, symptom: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="VIB">VIB - Vibration</option>
                      <option value="ELU">ELU - External leakage - utility medium</option>
                      <option value="ELP">ELP - External leakage - process medium</option>
                      <option value="PLU">PLU - Plugged / Choked</option>
                      <option value="STD">STD - Structural deficiency</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Action ID</label>
                    <select
                      value={woFormFields.actionId}
                      onChange={(e) => setWoFormFields({ ...woFormFields, actionId: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="2">2 - Repair</option>
                      <option value="3">3 - Modify</option>
                      <option value="4">4 - Adjust</option>
                      <option value="5">5 - Refit</option>
                      <option value="6">6 - Check</option>
                      <option value="7">7 - Service</option>
                      <option value="8">8 - Test</option>
                      <option value="9">9 - Inspection</option>
                      <option value="10">10 - Overhaul</option>
                      <option value="11">11 - Combination</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Operational Status</label>
                    <select
                      value={woFormFields.operationalStatus}
                      onChange={(e) => setWoFormFields({ ...woFormFields, operationalStatus: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary focus:border-accent-blue focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="01">01 - Non-intrusive / Non-obstructive</option>
                      <option value="02">02 - Item Intrusive / Obstructive</option>
                      <option value="03">03 - Package Intrusive / Obstructive</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloco 3 SLB: Descrição da Falha & Anexo do Relatório */}
              <div className="bg-[#101422]/60 border border-[#202742] rounded-xl p-4 flex flex-col gap-3">
                <span className="text-[10px] font-bold text-[#60a5fa] uppercase tracking-wider block border-b border-[#202742] pb-2">
                  3. Fault Description & Evidence Attachment
                </span>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Fault Description</label>
                    <textarea
                      value={woFormFields.faultDesc}
                      onChange={(e) => setWoFormFields({ ...woFormFields, faultDesc: e.target.value })}
                      rows={3}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue focus:outline-none resize-none leading-relaxed text-xs"
                    />
                  </div>

                  {/* File Upload Input */}
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider block">Attach Technical Analysis File (Optional)</label>
                    <div className="border border-dashed border-[#333e68] hover:border-accent-blue rounded-lg p-3 bg-[#121626] flex flex-col items-center justify-center gap-1.5 transition-colors relative cursor-pointer">
                      <input
                        type="file"
                        id="simulated-wo-file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setWoFormFields({
                              ...woFormFields,
                              attachedFilename: file.name,
                              attachedFileSize: file.size,
                            });
                          }
                        }}
                      />
                      <FileText size={18} className="text-[#60a5fa]/70" />
                      {woFormFields.attachedFilename ? (
                        <div className="text-center">
                          <span className="text-status-ok font-semibold block text-xs">✓ File Attached</span>
                          <span className="text-text-muted text-[10px]">{woFormFields.attachedFilename} ({(woFormFields.attachedFileSize / 1024).toFixed(1)} KB)</span>
                        </div>
                      ) : (
                        <span className="text-text-muted text-[10px]">Select PDF or spreadsheet analysis report to attach</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons SLB Style */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#202742] select-none mt-1">
                <button
                  type="button"
                  onClick={() => setWorkOrderFormOpen(false)}
                  disabled={isSubmittingWo}
                  className="border border-[#333e68] text-text-primary px-4 py-1.5 rounded-full text-xs font-medium hover:border-accent-blue transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWo}
                  className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmittingWo ? (
                    <>
                      <RefreshCw className="animate-spin" size={12} />
                      Submitting...
                    </>
                  ) : (
                    'Submit Work Order'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Overlay para exibição de Gráfico Maximizado */}
      {maximizedChart && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-panel rounded-card p-6 w-full max-w-2xl relative animate-fadeIn shadow-2xl">
            <button
              onClick={() => setMaximizedChart(null)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
            <h2 className="text-sm font-semibold mb-6 text-text-primary flex items-center gap-2">
              <RefreshCw size={14} className="animate-spin text-accent-blue" />
              {maximizedChart === 'wo-status' && 'Work Order by Status (Maximized View)'}
              {maximizedChart === 'days-due' && 'Days Left to Due (Maximized View)'}
              {maximizedChart === 'equip-condition' && 'Equipment by CBM Condition (Maximized View)'}
              {maximizedChart === 'cbm-criticality' && 'CBM Condition by Equipment Criticality (Maximized View)'}
              {maximizedChart === 'kpi-health' && (kpiFpsoLabel === 'All FPSOs' ? 'Overall Fleet Health (Maximized View)' : `${kpiFpsoLabel} Health (Maximized View)`)}
              {maximizedChart === 'kpi-compliance' && 'Compliance Risk - FAR Overdue PM (Maximized View)'}
              {maximizedChart === 'kpi-total-risk' && 'CBMnet Total Risk (Maximized View)'}
              {maximizedChart === 'kpi-collection-compliance' && 'Collection Compliance & Non-Collection Reasons (Maximized View)'}
              {maximizedChart === 'kpi-failure-mechanisms' && 'Failure Mechanisms (Maximized View)'}
              {maximizedChart === 'kpi-trend' && (
                selectedTrendTab === 'health'
                  ? 'Overall Health Trend (Maximized View)'
                  : selectedTrendTab === 'compliance'
                  ? 'Compliance Risk Trend (Maximized View)'
                  : 'CBM Total Risk Trend (Maximized View)'
              )}
            </h2>
            <div className="h-[360px] flex items-center justify-center">
              {maximizedChart === 'wo-status' && <WorkOrderStatusPie workOrders={workOrders} />}
              {maximizedChart === 'days-due' && <DaysLeftBar workOrders={workOrders} />}
              {maximizedChart === 'equip-condition' && <EquipmentConditionPie equipments={equipments} />}
              {maximizedChart === 'cbm-criticality' && <CbmCriticalityBar equipments={equipments} />}
              {maximizedChart === 'kpi-health' && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-8 p-4">
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Health Points', value: overallHealthData.healthPoints },
                            { name: 'Deducted Points', value: overallHealthData.deductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell 
                            fill={
                              overallHealthData.healthPercentage >= 95 ? '#84cc16' : 
                              overallHealthData.healthPercentage >= 90 ? '#3b82f6' : 
                              overallHealthData.healthPercentage >= 80 ? '#f97316' : '#f87171'
                            } 
                          />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                        {overallHealthData.healthPercentage}%
                      </span>
                      <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                        Health
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-sm flex-1 max-w-sm w-full">
                    <div className="bg-[#0c101d] border border-[#1e2538] p-2.5 rounded-lg text-xs text-[#94a3b8]">
                      <span className="font-semibold text-accent-blue block text-[11px] mb-0.5">Formula (4×3 Matrix):</span>
                      <code className="text-[10px] text-[#38bdf8]">Fault Risk = Condition Tier (1 to 4) × IFS Criticality (1 to 3)</code>
                      <span className="block text-[10px] text-text-muted mt-0.5">Scale: 1 to 12 | Health % = [(Max Potential - Deductions) / Max Potential] × 100%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Evaluated Machines:</span>
                      <strong className="text-text-primary font-bold">{overallHealthData.totalMachines} machines</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Avg Fault Risk:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgFaultRisk} / 12</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Health Points:</span>
                      <span className="font-semibold text-text-primary">{overallHealthData.healthPoints.toLocaleString()} / {overallHealthData.maxPoints.toLocaleString()} pts</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Machines at Risk:</span>
                      <span className={overallHealthData.tier1Count + overallHealthData.tier2Count > 0 ? 'font-bold text-orange-400' : 'font-semibold text-status-ok'}>
                        {overallHealthData.tier1Count + overallHealthData.tier2Count} ({overallHealthData.tier1Count} Critical, {overallHealthData.tier2Count} Degraded)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Deducted Risk Points:</span>
                      <span className={overallHealthData.deductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {overallHealthData.deductedPoints > 0 ? `-${overallHealthData.deductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {maximizedChart === 'kpi-compliance' && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-8 p-4">
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Compliance Points', value: Math.max(0, fleetRiskSummary.maxCompliancePoints - fleetRiskSummary.complianceDeductedPoints) },
                            { name: 'Deducted Points', value: fleetRiskSummary.complianceDeductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell 
                            fill={
                              fleetRiskSummary.compliancePercentage >= 95 ? '#10b981' : 
                              fleetRiskSummary.compliancePercentage >= 90 ? '#3b82f6' : 
                              fleetRiskSummary.compliancePercentage >= 80 ? '#f97316' : '#f87171'
                            } 
                          />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                        {fleetRiskSummary.compliancePercentage}%
                      </span>
                      <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                        Compliance
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-sm flex-1 max-w-sm w-full">
                    <div className="bg-[#0c101d] border border-[#1e2538] p-2.5 rounded-lg text-xs text-[#94a3b8]">
                      <span className="font-semibold text-accent-blue block text-[11px] mb-0.5">Formula (3×5 Matrix):</span>
                      <code className="text-[10px] text-[#38bdf8]">Compliance Risk = IFS Criticality (1 to 3) × Overdue Index (0 to 5)</code>
                      <span className="block text-[10px] text-text-muted mt-0.5">Scale: 0 to 15 | Overdue % = (Today - Due Date) / PM Interval × 100%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Total Scope Machines:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.totalMachines} machines</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Avg Compliance Score:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgComplianceRisk} / 15</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Deduction:</span>
                      <span className={fleetRiskSummary.complianceDeductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {fleetRiskSummary.complianceDeductedPoints > 0 ? `-${fleetRiskSummary.complianceDeductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">On Schedule:</span>
                      <span className="font-semibold text-status-ok">{fleetRiskSummary.complianceCount.onSchedule} machines</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Low Delay (1-3 pts):</span>
                      <span className="font-semibold text-lime-400">{fleetRiskSummary.complianceCount.lowDelay} machines</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Moderate Delay (4-6 pts):</span>
                      <span className="font-semibold text-orange-400">{fleetRiskSummary.complianceCount.moderateDelay} machines</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Severe Delay (&gt;6 pts):</span>
                      <span className={fleetRiskSummary.complianceCount.severeDelay > 0 ? 'font-bold text-status-error' : 'font-semibold text-text-muted'}>
                        {fleetRiskSummary.complianceCount.severeDelay} machines
                      </span>
                    </div>
                  </div>
                </div>
              )}
              {maximizedChart === 'kpi-total-risk' && (
                <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-8 p-4">
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={240} height={240}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Total Health Points', value: Math.max(0, fleetRiskSummary.maxTotalPoints - fleetRiskSummary.totalDeductedPoints) },
                            { name: 'Deducted Points', value: fleetRiskSummary.totalDeductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={75}
                          outerRadius={105}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          stroke="none"
                        >
                          <Cell 
                            fill={
                              fleetRiskSummary.totalHealthPercentage >= 95 ? '#84cc16' : 
                              fleetRiskSummary.totalHealthPercentage >= 90 ? '#3b82f6' : 
                              fleetRiskSummary.totalHealthPercentage >= 80 ? '#f97316' : '#f87171'
                            } 
                          />
                          <Cell fill="#1e293b" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                      <span className="text-3xl font-extrabold text-text-primary tracking-tight">
                        {fleetRiskSummary.totalHealthPercentage}%
                      </span>
                      <span className="text-xs uppercase tracking-wider font-semibold text-text-muted">
                        Total Health
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-sm flex-1 max-w-sm w-full">
                    <div className="bg-[#0c101d] border border-[#1e2538] p-2.5 rounded-lg text-xs text-[#94a3b8]">
                      <span className="font-semibold text-accent-blue block text-[11px] mb-0.5">Formula (CBMnet §1.6):</span>
                      <code className="text-[10px] text-[#38bdf8]">CBM Total Risk = Fault Risk + (20% × Compliance Risk)</code>
                      <span className="block text-[10px] text-text-muted mt-0.5">Scale: 1.0 to 15.0 | Total Health % = [(Max Potential - Deductions) / Max Potential] × 100%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Total Scope Machines:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.totalMachines} machines</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Avg Total Risk:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgTotalRisk} / 15</strong>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Deduction:</span>
                      <span className={fleetRiskSummary.totalDeductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {fleetRiskSummary.totalDeductedPoints > 0 ? `-${fleetRiskSummary.totalDeductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Critical Risk (&ge;12):</span>
                      <span className={fleetRiskSummary.totalRiskCount.critical > 0 ? 'font-bold text-status-error' : 'font-semibold text-text-muted'}>
                        {fleetRiskSummary.totalRiskCount.critical} machines
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">High Risk (8 - 11.9):</span>
                      <span className={fleetRiskSummary.totalRiskCount.high > 0 ? 'font-bold text-orange-400' : 'font-semibold text-text-muted'}>
                        {fleetRiskSummary.totalRiskCount.high} machines
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Medium Risk (4 - 7.9):</span>
                      <span className="font-semibold text-yellow-400">{fleetRiskSummary.totalRiskCount.medium} machines</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-2">
                      <span className="text-text-muted font-medium">Low Risk (&lt;4):</span>
                      <span className="font-semibold text-status-ok">{fleetRiskSummary.totalRiskCount.low} machines</span>
                    </div>
                  </div>
                </div>
              )}
              {maximizedChart === 'kpi-collection-compliance' && (
                <div className="w-full h-full p-2">
                  <CollectionCompliancePie
                    equipments={currentKpiEquipments}
                    selectedTechnology={selectedKpiTechnology}
                  />
                </div>
              )}
              {maximizedChart === 'kpi-failure-mechanisms' && (
                <div className="w-full h-full p-2">
                  <FailureMechanismsPie
                    reports={reports}
                    selectedMonth={selectedKpiMonth}
                    selectedTechnology={selectedKpiTechnology}
                  />
                </div>
              )}
              {maximizedChart === 'kpi-trend' && (
                <div className="w-full h-full p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overallHealthTrendData} margin={{ top: 15, right: 25, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} axisLine={{ stroke: '#334155' }} tickFormatter={(val) => `${val}%`} />
                      <RechartsTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            if (selectedTrendTab === 'compliance') {
                              return (
                                <div className="bg-[#0b0f19] border border-[#1e2a3a] px-3 py-2 rounded shadow-xl text-xs">
                                  <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-1">{label}</p>
                                  <p className="text-accent-blue font-bold mt-1">Compliance Rate: {item.compliancePercentage}%</p>
                                  <p className="text-text-muted mt-0.5">Technology: {selectedKpiTechnology}</p>
                                  <p className={item.overdueCount > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>
                                    Overdue: {item.overdueCount || 0} machines
                                  </p>
                                </div>
                              );
                            }
                            if (selectedTrendTab === 'risk') {
                              return (
                                <div className="bg-[#0b0f19] border border-[#1e2a3a] px-3 py-2 rounded shadow-xl text-xs">
                                  <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-1">{label}</p>
                                  <p className="text-accent-blue font-bold mt-1">Total Health Index: {item.totalHealthPercentage}%</p>
                                  <p className="text-text-muted mt-0.5">Technology: {selectedKpiTechnology}</p>
                                  <p className={item.atRisk > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>
                                    At Risk: {item.atRisk} machines
                                  </p>
                                </div>
                              );
                            }
                            return (
                              <div className="bg-[#0b0f19] border border-[#1e2a3a] px-3 py-2 rounded shadow-xl text-xs">
                                <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-1">{label}</p>
                                <p className="text-accent-blue font-bold mt-1">Overall Health: {item.healthPercentage}%</p>
                                <p className="text-text-muted mt-0.5">Points: {item.points.toLocaleString()} / {item.maxPoints.toLocaleString()}</p>
                                <p className={item.atRisk > 0 ? 'text-orange-400 mt-0.5' : 'text-status-ok mt-0.5'}>At Risk: {item.atRisk} machines</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="linear" 
                        dataKey={
                          selectedTrendTab === 'health'
                            ? 'healthPercentage'
                            : selectedTrendTab === 'compliance'
                            ? 'compliancePercentage'
                            : 'totalHealthPercentage'
                        } 
                        stroke="#5b9bf3" 
                        strokeWidth={2.5} 
                        dot={{ r: 6, fill: '#60a5fa', stroke: '#0e1726', strokeWidth: 2 }} 
                        activeDot={{ r: 8, fill: '#93c5fd', stroke: '#ffffff', strokeWidth: 2 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
