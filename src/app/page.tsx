'use client';
import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle
} from 'lucide-react';
import {
  WorkOrderStatusPie,
  DaysLeftBar,
  EquipmentConditionPie,
  CbmCriticalityBar,
  isWithinTimeRange
} from '@/components/MetricCharts';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
} from 'recharts';

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
  createdAt: string;
}

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


export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'work-order' | 'recommendations'>('work-order');
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

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

  // Reports state
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Work Orders state
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(true);
  const [woSearchQuery, setWoSearchQuery] = useState('');

  // Modal states (Equipment Detail View)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalFormFields, setModalFormFields] = useState({
    condition: 'Good - Tier 4',
    observation: '',
  });
  const [savingEquipment, setSavingEquipment] = useState(false);

  // Report Creation Form state
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [analysisType, setAnalysisType] = useState<'Vibration' | 'Lube Oil' | 'Thermography'>('Vibration');
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
  });

  // Report Detail Viewer state
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);

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
    setModalFormFields({
      condition: equip.condition || 'Good - Tier 4',
      observation: equip.observation || '',
    });
    setHistory([]);
    setModalOpen(true);

    await fetchEquipmentHistory(equip.tag);
  };

  // Save manual override of equipment condition and observations
  const handleEquipmentUpdate = async () => {
    if (!selectedEquipment) return;
    setSavingEquipment(true);
    try {
      const res = await fetch(`/api/equipments/${selectedEquipment.tag}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          condition: modalFormFields.condition,
          observation: modalFormFields.observation,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        // Refresh equipments list
        await fetchEquipments();
        // Update selected equipment details shown in modal
        setSelectedEquipment(updated);
        // Refresh history graph/table
        await fetchEquipmentHistory(selectedEquipment.tag);
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (err) {
      console.error('Error updating equipment:', err);
    } finally {
      setSavingEquipment(false);
    }
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

  // Formatação das bolinhas coloridas de status (Priority / Condition / Status)
  const getStatusDot = (status: string) => {
    if (!status) return null;
    const baseStatus = status.split(' - ')[0];
    
    if (status.includes('Critical') || baseStatus === 'Rejected') {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status.includes('Degraded')) {
      return (
        <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warn" />
          <span className="text-text-primary font-medium">{status}</span>
        </span>
      );
    }
    if (status.includes('Good') || baseStatus === 'Accepted') {
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
      
      let statusStr = h.overallCondition;
      if (h.overallCondition === 'Good') {
        statusStr = 'Good - Tier 4'; // fallback for legacy seed data
      } else if (h.overallCondition === 'Degraded') {
        statusStr = 'Degraded - Tier 2';
      } else if (h.overallCondition === 'Critical') {
        statusStr = 'Critical - Tier 1';
      }
      
      return {
        name: label,
        condition: CHART_VALUE_MAP[statusStr] ?? 4,
        conditionLabel: statusStr,
      };
    });
  };

  interface TooltipPayloadEntry {
    payload: {
      name: string;
      conditionLabel: string;
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
        <div className="bg-[#111827] border border-[#1e2a3a] p-3 rounded shadow-lg text-[10px] text-[#a2b4cd] flex flex-col gap-1 select-none">
          <p className="font-semibold text-[#e2e8f0] mb-1">{data.name}</p>
          <p className="flex items-center gap-1.5 text-accent-blue">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />
            Overall Status: {data.conditionLabel}
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
    { key: 'class', header: 'Equipment Class' },
    { key: 'system', header: 'System' },
    { key: 'criticality', header: 'Criticality' },
    { key: 'objectType', header: 'Object Type' },
    { key: 'condition', header: 'Equip. CBM Condition', render: (val: string) => getStatusDot(val) },
    { key: 'lastUpdate', header: 'Last Update' },
    { key: 'observation', header: 'Observation' },
  ];

  // Definição de colunas para Tabela de Recomendações (Reports)
  const reportColumns = [
    {
      key: 'tagNumber',
      header: 'Tag Number',
      render: (val: string) => <span className="font-semibold text-text-primary">{val}</span>
    },
    { key: 'component', header: 'Component' },
    { key: 'shortDescription', header: 'Short Description' },
    { key: 'overallCondition', header: 'Overall Condition', render: (val: string) => getStatusDot(val) },
    { key: 'raisedDate', header: 'Raised Date' },
    { key: 'raisedBy', header: 'Raised By' },
    { key: 'woNumber', header: 'WO Number', render: (val: string) => val ? <span className="text-accent-blue font-semibold">{val}</span> : <span className="text-text-muted italic">None</span> },
  ];

  const formattedEquipments = equipments
    .filter(e => isWithinTimeRange(e.lastUpdate, equipCondTimeRange))
    .map(e => ({
      id: String(e.id),
      tag: e.tag,
      fpso: e.fpso,
      name: e.name,
      class: e.class,
      system: e.system,
      criticality: e.criticality,
      objectType: e.objectType,
      condition: e.condition ? e.condition.split(' - ')[0] : e.condition,
      lastUpdate: e.lastUpdate,
      observation: e.observation || '',
    }));

  const formattedReports = reports.map(r => ({
    id: String(r.id),
    tagNumber: r.tagNumber,
    component: r.component || '',
    shortDescription: r.shortDescription,
    overallCondition: r.overallCondition,
    raisedDate: r.raisedDate,
    raisedBy: r.raisedBy,
    woNumber: r.woNumber || '',
  }));

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
            {/* Cards Superiores Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute right-4 top-4 text-accent-blue/10">
                  <FileText size={72} />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Reports Register</span>
                <span className="text-2xl font-bold text-text-primary">{reports.length}</span>
                <span className="text-[9px] text-[#a2b4cd] mt-2">Total analysis outcomes stored from Excel workflows</span>
              </div>
              <div className="bg-bg-card border border-border-panel rounded-card p-5 flex flex-col gap-2 relative overflow-hidden">
                <div className="absolute right-4 top-4 text-status-error/10">
                  <AlertCircle size={72} />
                </div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">Active Warnings</span>
                <span className="text-2xl font-bold text-status-error">
                  {reports.filter(r => r.overallCondition?.includes('Critical') || r.overallCondition?.includes('Degraded')).length}
                </span>
                <span className="text-[9px] text-[#a2b4cd] mt-2">Critical and Degraded conditions requiring attention</span>
              </div>
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
            <div className="mb-2">
              {/* Linha 1: Título + Badge + Botão Fechar */}
              <div className="flex items-center gap-2 pr-8">
                <h2 className="text-base font-bold text-text-primary">
                  {selectedEquipment.tag} - {selectedEquipment.name.charAt(0).toUpperCase() + selectedEquipment.name.slice(1).toLowerCase()}
                </h2>
                <span className="text-[10px] bg-[#222944] text-[#94a3b8] px-2 py-0.5 rounded border border-[#333e68] font-semibold uppercase tracking-wider flex-shrink-0">
                  {selectedEquipment.system}
                </span>
              </div>

              {/* Linha 2: Overall CBM status */}
              <div className="flex items-center gap-2 text-xs text-text-muted mt-2 font-medium">
                <span>Overall CBM status:</span>
                <span className={`font-bold ${
                  selectedEquipment.condition?.startsWith('Good') ? 'text-status-ok' :
                  selectedEquipment.condition?.startsWith('Degraded') ? 'text-status-warn' :
                  selectedEquipment.condition?.startsWith('Critical') ? 'text-status-error' : 'text-text-muted'
                }`}>
                  {selectedEquipment.condition}
                </span>
              </div>

              {/* Linha 3: Botão Log new analysis alinhado à direita */}
              <div className="flex justify-end mt-1">
                <button
                  onClick={openReportForm}
                  className="border border-[#333e68] bg-[#121626] text-text-primary px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap hover:border-accent-blue transition-colors cursor-pointer"
                >
                  Log new analysis
                </button>
              </div>
            </div>

            {/* Override Condition and Observations Form & Chart */}
            <div className="flex flex-col gap-5 mt-4">
              {/* Override Condition and Observations Form */}
              <div className="flex flex-col gap-4 bg-[#101422]/60 p-4 border border-[#202742] rounded-xl text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">OVERALL CBM STATUS</label>
                  <select
                    value={modalFormFields.condition}
                    onChange={e => setModalFormFields({ ...modalFormFields, condition: e.target.value })}
                    className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none cursor-pointer text-xs w-full"
                  >
                    <option value="Good - Tier 4" className="bg-[#121626]">Good - Tier 4</option>
                    <option value="Good - Tier 3" className="bg-[#121626]">Good - Tier 3</option>
                    <option value="Degraded - Tier 2" className="bg-[#121626]">Degraded - Tier 2</option>
                    <option value="Critical - Tier 1" className="bg-[#121626]">Critical - Tier 1</option>
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">OBSERVATION</label>
                  <textarea
                    rows={3}
                    placeholder="Type..."
                    value={modalFormFields.observation}
                    onChange={e => setModalFormFields({ ...modalFormFields, observation: e.target.value })}
                    className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue focus:outline-none transition-colors text-xs resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleEquipmentUpdate}
                    disabled={savingEquipment}
                    className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow disabled:opacity-50"
                  >
                    {savingEquipment ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Grafico: Historical condition trend */}
              <div className="bg-[#101422]/40 border border-[#202742] p-4 rounded-xl">
                <h4 className="text-xs font-bold text-text-primary mb-3">Historical condition trend</h4>
                
                {mounted && history.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
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
                      <Line
                        name="Overall CBM Status"
                        type="monotone"
                        dataKey="condition"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#60a5fa', strokeWidth: 0 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[180px] flex items-center justify-center text-text-muted text-[10px]">
                    No history data available for this equipment.
                  </div>
                )}
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
            className="bg-bg-card border border-border-panel rounded-card w-full max-w-[760px] relative animate-fadeIn shadow-2xl text-left overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header da Modal SLB OptiSite Style */}
            <div className="p-5 border-b border-border-panel relative">
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 pr-8">
                <h2 className="text-base font-bold text-text-primary">
                  {selectedEquipment.tag} - {selectedEquipment.name.charAt(0).toUpperCase() + selectedEquipment.name.slice(1).toLowerCase()}
                </h2>
                <span className="text-[10px] bg-[#222944] text-[#94a3b8] px-2 py-0.5 rounded border border-[#333e68] font-semibold uppercase tracking-wider flex-shrink-0">
                  {selectedEquipment.system}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-text-muted mt-1.5 font-medium">
                <span>Overall CBM status:</span>
                <span className={`font-bold ${
                  selectedEquipment.condition?.startsWith('Good') ? 'text-status-ok' :
                  selectedEquipment.condition?.startsWith('Degraded') ? 'text-status-warn' :
                  selectedEquipment.condition?.startsWith('Critical') ? 'text-status-error' : 'text-text-muted'
                }`}>
                  {selectedEquipment.condition}
                </span>
              </div>
            </div>

            {/* Conteúdo do Form em 2 Blocos SLB */}
            <div className="p-5 flex-1 overflow-y-auto text-xs flex flex-col gap-4">
              
              {/* Bloco 1: Parâmetros da Análise & Metadados */}
              <div className="bg-[#101422]/60 p-4 border border-[#202742] rounded-xl flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Analysis Parameters & Metadata</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Analysis Type Dropdown */}
                  <div className="flex flex-col gap-1.5 md:col-span-1">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Analysis Type</label>
                    <select
                      value={analysisType}
                      onChange={(e) => {
                        const val = e.target.value as 'Vibration' | 'Lube Oil' | 'Thermography';
                        setAnalysisType(val);
                        setFormFields(prev => ({
                          ...prev,
                          technology: val === 'Thermography' ? 'Thermography Analysis' : val === 'Vibration' ? 'Vibration Analysis' : 'Lube Oil Analysis',
                        }));
                      }}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none cursor-pointer text-xs w-full"
                    >
                      <option value="Vibration">Vibration Analysis</option>
                      <option value="Lube Oil">Lube Oil Analysis</option>
                      <option value="Thermography">Thermography Analysis</option>
                    </select>
                  </div>

                  {/* Unified CBM Status Dropdown */}
                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">CBM Status</label>
                    <select
                      value={formFields.cbmStatus}
                      onChange={e => setFormFields({ ...formFields, cbmStatus: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none cursor-pointer text-xs w-full"
                    >
                      <option value="Good - Tier 4" className="bg-[#121626]">Good - Tier 4</option>
                      <option value="Good - Tier 3" className="bg-[#121626]">Good - Tier 3</option>
                      <option value="Degraded - Tier 2" className="bg-[#121626]">Degraded - Tier 2</option>
                      <option value="Critical - Tier 1" className="bg-[#121626]">Critical - Tier 1</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Component</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Compressor"
                      value={formFields.component}
                      onChange={e => setFormFields({ ...formFields, component: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Raised By</label>
                    <input
                      type="text"
                      required
                      value={formFields.raisedBy}
                      onChange={e => setFormFields({ ...formFields, raisedBy: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Raised Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.raisedDate}
                      onChange={e => setFormFields({ ...formFields, raisedDate: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors cursor-pointer text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Target Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.targetDate}
                      onChange={e => setFormFields({ ...formFields, targetDate: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors cursor-pointer text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Short Description</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Instrumentation Failure"
                      value={formFields.shortDescription}
                      onChange={e => setFormFields({ ...formFields, shortDescription: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Work Order Number (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 1089487"
                      value={formFields.woNumber}
                      onChange={e => setFormFields({ ...formFields, woNumber: e.target.value })}
                      className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue outline-none transition-colors text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Avaliação da Condição & Recomendações */}
              <div className="bg-[#101422]/60 p-4 border border-[#202742] rounded-xl flex flex-col gap-4">
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Condition Assessment & Recommendations</h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Condition Assessment (Observations)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Insert detailed observations regarding the equipment conditions..."
                    value={formFields.conditionAssessment}
                    onChange={e => setFormFields({ ...formFields, conditionAssessment: e.target.value })}
                    className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue focus:outline-none transition-colors text-xs resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Long Description (Recommendations)</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Insert recommended maintenance actions (e.g. Check connections, replace sensors, top up oil)..."
                    value={formFields.longDescription}
                    onChange={e => setFormFields({ ...formFields, longDescription: e.target.value })}
                    className="bg-[#121626] border border-[#2a3254] rounded-lg p-2.5 text-text-primary focus:border-accent-blue focus:outline-none transition-colors text-xs resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px] tracking-wider">Attach Supporting Image / Screenshot</label>
                  <input
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
                    className="bg-[#121626] border border-[#2a3254] rounded-lg p-2 text-text-primary text-xs file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#60a5fa] file:text-[#090d16] hover:file:bg-[#3b82f6] cursor-pointer"
                  />
                  {formFields.imageUrl && (
                    <div className="mt-2 relative w-32 h-20 border border-[#202742] rounded overflow-hidden">
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

            {/* Footer / Navigation Actions SLB Style */}
            <div className="p-4 border-t border-[#202742] bg-[#101422]/60 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="border border-[#333e68] text-text-primary px-4 py-1.5 rounded-full text-xs font-medium hover:border-accent-blue transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] font-semibold px-5 py-1.5 rounded-full text-xs transition-colors cursor-pointer shadow"
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
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.class || 'N/A'}
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
            </h2>
            <div className="h-[360px] flex items-center justify-center">
              {maximizedChart === 'wo-status' && <WorkOrderStatusPie workOrders={workOrders} />}
              {maximizedChart === 'days-due' && <DaysLeftBar workOrders={workOrders} />}
              {maximizedChart === 'equip-condition' && <EquipmentConditionPie equipments={equipments} />}
              {maximizedChart === 'cbm-criticality' && <CbmCriticalityBar equipments={equipments} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
