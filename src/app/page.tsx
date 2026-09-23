'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import CustomTable from '@/components/CustomTable';
import { 
  ArrowLeft, 
  X, 
  RefreshCw, 
  FileText, 
  PlusCircle,
  Calendar,
  User,
  Hash,
  Wrench,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Search,
  Activity,
  Filter,
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
  Legend,
} from 'recharts';
import {
  calculateCombinedRisk,
  calculateRiskScore,
  getWorstTechniqueStatus,
  getRiskCategory,
  calculateOverallHealth,
  calculateEquipmentCbmRisk,
  calculateFleetCbmRiskSummary,
  formatEquipmentClass,
} from '@/utils/riskMatrix';
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
  createdAt: string;
}

const EFFECTIVENESS_DESCRIPTIONS: Record<string, string> = {
  'Effective': 'Effective: the executed action addressed the identified condition and the available evidence supports the intended technical outcome;',
  'Partially Effective': 'Partially Effective: the action addressed part of the identified condition, but further action or monitoring remains necessary;',
  'Ineffective': 'Ineffective: the action did not address the identified condition or did not produce the intended technical outcome; or',
  'Not Yet Assessable': 'Not Yet Assessable: available feedback or post-action evidence is insufficient to determine effectiveness.',
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

// Severity mappings for dynamic chart plotting
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

const VIBRATION_FAILURE_MODES = [
  'LUBRICATION DEFICIENCY',
  'STRUCTURAL CLEARANCE',
  'CAVITATION',
  'BEARING INNER RACE',
  'BEARING OUTER RACE',
  'BEARING CAGE',
  'BEARING ROLLING ELEMENTS',
  'EXCESSIVE CLEARANCE (SHAFT, BEARINGS, BEARING HOUSING, GEAR)',
  'GEAR EFFORT',
  'ROTOR BAR PASS - ELECTRICAL',
  'UNBALANCE',
  'MISALIGNMENT',
  'PUMP ROTOR BLADES WEAR',
  'RESONANCE',
  'TEMPERATURE OVER THE LIMITS',
  'AXIAL DISPLACEMENT',
];

const OIL_FAILURE_MODES = [
  { value: 'WATER > 1%', label: 'WATER > 1% (WATER ABOVE 10,000 PPM)', directive: 'WATER ABOVE 10,000 PPM' },
  { value: 'WATER < 1%', label: 'WATER < 1% (WATER BELLOW 10,000 PPM)', directive: 'WATER BELLOW 10,000 PPM' },
  { value: 'EXTERNAL CONTAMINATION', label: 'EXTERNAL CONTAMINATION (PRESENCE OF EXTERNAL MATERIALS (Si, Na, B))', directive: 'PRESENCE OF EXTERNAL MATERIALS (Si, Na, B)' },
  { value: 'WEAR', label: 'WEAR (PRESENCE OF WEAR METALS (Fe, Cu, Al, Cr, etc))', directive: 'PRESENCE OF WEAR METALS (Fe, Cu, Al, Cr, etc)' },
  { value: 'VISCOSITY ABOVE NORMAL', label: 'VISCOSITY ABOVE NORMAL (COMERCIAL VISCOSITY +10%)', directive: 'COMERCIAL VISCOSITY +10%' },
  { value: 'VISCOSITY BELOW NORMAL', label: 'VISCOSITY BELOW NORMAL (COMERCIAL VISCOSITY -10%)', directive: 'COMERCIAL VISCOSITY -10%' },
  { value: 'ADDITIVE DEPLETION', label: 'ADDITIVE DEPLETION (TAN > 1,5 OR TBN < 4)', directive: 'TAN > 1,5 OR TBN < 4' },
  { value: 'HIGH PARTICLE COUNT', label: 'HIGH PARTICLE COUNT (NAS OVER THE LIMITS)', directive: 'NAS OVER THE LIMITS' },
];

const ALL_RECOM_FPSOS = ['DNY', 'UNY', 'PTY', 'ONE'];

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'work-order' | 'recommendations' | 'kpis'>('work-order');
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // KPIs tab states (SLB Optisite standard)
  const [selectedKpiFpsos, setSelectedKpiFpsos] = useState<Set<string>>(new Set());
  const [kpiFpsoPopoverOpen, setKpiFpsoPopoverOpen] = useState(false);
  const [kpiFpsoSearch, setKpiFpsoSearch] = useState('');
  const kpiFpsoPopoverRef = useRef<HTMLDivElement>(null);
  const [kpiTrendTimeRange, setKpiTrendTimeRange] = useState<string>('Last 6 Months');

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
        if (cellVal.includes(' - Tier ')) {
          cellVal = cellVal.split(' - Tier ')[0];
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

  // Overall Health calculation (Strictly from Equipment List table)
  const overallHealthData = useMemo(() => {
    return calculateOverallHealth(currentKpiEquipments);
  }, [currentKpiEquipments]);

  // CBMnet Fleet Risk Summary (Fault Risk, Compliance Risk, CBM Total Risk)
  const fleetRiskSummary = useMemo(() => {
    return calculateFleetCbmRiskSummary(currentKpiEquipments);
  }, [currentKpiEquipments]);

  // Compliance Calculation based on routine frequency (24 DAY)
  const complianceData = useMemo(() => {
    const total = currentKpiEquipments.length;
    if (total === 0) {
      return { total: 0, collected: 0, overdue: 0, percentage: 100 };
    }

    const now = new Date('2026-09-04T00:00:00Z').getTime();
    let collected = 0;
    let overdue = 0;

    currentKpiEquipments.forEach(eq => {
      const parts = (eq.lastUpdate || '').split(',')[0].trim().split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        const diffDays = (now - d.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays <= 24) {
          collected++;
        } else {
          overdue++;
        }
      } else {
        overdue++;
      }
    });

    const percentage = Number(((collected / total) * 100).toFixed(1));
    return { total, collected, overdue, percentage };
  }, [currentKpiEquipments]);

  // Reports state
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Overall Health Trend Data aggregated monthly based on Report Date and vessel scope
  const overallHealthTrendData = useMemo(() => {
    const currentScore = overallHealthData.healthPercentage;
    const currentPts = overallHealthData.healthPoints;
    const maxPts = overallHealthData.maxPoints;
    const currentAtRisk = overallHealthData.tier1Count + overallHealthData.tier2Count;

    // Pure monthly aggregation configs matching selected time range (no weekly subdivisions)
    const monthConfigs = kpiTrendTimeRange === 'Last Month'
      ? [
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
        ]
      : kpiTrendTimeRange === 'Last 3 Months'
      ? [
          { key: '2026-07', label: 'Jul 26' },
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
        ]
      : kpiTrendTimeRange === 'Last 6 Months'
      ? [
          { key: '2026-04', label: 'Apr 26' },
          { key: '2026-05', label: 'May 26' },
          { key: '2026-06', label: 'Jun 26' },
          { key: '2026-07', label: 'Jul 26' },
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
        ]
      : [
          { key: '2026-03', label: 'Mar 26' },
          { key: '2026-04', label: 'Apr 26' },
          { key: '2026-05', label: 'May 26' },
          { key: '2026-06', label: 'Jun 26' },
          { key: '2026-07', label: 'Jul 26' },
          { key: '2026-08', label: 'Aug 26' },
          { key: '2026-09', label: 'Sep 26' },
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
      return monthConfigs.map(m => ({ label: m.label, healthPercentage: 100, points: 0, maxPoints: 0, atRisk: 0 }));
    }

    return monthConfigs.map(cfg => {
      if (cfg.key === '2026-09') {
        return {
          label: cfg.label,
          healthPercentage: currentScore,
          points: currentPts,
          maxPoints: maxPts,
          atRisk: currentAtRisk,
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
        if (r.equipmentTag && r.overallCondition) {
          latestCondition.set(r.equipmentTag, r.overallCondition);
        }
      });

      let deducted = 0;
      let atRisk = 0;

      currentKpiEquipments.forEach(eq => {
        const cond = latestCondition.get(eq.tag) || 'Good - Tier 4';
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
      });

      const healthPts = Math.max(0, vesselMaxPts - deducted);
      const healthPct = Number(((healthPts / vesselMaxPts) * 100).toFixed(1));

      return {
        label: cfg.label,
        healthPercentage: healthPct,
        points: healthPts,
        maxPoints: vesselMaxPts,
        atRisk,
      };
    });
  }, [overallHealthData, kpiTrendTimeRange, reports, selectedKpiFpsos, availableKpiFpsos, currentKpiEquipments]);
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

  // Target Work Orders for KPI calculation based on selected vessel trigrams
  const currentKpiWorkOrders = useMemo(() => {
    if (selectedKpiFpsos.size === 0 || selectedKpiFpsos.size === availableKpiFpsos.length) {
      return workOrders;
    }
    return workOrders.filter(w => {
      const trigram = (w.fpso || '').replace(/^FPSO\s+/i, '').trim().toUpperCase();
      return selectedKpiFpsos.has(trigram);
    });
  }, [workOrders, selectedKpiFpsos, availableKpiFpsos]);

  // Open Action Items calculation (Backlog snapshot)
  const openActionsData = useMemo(() => {
    const total = currentKpiWorkOrders.length;
    const now = new Date('2026-09-04T00:00:00Z').getTime();
    let openCount = 0;
    let closedCount = 0;
    let inProgress = 0;
    let pending = 0;
    let accepted = 0;
    let overdueDue = 0;

    currentKpiWorkOrders.forEach(w => {
      const s = w.status;
      if (s === 'Finished' || s === 'Completed' || s === 'Cancelled' || s === 'Rejected') {
        closedCount++;
        return;
      }
      openCount++;
      if (s === 'In Progress') inProgress++;
      else if (s === 'Pending' || s === 'Observed') pending++;
      else if (s === 'Accepted') accepted++;
      else inProgress++;

      const parts = (w.dueDate || '').split(',')[0].trim().split('/');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        if (d.getTime() < now) {
          overdueDue++;
        }
      }
    });

    return {
      total,
      openCount,
      closedCount,
      inProgress,
      pending,
      accepted,
      overdueDue,
      donutData: openCount === 0 
        ? [{ name: 'All Completed', value: 1, color: '#84cc16' }]
        : [
            { name: 'In Progress', value: inProgress, color: '#3b82f6' },
            { name: 'Pending', value: pending, color: '#64748b' },
            { name: 'Accepted', value: accepted, color: '#93c5fd' },
          ].filter(item => item.value > 0)
    };
  }, [currentKpiWorkOrders]);

  // Modal states (Equipment Detail View)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);


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
    setMounted(true);
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
    document.addEventListener('mousedown', handleClickOutsideRecomFpso);
    document.addEventListener('mousedown', handleClickOutsideKpiFpso);
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRecomFpso);
      document.removeEventListener('mousedown', handleClickOutsideKpiFpso);
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

  // Handle updating recommendation effectiveness classification
  const handleEffectivenessChange = async (newVal: string) => {
    if (!selectedReport) return;
    setIsSavingEffectiveness(true);

    // Optimistic UI update
    const updated = { ...selectedReport, effectiveness: newVal };
    setSelectedReport(updated);
    setReports(prev => prev.map(r => r.id === selectedReport.id ? { ...r, effectiveness: newVal } : r));

    try {
      const res = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedReport.id, effectiveness: newVal }),
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

    // Anchor to operational timeline date (2026-08-31)
    const today = new Date('2026-08-31T23:59:59Z');
    const isOverdue = today > plannedDate;

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

  // Format history array chronologically for the trend chart
  const getChartData = () => {
    return [...history].reverse().map(h => {
      const date = new Date(h.changedAt);
      const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      
      const formatStatus = (s?: string) => {
        if (!s) return 'Good - Tier 4';
        if (s === 'Good') return 'Good - Tier 4';
        if (s === 'Degraded') return 'Degraded - Tier 2';
        if (s === 'Critical') return 'Critical - Tier 1';
        return s;
      };

      const overallStr = formatStatus(h.overallCondition);
      const vibrationStr = formatStatus(h.vibrationStatus);
      const lubeStr = formatStatus(h.lubeOilStatus);
      
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

  interface TooltipPayloadEntry {
    name: string;
    payload: {
      name: string;
      overallLabel: string;
      vibrationLabel: string;
      lubeOilLabel: string;
    };
  }

  interface CustomTooltipProps {
    active?: boolean;
    payload?: TooltipPayloadEntry[];
  }

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1a2136] border border-[#2b3655] p-3 rounded-lg shadow-2xl text-[11px] text-[#c5d0e6] flex flex-col gap-1.5 select-none z-50 min-w-[200px]">
          <p className="font-bold text-[#f8fafc] pb-1 border-b border-[#2b3655]/60 text-xs">{data.name}</p>
          <p className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Overall Status:
            </span>
            <span className="font-semibold text-[#10b981]">{data.overallLabel}</span>
          </p>
          <p className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-[#a855f7]" />
              Vibration Status:
            </span>
            <span className="font-semibold text-[#c084fc]">{data.vibrationLabel}</span>
          </p>
          <p className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#94a3b8]">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Lube Oil Status:
            </span>
            <span className="font-semibold text-[#fbbf24]">{data.lubeOilLabel}</span>
          </p>
        </div>
      );
    }
    return null;
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
    { key: 'condition', header: 'Equip. CBM Condition', render: (val: string) => getStatusDot(val) },
    { key: 'lastUpdate', header: 'Last Update' },
    { key: 'observation', header: 'Observation' },
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
        plannedNextVibrationDate: nextVib.plannedDateStr,
        plannedNextOilDate: nextOil.plannedDateStr,
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

    return {
      id: String(r.id),
      fpso: (r.facility || 'UNY').replace(/^FPSO\s+/i, ''),
      tagNumber: r.tagNumber,
      name: r.machineName || r.component || 'Compressor Performance',
      equipmentClass: r.equipmentClass || 'Centrifugal Compressor',
      analysisType: r.technology || 'Vibration Analysis',
      effectiveness: r.effectiveness || 'N/A',
      shortDescription: r.shortDescription || '-',
      cbmStatus: formatSurveillanceTier(techniqueStatus),
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
            {/* Top Vessel Scope Capsule Filter Bar (SLB Optisite Pill) */}
            <div className="flex items-center justify-between gap-4 bg-bg-card border border-border-panel rounded-card px-4 py-2.5 shadow-sm select-none">
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted font-medium">Vessel Scope:</span>
                {/* SLB Capsule Popover Filter */}
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

              <div className="text-xs text-text-muted font-medium hidden sm:flex items-center gap-1.5">
                <span>Total Evaluated Machines:</span>
                <strong className="text-text-primary font-bold">{overallHealthData.totalMachines}</strong>
              </div>
            </div>

            {/* Row 1: 3 KPI Snapshot Cards Side-by-Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Fault Risk & Overall Health */}
              <DashboardCard
                title={kpiFpsoLabel === 'All FPSOs' ? 'Fault Risk & Overall Health' : `${kpiFpsoLabel} Fault Risk & Health`}
                timeRange="Current Snapshot"
                onMaximize={() => setMaximizedChart('kpi-health')}
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
              >
                <div className="w-full flex flex-col xl:flex-row items-center justify-around gap-4 p-1">
                  {/* Circular Donut with percentage in center */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={145} height={145}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Health Points', value: overallHealthData.healthPoints },
                            { name: 'Deducted Points', value: overallHealthData.deductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={64}
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
                      <span className="text-xl font-extrabold text-text-primary tracking-tight">
                        {overallHealthData.healthPercentage}%
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-text-muted">
                        Health
                      </span>
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div className="flex flex-col gap-2 text-[11px] flex-1 w-full max-w-[210px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Avg Fault Risk:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgFaultRisk} / 12</strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Evaluated:</span>
                      <span className="font-semibold text-text-primary">{overallHealthData.totalMachines} machines</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">At Risk:</span>
                      <span className={overallHealthData.tier1Count + overallHealthData.tier2Count > 0 ? 'font-bold text-orange-400' : 'font-semibold text-status-ok'}>
                        {overallHealthData.tier1Count + overallHealthData.tier2Count} ({overallHealthData.tier1Count} Crit, {overallHealthData.tier2Count} Deg)
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Deduction:</span>
                      <span className={overallHealthData.deductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {overallHealthData.deductedPoints > 0 ? `-${overallHealthData.deductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Card 2: Compliance Risk (FAR Overdue PM Matrix) */}
              <DashboardCard
                title="Compliance Risk (Overdue PM)"
                timeRange="Current Snapshot"
                onMaximize={() => setMaximizedChart('kpi-compliance')}
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
              >
                <div className="w-full flex flex-col xl:flex-row items-center justify-around gap-4 p-1">
                  {/* Circular Donut with Compliance % in center */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={145} height={145}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Compliance Points', value: Math.max(0, fleetRiskSummary.maxCompliancePoints - fleetRiskSummary.complianceDeductedPoints) },
                            { name: 'Deducted Points', value: fleetRiskSummary.complianceDeductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={64}
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
                      <span className="text-xl font-extrabold text-text-primary tracking-tight">
                        {fleetRiskSummary.compliancePercentage}%
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-text-muted">
                        Compliance
                      </span>
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div className="flex flex-col gap-2 text-[11px] flex-1 w-full max-w-[210px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Avg Compliance:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgComplianceRisk} / 15</strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">On Schedule:</span>
                      <span className="font-semibold text-status-ok">{fleetRiskSummary.complianceCount.onSchedule} machines</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Overdue PM:</span>
                      <span className={(fleetRiskSummary.complianceCount.lowDelay + fleetRiskSummary.complianceCount.moderateDelay + fleetRiskSummary.complianceCount.severeDelay) > 0 ? 'font-bold text-orange-400' : 'font-semibold text-status-ok'}>
                        {fleetRiskSummary.complianceCount.lowDelay + fleetRiskSummary.complianceCount.moderateDelay + fleetRiskSummary.complianceCount.severeDelay} machines
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Deduction:</span>
                      <span className={fleetRiskSummary.complianceDeductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {fleetRiskSummary.complianceDeductedPoints > 0 ? `-${fleetRiskSummary.complianceDeductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              </DashboardCard>

              {/* Card 3: CBM Total Risk */}
              <DashboardCard
                title="CBM Total Risk"
                timeRange="Current Snapshot"
                onMaximize={() => setMaximizedChart('kpi-total-risk')}
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
              >
                <div className="w-full flex flex-col xl:flex-row items-center justify-around gap-4 p-1">
                  {/* Circular Donut with Total Health % in center */}
                  <div className="relative flex items-center justify-center shrink-0">
                    <ResponsiveContainer width={145} height={145}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Total Health Points', value: Math.max(0, fleetRiskSummary.maxTotalPoints - fleetRiskSummary.totalDeductedPoints) },
                            { name: 'Deducted Points', value: fleetRiskSummary.totalDeductedPoints },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={46}
                          outerRadius={64}
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
                      <span className="text-xl font-extrabold text-text-primary tracking-tight">
                        {fleetRiskSummary.totalHealthPercentage}%
                      </span>
                      <span className="text-[8px] uppercase tracking-wider font-semibold text-text-muted">
                        Total Health
                      </span>
                    </div>
                  </div>

                  {/* Breakdown list */}
                  <div className="flex flex-col gap-2 text-[11px] flex-1 w-full max-w-[210px]">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">Avg Total Risk:</span>
                      <strong className="text-text-primary font-bold">{fleetRiskSummary.avgTotalRisk} / 15</strong>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Crit / High:</span>
                      <span className={fleetRiskSummary.totalRiskCount.critical + fleetRiskSummary.totalRiskCount.high > 0 ? 'font-bold text-status-error' : 'font-semibold text-text-muted'}>
                        {fleetRiskSummary.totalRiskCount.critical + fleetRiskSummary.totalRiskCount.high} machines
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Med / Low:</span>
                      <span className="font-semibold text-status-ok">
                        {fleetRiskSummary.totalRiskCount.medium + fleetRiskSummary.totalRiskCount.low} machines
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-border-panel/40 pt-1.5">
                      <span className="text-text-muted font-medium">Deduction:</span>
                      <span className={fleetRiskSummary.totalDeductedPoints > 0 ? 'font-bold text-status-warn' : 'font-semibold text-status-ok'}>
                        {fleetRiskSummary.totalDeductedPoints > 0 ? `-${fleetRiskSummary.totalDeductedPoints} pts` : '0 pts'}
                      </span>
                    </div>
                  </div>
                </div>
              </DashboardCard>
            </div>

            {/* Row 2: Full-Width Overall Health Trend */}
            <div className="w-full">
              <DashboardCard
                title="Overall Health Trend"
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
                            return (
                              <div className="bg-[#0b0f19] border border-[#1e2a3a] px-2.5 py-1.5 rounded shadow-xl text-[10px]">
                                <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-0.5">{label}</p>
                                <p className="text-[#38bdf8] font-bold mt-1">Overall Health: {item.healthPercentage}%</p>
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
                        dataKey="healthPercentage" 
                        stroke="#5b9bf3" 
                        strokeWidth={2}
                        dot={{ r: 4.5, fill: '#60a5fa', stroke: '#0e1726', strokeWidth: 2 }}
                        activeDot={{ r: 6.5, fill: '#93c5fd', stroke: '#ffffff', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </DashboardCard>
            </div>
          </div>
        )}
      </main>

      {/* Modal para alteração do status e histórico (Equipment Details) */}
      {modalOpen && selectedEquipment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-panel rounded-card p-6 w-full max-w-[620px] relative animate-fadeIn shadow-2xl text-left">
            
            {/* Botão de Fechar */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>

            {/* Header da Modal SLB OptiSite Style */}
            {(() => {
              const modalOverallCondition = getWorstTechniqueStatus(
                selectedEquipment.vibrationStatus,
                selectedEquipment.lubeOilStatus,
                selectedEquipment.condition
              );
              const eqCbmRisk = calculateEquipmentCbmRisk(selectedEquipment);

              return (
                <div className="mb-3">
                  {/* Breadcrumb SLB Figma */}
                  <div className="text-[11px] text-[#8a94a6] font-medium tracking-wide mb-1">
                    Equipment Detail
                  </div>

                  {/* Header: Tag + Name + Classification + Risk Badges */}
                  <div className="flex items-start justify-between gap-3 pr-8">
                    <div>
                      <h2 className="text-lg font-bold text-[#f8fafc] tracking-tight">
                        {selectedEquipment.tag} {selectedEquipment.name}
                      </h2>
                      <div className="text-xs text-[#8a94a6] mt-0.5 font-medium">
                        {selectedEquipment.class ? `${formatEquipmentClass(selectedEquipment.class)} - ` : ''}{selectedEquipment.name}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        {/* Fault Risk Badge */}
                        <span 
                          className="bg-[#1e2538] border border-[#2b3552] text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm cursor-help"
                          title={`Fault Risk = Condition Tier x Criticality = ${eqCbmRisk.faultRisk} / 12 (${eqCbmRisk.faultCategory})`}
                        >
                          <span className="text-[#8a94a6]">Fault:</span>
                          <span style={{ color: eqCbmRisk.faultColorHex }} className="font-bold">{eqCbmRisk.faultRisk}/12</span>
                        </span>

                        {/* Compliance Risk Badge */}
                        <span 
                          className="bg-[#1e2538] border border-[#2b3552] text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm cursor-help"
                          title={`Compliance Risk = Criticality x Overdue Index = ${eqCbmRisk.complianceRisk} / 15 (${eqCbmRisk.complianceResult.label}) - Vib Overdue: ${eqCbmRisk.vibOverdue.overduePercent}%, Oil Overdue: ${eqCbmRisk.oilOverdue.overduePercent}%`}
                        >
                          <span className="text-[#8a94a6]">Compliance:</span>
                          <span style={{ color: eqCbmRisk.complianceResult.colorHex }} className="font-bold">{eqCbmRisk.complianceRisk}/15</span>
                        </span>

                        {/* CBM Total Risk Badge */}
                        <span 
                          className="bg-[#1e2538] border border-[#2b3552] text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm cursor-help"
                          title={`CBM Total Risk = Fault (${eqCbmRisk.faultRisk}) + 20% x Compliance (${eqCbmRisk.complianceRisk}) = ${eqCbmRisk.totalRisk} / 15 (${eqCbmRisk.totalCategory})`}
                        >
                          <span className="text-[#8a94a6]">Total Risk:</span>
                          <span style={{ color: eqCbmRisk.totalColorHex }} className="font-bold">{eqCbmRisk.totalRisk}/15</span>
                        </span>

                        <span className="text-[11px] text-[#8a94a6] font-medium ml-1">
                          Status: <strong className={`font-semibold ${
                            modalOverallCondition?.includes('Good') ? 'text-[#10b981]' :
                            modalOverallCondition?.includes('Degraded') ? 'text-[#f59e0b]' :
                            modalOverallCondition?.includes('Critical') ? 'text-[#ef4444]' : 'text-[#8a94a6]'
                          }`}>{modalOverallCondition}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Illustrative Read-Only Status & Observation Overview */}
            <div className="flex flex-col gap-4 mt-4">
              {/* Individual Technique Status Cards */}
              {(() => {
                const vibDate = selectedEquipment.lastVibrationUpdate || selectedEquipment.lastUpdate;
                const oilDate = selectedEquipment.lastLubeOilUpdate || selectedEquipment.lastUpdate;
                const vibFreq = formatFrequencyBadge(selectedEquipment.vibrationFrequency, 24);
                const oilFreq = formatFrequencyBadge(selectedEquipment.lubeOilFrequency, 84);

                const vibNext = calculateNextPlannedDate(vibDate, vibFreq, 24);
                const oilNext = calculateNextPlannedDate(oilDate, oilFreq, 84);

                const vibLastDateStr = vibDate ? vibDate.split(',')[0] : '26/08/2026';
                const oilLastDateStr = oilDate ? oilDate.split(',')[0] : '26/08/2026';
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Vibration Status Card */}
                    <div className="bg-[#131929] p-3.5 border border-[#232c45] rounded-xl flex flex-col justify-between gap-3 h-full shadow-sm">
                      {/* Linha 1: Topo (Ícone + Título + Read-only Frequency Badge from DB) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#1a233d] border border-[#2d3a5e] flex items-center justify-center text-[#3b82f6] shrink-0">
                            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M2 12h3l3-8 4 16 3-10 2 4h3" />
                            </svg>
                          </div>
                          <span className="text-[#f1f5f9] font-bold uppercase text-[10px] tracking-wider whitespace-nowrap truncate">
                            VIBRATION ANALYSIS
                          </span>
                        </div>

                        {/* Read-only Frequency Badge */}
                        <span className="bg-[#1a2034] border border-[#283556] text-[#94a3b8] text-[10px] font-semibold rounded-full px-2.5 py-0.5 shrink-0" title="Routine collection frequency ingested from database">
                          {vibFreq}
                        </span>
                      </div>

                      {/* Linha 2: Centro (Status CBM) */}
                      <div className="flex items-center gap-2 pl-0.5 text-xs font-semibold">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedEquipment.vibrationStatus?.includes('Good') ? 'bg-[#10b981]' :
                          selectedEquipment.vibrationStatus?.includes('Degraded') ? 'bg-[#f59e0b]' :
                          selectedEquipment.vibrationStatus?.includes('Critical') ? 'bg-[#ef4444]' : 'bg-[#6b7280]'
                        }`} />
                        <span className={
                          selectedEquipment.vibrationStatus?.includes('Good') ? 'text-[#10b981]' :
                          selectedEquipment.vibrationStatus?.includes('Degraded') ? 'text-[#f59e0b]' :
                          selectedEquipment.vibrationStatus?.includes('Critical') ? 'text-[#f87171]' : 'text-[#94a3b8]'
                        }>
                          {selectedEquipment.vibrationStatus || 'Good - Tier 4'}
                        </span>
                      </div>

                      {/* Linha 3: Rodapé (Last & Next) */}
                      <div className="flex items-center justify-between text-[11px] text-[#8a94a6] font-medium pt-2 border-t border-[#1e2538]">
                        <span>Last: <strong className="text-[#f8fafc] font-semibold">{vibLastDateStr}</strong></span>
                        <span>
                          Next: <strong className={vibNext.isOverdue ? "text-[#ef4444] font-bold" : "text-[#38bdf8] font-semibold"}>
                            {vibNext.plannedDateStr}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Lube Oil Status Card */}
                    <div className="bg-[#131929] p-3.5 border border-[#232c45] rounded-xl flex flex-col justify-between gap-3 h-full shadow-sm">
                      {/* Linha 1: Topo (Ícone + Título + Read-only Frequency Badge from DB) */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[#1a233d] border border-[#2d3a5e] flex items-center justify-center text-[#3b82f6] shrink-0">
                            <svg className="w-3.5 h-3.5 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                            </svg>
                          </div>
                          <span className="text-[#f1f5f9] font-bold uppercase text-[10px] tracking-wider whitespace-nowrap truncate">
                            LUBE OIL ANALYSIS
                          </span>
                        </div>

                        {/* Read-only Frequency Badge */}
                        <span className="bg-[#1a2034] border border-[#283556] text-[#94a3b8] text-[10px] font-semibold rounded-full px-2.5 py-0.5 shrink-0" title="Routine collection frequency ingested from database">
                          {oilFreq}
                        </span>
                      </div>

                      {/* Linha 2: Centro (Status CBM) */}
                      <div className="flex items-center gap-2 pl-0.5 text-xs font-semibold">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedEquipment.lubeOilStatus?.includes('Good') ? 'bg-[#10b981]' :
                          selectedEquipment.lubeOilStatus?.includes('Degraded') ? 'bg-[#f59e0b]' :
                          selectedEquipment.lubeOilStatus?.includes('Critical') ? 'bg-[#ef4444]' : 'bg-[#6b7280]'
                        }`} />
                        <span className={
                          selectedEquipment.lubeOilStatus?.includes('Good') ? 'text-[#10b981]' :
                          selectedEquipment.lubeOilStatus?.includes('Degraded') ? 'text-[#f59e0b]' :
                          selectedEquipment.lubeOilStatus?.includes('Critical') ? 'text-[#f87171]' : 'text-[#94a3b8]'
                        }>
                          {selectedEquipment.lubeOilStatus || 'Good - Tier 4'}
                        </span>
                      </div>

                      {/* Linha 3: Rodapé (Last & Next) */}
                      <div className="flex items-center justify-between text-[11px] text-[#8a94a6] font-medium pt-2 border-t border-[#1e2538]">
                        <span>Last: <strong className="text-[#f8fafc] font-semibold">{oilLastDateStr}</strong></span>
                        <span>
                          Next: <strong className={oilNext.isOverdue ? "text-[#ef4444] font-bold" : "text-[#10b981] font-semibold"}>
                            {oilNext.plannedDateStr}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Read-only Observation Card */}
              <div className="bg-[#131929] p-3.5 border border-[#232c45] rounded-xl flex flex-col gap-1.5 text-xs shadow-sm">
                <span className="text-[#8a94a6] font-bold uppercase text-[10px] tracking-wider">LATEST OBSERVATION</span>
                <p className="text-[#f1f5f9] text-xs leading-relaxed font-medium">
                  {selectedEquipment.observation || 'No observations registered for this equipment.'}
                </p>
              </div>

              {/* Grafico: Historical condition trend (Multi-line) */}
              <div className="bg-[#131929] border border-[#232c45] p-4 rounded-xl shadow-sm">
                <h4 className="text-xs font-bold text-[#f1f5f9] mb-3">Historical condition trend</h4>
                
                {mounted && history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={getChartData()} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#202742" vertical={false} opacity={0.5} />
                      <XAxis
                        dataKey="name"
                        stroke="var(--text-muted)"
                        fontSize={8}
                        tickLine={false}
                        axisLine={{ stroke: '#202742', strokeWidth: 1 }}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        fontSize={8}
                        axisLine={false}
                        tickLine={false}
                        domain={[0, 4]}
                        ticks={[0, 1, 2, 3, 4]}
                        tickFormatter={(val) => {
                          switch (val) {
                            case 4: return 'Good T4';
                            case 3: return 'Good T3';
                            case 2: return 'Warn - T2';
                            case 1: return 'Crit - T1';
                            case 0: return 'Off';
                            default: return '';
                          }
                        }}
                      />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                      
                      <Line
                        name="Vibration Analysis"
                        type="monotone"
                        dataKey="vibration"
                        stroke="#a855f7"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        name="Lube Oil Analysis"
                        type="monotone"
                        dataKey="lubeOil"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        strokeDasharray="2 2"
                        dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-text-muted text-[10px]">
                    No history data available for this equipment.
                  </div>
                )}
              </div>

              {/* Modal Footer with Log New Analysis action button */}
              <div className="flex items-center justify-end pt-3 border-t border-[#232c45]">
                <button
                  type="button"
                  onClick={openReportForm}
                  className="border border-[#2a3656] bg-[#121626] text-text-primary hover:border-accent-blue hover:text-accent-blue px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <PlusCircle size={13} />
                  Log new analysis
                </button>
              </div>
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
                    <label className="text-[#94a3b8] font-medium text-xs">Work Order Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1089487"
                      value={formFields.woNumber}
                      onChange={e => setFormFields({ ...formFields, woNumber: e.target.value })}
                      className="bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-2 text-[#f1f5f9] focus:border-[#3b82f6] outline-none transition-colors text-xs placeholder:text-[#475569]"
                    />
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

      {/* Digital Excel Report Viewer Side-Overlay (Details of a Recommendations report) */}
      {reportDetailsOpen && selectedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-end p-0">
          <div className="bg-[#0b0f19] border-l border-[#202742] w-full max-w-[680px] h-full flex flex-col animate-slideLeft shadow-2xl relative">
            
            {/* Top Bar Details close */}
            <div className="p-4 border-b border-[#202742] bg-[#101422] flex items-center justify-between select-none">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <FileText size={14} className="text-accent-blue" />
                CBM Analysis Report Details
              </span>
              <button
                onClick={() => setReportDetailsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary hover:bg-[#202742] rounded transition-all cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Excel Sheet Simulator container SLB Style */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0b0f19] text-[#f1f5f9] select-text">
              
              {/* simulated Excel Border wrapper */}
              <div className="border border-[#202742] rounded-xl overflow-hidden bg-[#101422]/60 shadow-xl max-w-[620px] mx-auto">
                
                {/* Excel Row 1: Solid severity header banner SLB Category Colors */}
                <div className={`p-3.5 text-center font-bold text-xs tracking-widest uppercase border-b border-[#202742] ${
                  selectedReport.overallCondition?.includes('Critical') ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/40' :
                  selectedReport.overallCondition?.includes('Degraded') ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/40' :
                  'bg-[#4ade80]/20 text-[#4ade80] border-[#4ade80]/40'
                }`}>
                  {selectedReport.overallCondition}
                </div>

                {/* Row 1: FPSO & System */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">FPSO</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.fpso || selectedReport.facility}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">System</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.system || selectedReport.system}
                    </span>
                  </div>
                </div>

                {/* Row 2: Equipment Tag & Name */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Equipment Tag</span>
                    <span className="p-2.5 text-[#fbbf24] flex-1 flex items-center font-bold">
                      {selectedReport.equipmentTag}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Name</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.name || selectedReport.component}
                    </span>
                  </div>
                </div>

                {/* Row 3: Equipment Class & Criticality */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Equipment Class</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {formatEquipmentClass(equipments.find(e => e.tag === selectedReport.equipmentTag)?.class || selectedReport.equipmentClass || 'N/A')}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Criticality</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.criticality || selectedReport.cof || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Row 4: Object Type & Last Update */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Object Type</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.objectType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[110px] flex-shrink-0 border-r border-[#202742] flex items-center">Last Update</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.lastUpdate || selectedReport.raisedDate}
                    </span>
                  </div>
                </div>

                {/* Condition Assessment / Observations */}
                <div className="border-b border-[#202742] text-[10px]">
                  <div className="bg-[#121626] text-text-muted p-2.5 font-bold uppercase tracking-wider border-b border-[#202742]">
                    Condition Assessment (Observations)
                  </div>
                  <div className="p-3.5 text-text-primary leading-relaxed text-[11px] bg-[#101422]/40">
                    {selectedReport.conditionAssessment}
                  </div>
                </div>

                {/* Supporting Images / Analytical Evidence */}
                <div className="border-b border-[#202742] text-[10px] bg-[#101422]/60 p-4">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-text-muted font-bold uppercase tracking-wider text-[9px]">Supporting Images / Analytical Evidence</span>
                    <label className="bg-[#121626] border border-[#333e68] hover:border-accent-blue text-text-primary px-3 py-1 rounded-full text-[9px] font-semibold cursor-pointer transition-colors flex items-center gap-1 select-none">
                      <PlusCircle size={10} className="text-[#60a5fa]" />
                      {selectedReport.imageUrl ? 'Change Image' : 'Attach Image'}
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
                  </div>
                  {selectedReport.imageUrl ? (
                    <div className="border border-[#202742] rounded-lg overflow-hidden bg-[#0b0f19] p-2 flex flex-col items-center justify-center relative group">
                      <img 
                        src={selectedReport.imageUrl} 
                        alt="Supporting Analytical Evidence" 
                        className="max-h-[280px] w-auto object-contain rounded border border-[#202742]"
                      />
                    </div>
                  ) : (
                    <label className="border border-dashed border-[#333e68] hover:border-accent-blue rounded-lg p-6 bg-[#0b0f19] flex flex-col items-center justify-center text-text-muted italic text-[9px] gap-2 cursor-pointer transition-colors select-none">
                      <FileText size={24} className="text-[#60a5fa]/50" />
                      <span className="text-text-primary font-medium font-sans">Click to attach an evidence image / screenshot</span>
                      <span className="text-text-muted text-[8px]">Supports PNG, JPG, WebP</span>
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
                  )}
                </div>

                {/* Technical Metadata info section */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">Component</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">{selectedReport.component || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">Raised By</span>
                    <span className="p-2.5 text-[#38bdf8] flex-1 flex items-center flex-row gap-1">
                      <User size={10} />
                      {selectedReport.raisedBy}
                    </span>
                  </div>
                </div>

                {/* Date metadata */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">Raised Date</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center flex-row gap-1">
                      <Calendar size={10} />
                      {selectedReport.raisedDate}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">Target Date</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center flex-row gap-1">
                      <Calendar size={10} />
                      {selectedReport.targetDate || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Description info */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#202742] uppercase font-semibold">
                  <div className="border-r border-[#202742] flex">
                    <span className="bg-[#121626] text-text-muted p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">Description</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center">{selectedReport.shortDescription}</span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#121626] text-[#f87171] p-2.5 w-[100px] flex-shrink-0 border-r border-[#202742] flex items-center">WO Number</span>
                    <span className="p-2.5 text-text-primary flex-1 flex items-center flex-row gap-1 font-bold">
                      <Hash size={10} />
                      {selectedReport.woNumber ? (
                        <button
                          onClick={() => navigateToWorkOrder(selectedReport.woNumber!)}
                          className="text-accent-blue hover:underline font-bold text-left cursor-pointer"
                        >
                          {selectedReport.woNumber}
                        </button>
                      ) : (
                        <span className="text-text-muted italic">PENDING</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Failure Mode Information Section */}
                <div className="border-b border-[#202742]">
                  <div className="bg-[#121626] text-text-muted p-2.5 font-bold uppercase tracking-wider text-[10px] border-b border-[#202742] flex items-center gap-1.5">
                    <AlertCircle size={12} className="text-status-warn" />
                    Failure Mode Information
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 text-[10px] uppercase font-semibold">
                    <div className="border-r border-b border-[#202742] flex">
                      <span className="bg-[#121626] text-text-muted p-2.5 w-[130px] sm:w-[155px] flex-shrink-0 border-r border-[#202742] flex items-center">Equipment Class</span>
                      <span className="p-2.5 text-text-primary flex-1 flex items-center">{formatEquipmentClass(selectedReport.equipmentClass || equipments.find(e => e.tag === selectedReport.equipmentTag)?.class || 'N/A')}</span>
                    </div>
                    <div className="border-b border-[#202742] flex">
                      <span className="bg-[#121626] text-text-muted p-2.5 w-[145px] sm:w-[165px] flex-shrink-0 border-r border-[#202742] flex items-center">Failure Mechanism Subdivision</span>
                      <span className="p-2.5 text-text-primary flex-1 flex items-center">{selectedReport.failureMechanismSubdivision || 'N/A'}</span>
                    </div>
                    <div className="col-span-1 md:col-span-2 flex">
                      <span className="bg-[#121626] text-text-muted p-2.5 w-[130px] sm:w-[155px] flex-shrink-0 border-r border-[#202742] flex items-center">Failure Mode Description</span>
                      <span className="p-2.5 text-text-primary flex-1 flex items-center font-bold text-[#f59e0b]">{selectedReport.failureModeDescription || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Recommendations (Long Description) */}
                <div className="text-[10px]">
                  <div className="bg-[#121626] text-text-muted p-2.5 font-bold uppercase tracking-wider border-b border-[#202742] flex items-center gap-1.5">
                    <Wrench size={12} className="text-accent-blue" />
                    Long Description (Recommendations)
                  </div>
                  <div className="p-3.5 text-text-primary leading-relaxed text-[11px] whitespace-pre-line bg-[#101422]/40">
                    {selectedReport.longDescription}
                  </div>
                </div>

                {/* Recommendation Effectiveness Classification (ISO 6.4.6.1) */}
                <div className="border-t border-[#202742] text-[10px]">
                  <div className="bg-[#121626] text-text-muted p-2.5 font-bold uppercase tracking-wider border-b border-[#202742] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-[#10b981]" />
                      Recommendation Effectiveness Classification (ISO 6.4.6.1)
                    </div>
                    {isSavingEffectiveness && (
                      <span className="text-[9px] text-[#60a5fa] font-semibold animate-pulse lowercase">
                        saving...
                      </span>
                    )}
                  </div>
                  <div className="p-3.5 bg-[#101422]/60 flex flex-col gap-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[#8a94a6] font-bold text-[10px] uppercase tracking-wider">
                        Effectiveness Status:
                      </label>
                      <div className="relative min-w-[210px]">
                        <select
                          value={selectedReport.effectiveness || 'Not Yet Assessable'}
                          onChange={(e) => handleEffectivenessChange(e.target.value)}
                          className="w-full bg-[#0c101d] border border-[#232a42] rounded-md px-3 py-1.5 text-[#f1f5f9] focus:border-[#3b82f6] outline-none cursor-pointer text-xs appearance-none pr-8 transition-colors font-semibold"
                        >
                          <option value="N/A" className="bg-[#0c101d] text-[#f1f5f9]">N/A</option>
                          <option value="Not Yet Assessable" className="bg-[#0c101d] text-[#f1f5f9]">Not Yet Assessable</option>
                          <option value="Effective" className="bg-[#0c101d] text-[#f1f5f9]">Effective</option>
                          <option value="Partially Effective" className="bg-[#0c101d] text-[#f1f5f9]">Partially Effective</option>
                          <option value="Ineffective" className="bg-[#0c101d] text-[#f1f5f9]">Ineffective</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#8a94a6]">
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Explanatory description from standard */}
                    <div className="text-[11px] text-[#94a3b8] italic bg-[#0c101d]/80 border border-[#1e2538] rounded p-2.5 leading-relaxed">
                      {EFFECTIVENESS_DESCRIPTIONS[selectedReport.effectiveness || 'Not Yet Assessable'] || EFFECTIVENESS_DESCRIPTIONS['Not Yet Assessable']}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons SLB Style */}
              <div className="max-w-[620px] mx-auto mt-5 flex justify-end gap-3 select-none">
                {selectedReport.woNumber ? (
                  <button
                    onClick={() => navigateToWorkOrder(selectedReport.woNumber!)}
                    className="flex items-center gap-2 bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-2 rounded-full text-xs transition-colors cursor-pointer shadow active:scale-95"
                  >
                    <FileText size={14} />
                    View Work Order ({selectedReport.woNumber})
                  </button>
                ) : (
                  <button
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
              {maximizedChart === 'kpi-trend' && 'Overall Health Trend (Maximized View)'}
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
                            return (
                              <div className="bg-[#0b0f19] border border-[#1e2a3a] px-3 py-2 rounded shadow-xl text-xs">
                                <p className="font-semibold text-text-primary border-b border-border-panel/40 pb-1">{label}</p>
                                <p className="text-[#38bdf8] font-bold mt-1">Overall Health: {item.healthPercentage}%</p>
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
                        dataKey="healthPercentage" 
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
