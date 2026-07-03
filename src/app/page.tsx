'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import CustomTable from '@/components/CustomTable';
import { 
  ArrowLeft, 
  X, 
  RefreshCw, 
  Activity, 
  Droplet, 
  ChevronDown, 
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
  CbmCriticalityBar
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
  createdAt: string;
}

// Severity mappings for dynamic chart plotting
const CHART_VALUE_MAP: Record<string, number> = {
  'Good': 3,
  'Degraded': 2,
  'Critical': 1,
  'Machine Off': 0,
};

// Mock de dados para as Ordens de Serviço (Work Orders)
const workOrdersMock = [
  { id: '1', reference: '801021309', fpso: 'UNY', description: 'The work order for the equipment has been flagged for analysis.', priority: 'Accepted', tagNumber: '123456789', tagDescription: 'Compressor Performance', monitoringTechnique: 'CBM Vibration - Analysis High', creationDate: '23/02/2026, 12:47:04', dueDate: '23/02/2026, 12:47:04', status: 'Accepted' },
  { id: '2', reference: '801021310', fpso: 'UNY', description: 'Centrifugal compressor casing temperature exceeded limit.', priority: 'Rejected', tagNumber: '123456789', tagDescription: 'Compressor Performance', monitoringTechnique: 'CBM Temperature - Monitoring High', creationDate: '23/02/2026, 12:47:04', dueDate: '23/02/2026, 12:47:04', status: 'Rejected' },
  { id: '3', reference: '801021311', fpso: 'UNY', description: 'Pressure transmitter readings unstable on discharge header.', priority: 'Pending', tagNumber: '123456789', tagDescription: 'Compressor Performance', monitoringTechnique: 'CBM Pressure - Calibration', creationDate: '23/02/2026, 12:47:04', dueDate: '23/02/2026, 12:47:04', status: 'Pending' },
  { id: '4', reference: '801021312', fpso: 'UNY', description: 'Routine diagnostic inspection on mechanical seal oil.', priority: 'Accepted', tagNumber: '123456789', tagDescription: 'Compressor Performance', monitoringTechnique: 'CBM Vibration - Analysis High', creationDate: '23/02/2026, 12:47:04', dueDate: '23/02/2026, 12:47:04', status: 'Accepted' },
  { id: '5', reference: '801021313', fpso: 'UNY', description: 'Lube oil filter delta pressure alarm triggered.', priority: 'Pending', tagNumber: '123456789', tagDescription: 'Compressor Performance', monitoringTechnique: 'CBM Delta P - Filter Check', creationDate: '23/02/2026, 12:47:04', dueDate: '23/02/2026, 12:47:04', status: 'Pending' },
  { id: '6', reference: '801021314', fpso: 'UNY', description: 'Stator winding insulation check required.', priority: 'Accepted', tagNumber: '987654321', tagDescription: 'Turbine Performance', monitoringTechnique: 'CBM Electrical - Stator', creationDate: '24/02/2026, 10:20:15', dueDate: '25/02/2026, 10:20:15', status: 'Accepted' },
  { id: '7', reference: '801021315', fpso: 'UNY', description: 'Auxiliary cooling pump seal leakage audit.', priority: 'Rejected', tagNumber: '987654321', tagDescription: 'Turbine Performance', monitoringTechnique: 'CBM Seal - Visual Check', creationDate: '24/02/2026, 11:35:40', dueDate: '25/02/2026, 11:35:40', status: 'Rejected' },
  { id: '8', reference: '801021316', fpso: 'UNY', description: 'Emergency shutdown valve response time test.', priority: 'Accepted', tagNumber: '456789123', tagDescription: 'ESD System', monitoringTechnique: 'CBM Safety - Stroke Test', creationDate: '25/02/2026, 08:00:00', dueDate: '28/02/2026, 08:00:00', status: 'Accepted' },
];

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'work-order' | 'recommendations'>('work-order');
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // States for DB data
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loadingEquipments, setLoadingEquipments] = useState(true);

  // Reports state
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  // Modal states (Equipment Detail View)
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'trends' | 'history'>('trends');
  const [vibrationDropdownOpen, setVibrationDropdownOpen] = useState(false);
  const [lubeDropdownOpen, setLubeDropdownOpen] = useState(false);

  // Report Creation Form state
  const [reportFormOpen, setReportFormOpen] = useState(false);
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
  });

  // Report Detail Viewer state
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [reportDetailsOpen, setReportDetailsOpen] = useState(false);

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

  useEffect(() => {
    setMounted(true);
    fetchEquipments();
    fetchReports();
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
    setModalTab('trends');
    setVibrationDropdownOpen(false);
    setLubeDropdownOpen(false);
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
          equipmentTag: selectedEquipment.tag,
        }),
      });

      if (res.ok) {
        const newReport = await res.json();
        
        // Refresh local UI states
        await fetchEquipments();
        await fetchReports();
        
        // Update currently selected equipment view statuses
        const updatedEquip = equipments.find(eq => eq.tag === selectedEquipment.tag);
        if (updatedEquip) {
          // Temporarily predict updated condition for modal reactivity
          setSelectedEquipment({
            ...selectedEquipment,
            vibrationStatus: formFields.vibrationStatus,
            lubeOilStatus: formFields.lubeOilStatus,
            condition: newReport.overallCondition,
            lastUpdate: new Date().toLocaleString('en-GB'),
          });
        } else {
          // Re-fetch details
          fetchEquipments().then(() => {
            const eq = equipments.find(item => item.tag === selectedEquipment.tag);
            if (eq) setSelectedEquipment(eq);
          });
        }
        
        await fetchEquipmentHistory(selectedEquipment.tag);
        
        // Close form modal
        setReportFormOpen(false);
      } else {
        const err = await res.json();
        alert(`Erro ao salvar relatório: ${err.error}`);
      }
    } catch (err) {
      console.error('Error submitting report:', err);
    }
  };

  // Trigger PUT request to update statuses directly (fallback/simple updates)
  const handleStatusChange = async (type: 'vibration' | 'lube', newStatus: string) => {
    if (!selectedEquipment) return;

    const body = {
      vibrationStatus: type === 'vibration' ? newStatus : selectedEquipment.vibrationStatus,
      lubeOilStatus: type === 'lube' ? newStatus : selectedEquipment.lubeOilStatus,
    };

    try {
      const res = await fetch(`/api/equipments/${selectedEquipment.tag}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const updated = await res.json();
        
        // Update local state list
        setEquipments(prev => prev.map(e => e.tag === updated.tag ? updated : e));
        setSelectedEquipment(updated);
        
        // Refresh history
        await fetchEquipmentHistory(updated.tag);
        // Sync reports list in case any matches
        await fetchReports();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  // Formatação das bolinhas coloridas de status (Priority / Condition / Status)
  const getStatusDot = (status: string) => {
    switch (status) {
      case 'Accepted':
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-ok" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
      case 'Rejected':
      case 'Critical':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-warn" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
      case 'Machine Off':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
    }
  };

  // Status helper color classes for badges
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Good':
        return 'text-status-ok bg-status-ok/10 border-status-ok/20';
      case 'Degraded':
        return 'text-status-warn bg-status-warn/10 border-status-warn/20';
      case 'Critical':
        return 'text-status-error bg-status-error/10 border-status-error/20';
      case 'Machine Off':
      default:
        return 'text-text-muted bg-border-panel/40 border-border-panel/60';
    }
  };

  // Format history array chronologically for the trend chart
  const getChartData = () => {
    return [...history].reverse().map(h => {
      const date = new Date(h.changedAt);
      const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      return {
        name: label,
        vibration: CHART_VALUE_MAP[h.vibrationStatus] ?? 3,
        lube: CHART_VALUE_MAP[h.lubeOilStatus] ?? 3,
        vibrationLabel: h.vibrationStatus,
        lubeLabel: h.lubeOilStatus,
      };
    });
  };

  interface TooltipPayloadEntry {
    payload: {
      name: string;
      vibrationLabel: string;
      lubeLabel: string;
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
            Vibration: {data.vibrationLabel}
          </p>
          <p className="flex items-center gap-1.5 text-status-warn">
            <span className="w-1.5 h-1.5 rounded-full bg-status-warn" />
            Lube Oil: {data.lubeLabel}
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

  const formattedEquipments = equipments.map(e => ({
    id: String(e.id),
    tag: e.tag,
    fpso: e.fpso,
    name: e.name,
    class: e.class,
    system: e.system,
    criticality: e.criticality,
    objectType: e.objectType,
    condition: e.condition,
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
                filterText="Last Month"
                onMaximize={() => setMaximizedChart('wo-status')}
              >
                <WorkOrderStatusPie />
              </DashboardCard>
              
              <DashboardCard
                title="Days Left to Due"
                filterText="Last Week"
                onMaximize={() => setMaximizedChart('days-due')}
              >
                <DaysLeftBar />
              </DashboardCard>
            </div>

            {/* Seção inferior com tabela (Work Orders) */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <CustomTable title="Work Order List" columns={woColumns} data={workOrdersMock} />
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Cards superiores com gráficos (Equipment) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Equipment by CBM Condition"
                filterText="Last Month"
                onMaximize={() => setMaximizedChart('equip-condition')}
              >
                <EquipmentConditionPie equipments={equipments} />
              </DashboardCard>
              
              <DashboardCard
                title="CBM Condition by Equipment Criticality"
                filterText="Last Week"
                onMaximize={() => setMaximizedChart('cbm-criticality')}
              >
                <CbmCriticalityBar equipments={equipments} />
              </DashboardCard>
            </div>

            {/* Seção inferior com tabela (Equipment) */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              {loadingEquipments ? (
                <div className="py-8 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-accent-blue" size={14} />
                  Carregando equipamentos do banco...
                </div>
              ) : (
                <CustomTable 
                  title="Equipment List" 
                  columns={equipColumns} 
                  data={formattedEquipments} 
                  onRowClick={handleRowClick}
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
                  {reports.filter(r => r.overallCondition === 'Critical' || r.overallCondition === 'Degraded').length}
                </span>
                <span className="text-[9px] text-[#a2b4cd] mt-2">Critical and Degraded conditions requiring attention</span>
              </div>
            </div>

            {/* Tabela do Registro de Recomendações */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              {loadingReports ? (
                <div className="py-8 text-center text-text-muted text-xs font-medium flex items-center justify-center gap-2">
                  <RefreshCw className="animate-spin text-accent-blue" size={14} />
                  Carregando relatórios de recomendação...
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
              title="Fechar"
            >
              <X size={18} />
            </button>

            {/* Header da Modal */}
            <div className="mb-2">
              <span className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded border border-accent-blue/20 font-semibold uppercase tracking-wider">
                {selectedEquipment.system}
              </span>
              <h2 className="text-base font-bold text-text-primary mt-2">
                {selectedEquipment.tag} - {selectedEquipment.name}
              </h2>
              <div className="flex items-center justify-between gap-2 text-[10px] text-text-muted mt-1.5 font-medium tracking-wide uppercase">
                <div className="flex items-center gap-1.5">
                  <span>Vibration + Lube Oil</span>
                  <span>/</span>
                  <span>Overall Worst Condition:</span>
                  <span className={`font-bold ${
                    selectedEquipment.condition === 'Good' ? 'text-status-ok' :
                    selectedEquipment.condition === 'Degraded' ? 'text-status-warn' :
                    selectedEquipment.condition === 'Critical' ? 'text-status-error' : 'text-text-muted'
                  }`}>
                    {selectedEquipment.condition}
                  </span>
                </div>

                {/* Ação de Registro de Relatório */}
                <button
                  onClick={openReportForm}
                  className="flex items-center gap-1.5 bg-accent-blue text-[#090d16] font-bold px-3 py-1.5 rounded text-[9px] hover:bg-[#38bdf8] transition-colors cursor-pointer uppercase shadow"
                >
                  <PlusCircle size={11} />
                  Log New Analysis
                </button>
              </div>
            </div>

            {/* Abas da Modal */}
            <div className="flex border-b border-border-panel/40 mt-4 mb-4 gap-6 select-none">
              <button
                onClick={() => setModalTab('trends')}
                className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                  modalTab === 'trends' ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Overview & Trends
                {modalTab === 'trends' && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-blue" />
                )}
              </button>
              <button
                onClick={() => setModalTab('history')}
                className={`pb-2 text-xs font-semibold uppercase tracking-wider relative transition-colors cursor-pointer ${
                  modalTab === 'history' ? 'text-accent-blue' : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Report History
                {modalTab === 'history' && (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-accent-blue" />
                )}
              </button>
            </div>

            {/* Conteúdo da Modal de acordo com a aba ativa */}
            {modalTab === 'trends' ? (
              <div className="flex flex-col gap-5">
                {/* Cards Interativos */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Card Vibration Status */}
                  <div className="relative">
                    <div
                      onClick={() => {
                        setVibrationDropdownOpen(!vibrationDropdownOpen);
                        setLubeDropdownOpen(false);
                      }}
                      className="flex items-center justify-between p-3.5 bg-bg-panel/40 border border-border-panel rounded-lg hover:border-accent-blue/40 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-blue/10 text-accent-blue rounded-lg border border-accent-blue/20">
                          <Activity size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-medium">Vibration Status</span>
                          <span className={`text-xs font-bold ${
                            selectedEquipment.vibrationStatus === 'Good' ? 'text-status-ok' :
                            selectedEquipment.vibrationStatus === 'Degraded' ? 'text-status-warn' :
                            selectedEquipment.vibrationStatus === 'Critical' ? 'text-status-error' : 'text-text-muted'
                          }`}>
                            {selectedEquipment.vibrationStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={14} className="text-text-muted" />
                    </div>

                    {/* Dropdown Vibration */}
                    {vibrationDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111827] border border-[#1e2a3a] rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-fadeIn">
                        {['Good', 'Degraded', 'Critical', 'Machine Off'].map(status => (
                          <button
                            key={status}
                            onClick={() => {
                              handleStatusChange('vibration', status);
                              setVibrationDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[11px] text-[#a2b4cd] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              status === 'Good' ? 'bg-status-ok' :
                              status === 'Degraded' ? 'bg-status-warn' :
                              status === 'Critical' ? 'bg-status-error' : 'bg-gray-500'
                            }`} />
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Lube Oil Status */}
                  <div className="relative">
                    <div
                      onClick={() => {
                        setLubeDropdownOpen(!lubeDropdownOpen);
                        setVibrationDropdownOpen(false);
                      }}
                      className="flex items-center justify-between p-3.5 bg-bg-panel/40 border border-border-panel rounded-lg hover:border-status-warn/40 transition-all cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-status-warn/10 text-status-warn rounded-lg border border-status-warn/20">
                          <Droplet size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-text-muted font-medium">Lube Oil Status</span>
                          <span className={`text-xs font-bold ${
                            selectedEquipment.lubeOilStatus === 'Good' ? 'text-status-ok' :
                            selectedEquipment.lubeOilStatus === 'Degraded' ? 'text-status-warn' :
                            selectedEquipment.lubeOilStatus === 'Critical' ? 'text-status-error' : 'text-text-muted'
                          }`}>
                            {selectedEquipment.lubeOilStatus.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <ChevronDown size={14} className="text-text-muted" />
                    </div>

                    {/* Dropdown Lube Oil */}
                    {lubeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#111827] border border-[#1e2a3a] rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-fadeIn">
                        {['Good', 'Degraded', 'Critical', 'Machine Off'].map(status => (
                          <button
                            key={status}
                            onClick={() => {
                              handleStatusChange('lube', status);
                              setLubeDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[11px] text-[#a2b4cd] hover:bg-[#1e2a3a] hover:text-[#e2e8f0] transition-colors flex items-center gap-2 cursor-pointer font-medium"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              status === 'Good' ? 'bg-status-ok' :
                              status === 'Degraded' ? 'bg-status-warn' :
                              status === 'Critical' ? 'bg-status-error' : 'bg-gray-500'
                            }`} />
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Grafico: Historical Condition Trend */}
                <div className="bg-bg-panel/20 border border-border-panel p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-text-primary mb-3">Historical Condition Trend</h4>
                  
                  {mounted && history.length > 0 ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={getChartData()} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-panel)" vertical={false} opacity={0.3} />
                        <XAxis
                          dataKey="name"
                          stroke="var(--text-muted)"
                          fontSize={8}
                          tickLine={false}
                          axisLine={{ stroke: 'var(--border-panel)', strokeWidth: 1 }}
                        />
                        <YAxis
                          stroke="var(--text-muted)"
                          fontSize={8}
                          axisLine={false}
                          tickLine={false}
                          domain={[0, 3]}
                          ticks={[0, 1, 2, 3]}
                          tickFormatter={(val) => {
                            switch (val) {
                              case 3: return 'GOOD';
                              case 2: return 'DEGRADED';
                              case 1: return 'CRITICAL';
                              case 0: return 'OFF';
                              default: return '';
                            }
                          }}
                        />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line
                          name="Vibration Analysis"
                          type="monotone"
                          dataKey="vibration"
                          stroke="#38bdf8"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#38bdf8', strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                        <Line
                          name="Lube Oil Analysis"
                          type="monotone"
                          dataKey="lube"
                          stroke="#fbbf24"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3, fill: '#fbbf24', strokeWidth: 0 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-text-muted text-[10px]">
                      Nenhum dado de histórico disponível para este equipamento.
                    </div>
                  )}

                  {/* Legenda Customizada */}
                  <div className="flex items-center justify-center gap-6 mt-2 text-[9px] text-text-muted select-none">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-[2px] bg-accent-blue" />
                      Vibration Analysis
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-[2px] bg-status-warn border-t border-dashed border-status-warn" style={{ borderStyle: 'dashed' }} />
                      Lube Oil Analysis
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              /* Tabela de histórico */
              <div className="max-h-[260px] overflow-y-auto border border-border-panel rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border-panel bg-bg-panel/40 text-[9px] font-bold text-text-primary uppercase tracking-wider select-none">
                      <th className="px-4 py-2.5">Date & Time</th>
                      <th className="px-4 py-2.5">Vibration</th>
                      <th className="px-4 py-2.5">Lube Oil</th>
                      <th className="px-4 py-2.5">Overall Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length > 0 ? (
                      history.map((h, idx) => (
                        <tr key={h.id || idx} className="border-b border-border-panel hover:bg-bg-panel/10 last:border-b-0 text-[10px]">
                          <td className="px-4 py-2 text-text-muted whitespace-nowrap">
                            {new Date(h.changedAt).toLocaleString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-medium ${getStatusColorClass(h.vibrationStatus)}`}>
                              {h.vibrationStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-medium ${getStatusColorClass(h.lubeOilStatus)}`}>
                              {h.lubeOilStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-0.5 rounded-full border text-[9px] font-medium ${getStatusColorClass(h.overallCondition)}`}>
                              {h.overallCondition}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-8 text-center text-text-muted text-[11px]">
                          Nenhum registro de histórico encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
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
            {/* Header */}
            <div className="p-5 border-b border-border-panel flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary">Log Analysis Outcome & CBM Report</h3>
                <p className="text-[10px] text-text-muted mt-0.5">Recording operational status and recommendations for {selectedEquipment.tag}</p>
              </div>
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="text-text-muted hover:text-text-primary transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo do Form (Two-Column Layout) */}
            <div className="p-5 flex-1 overflow-y-auto text-[11px] grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Coluna Esquerda: Inputs de Metadados e Status */}
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px]">Vibration Status</label>
                    <select
                      value={formFields.vibrationStatus}
                      onChange={e => setFormFields({ ...formFields, vibrationStatus: e.target.value })}
                      className="bg-[#111827] border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none cursor-pointer"
                    >
                      <option value="Good">Good</option>
                      <option value="Degraded">Degraded</option>
                      <option value="Critical">Critical</option>
                      <option value="Machine Off">Machine Off</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px]">Lube Oil Status</label>
                    <select
                      value={formFields.lubeOilStatus}
                      onChange={e => setFormFields({ ...formFields, lubeOilStatus: e.target.value })}
                      className="bg-[#111827] border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none cursor-pointer"
                    >
                      <option value="Good">Good</option>
                      <option value="Degraded">Degraded</option>
                      <option value="Critical">Critical</option>
                      <option value="Machine Off">Machine Off</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Component</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Compressor"
                    value={formFields.component}
                    onChange={e => setFormFields({ ...formFields, component: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Raised By</label>
                  <input
                    type="text"
                    required
                    value={formFields.raisedBy}
                    onChange={e => setFormFields({ ...formFields, raisedBy: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px]">Raised Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.raisedDate}
                      onChange={e => setFormFields({ ...formFields, raisedDate: e.target.value })}
                      className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none cursor-pointer"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-text-muted font-semibold uppercase text-[9px]">Target Date</label>
                    <input
                      type="date"
                      required
                      value={formFields.targetDate}
                      onChange={e => setFormFields({ ...formFields, targetDate: e.target.value })}
                      className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Short Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Instrumentation Failure"
                    value={formFields.shortDescription}
                    onChange={e => setFormFields({ ...formFields, shortDescription: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Work Order Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1089487"
                    value={formFields.woNumber}
                    onChange={e => setFormFields({ ...formFields, woNumber: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2 text-text-primary focus:border-accent-blue outline-none"
                  />
                </div>
              </div>

              {/* Coluna Direita: Observações e Recomendações */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5 flex-1 min-h-[160px]">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Condition Assessment (Observations)</label>
                  <textarea
                    required
                    placeholder="Insert detailed observations regarding the equipment conditions..."
                    value={formFields.conditionAssessment}
                    onChange={e => setFormFields({ ...formFields, conditionAssessment: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2.5 text-text-primary focus:border-accent-blue outline-none flex-1 resize-none h-full"
                  />
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-h-[160px]">
                  <label className="text-text-muted font-semibold uppercase text-[9px]">Long Description (Recommendations)</label>
                  <textarea
                    required
                    placeholder="Insert recommended maintenance actions (e.g. Check connections, replace sensors, top up oil)..."
                    value={formFields.longDescription}
                    onChange={e => setFormFields({ ...formFields, longDescription: e.target.value })}
                    className="bg-bg-panel/40 border border-border-panel rounded p-2.5 text-text-primary focus:border-accent-blue outline-none flex-1 resize-none h-full"
                  />
                </div>
              </div>

            </div>

            {/* Footer / Navigation Actions */}
            <div className="p-4 border-t border-border-panel bg-bg-panel/10 flex items-center justify-end gap-3 select-none">
              <button
                type="button"
                onClick={() => setReportFormOpen(false)}
                className="px-4 py-2 border border-border-panel rounded font-bold hover:bg-bg-panel/40 transition-colors text-text-muted hover:text-text-primary cursor-pointer text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-status-ok text-[#090d16] font-bold rounded hover:bg-[#4ade80] transition-colors cursor-pointer text-xs"
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
          <div className="bg-[#0b0f19] border-l border-border-panel w-full max-w-[680px] h-full flex flex-col animate-slideLeft shadow-2xl relative">
            
            {/* Top Bar Details close */}
            <div className="p-4 border-b border-border-panel bg-bg-card flex items-center justify-between select-none">
              <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                <FileText size={14} className="text-accent-blue" />
                CBM Analysis Report Details
              </span>
              <button
                onClick={() => setReportDetailsOpen(false)}
                className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-panel/40 rounded transition-all cursor-pointer"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            {/* Excel Sheet Simulator container */}
            <div className="flex-1 overflow-y-auto p-6 bg-[#0f172a] text-[#f1f5f9] select-text">
              
              {/* simulated Excel Border wrapper */}
              <div className="border border-[#334155] rounded-lg overflow-hidden bg-[#020617] shadow-lg max-w-[620px] mx-auto">
                
                {/* Excel Row 1: Solid severity header banner */}
                <div className={`p-4 text-center font-bold text-sm tracking-widest uppercase border-b border-[#334155] ${
                  selectedReport.overallCondition === 'Good' ? 'bg-status-ok text-[#020617]' :
                  selectedReport.overallCondition === 'Degraded' ? 'bg-status-warn text-[#020617]' :
                  selectedReport.overallCondition === 'Critical' ? 'bg-status-error text-white' : 'bg-slate-700 text-[#020617]'
                }`}>
                  {selectedReport.overallCondition}
                </div>

                {/* Row 1: FPSO & System */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">FPSO</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.fpso || selectedReport.facility}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">System</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.system || selectedReport.system}
                    </span>
                  </div>
                </div>

                {/* Row 2: Equipment Tag & Name */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Equipment Tag</span>
                    <span className="p-2 text-[#fbbf24] flex-1 flex items-center">
                      {selectedReport.equipmentTag}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Name</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.name || selectedReport.component}
                    </span>
                  </div>
                </div>

                {/* Row 3: Equipment Class & Criticality */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Equipment Class</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.class || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Criticality</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.criticality || selectedReport.cof || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Row 4: Object Type & Last Update */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Object Type</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.objectType || 'N/A'}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[110px] flex-shrink-0 border-r border-[#334155] flex items-center">Last Update</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">
                      {equipments.find(e => e.tag === selectedReport.equipmentTag)?.lastUpdate || selectedReport.raisedDate}
                    </span>
                  </div>
                </div>

                {/* Simulated Diagram Row */}
                <div className="bg-[#0f172a] p-3 text-center border-b border-[#334155] select-none">
                  <div className="border border-[#1e293b] rounded-lg p-6 bg-[#020617]/50 relative overflow-hidden flex flex-col items-center justify-center min-h-[140px] text-text-muted gap-2">
                    <Wrench size={32} className="text-[#38bdf8]/30" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#a2b4cd]/60">Physical Equipment Diagram Simulation</span>
                    <span className="text-[8px] text-text-muted italic">{selectedReport.tagNumber} layout mapped on optsite layout</span>
                  </div>
                </div>

                {/* Condition Assessment / Observations */}
                <div className="border-b border-[#334155] text-[10px]">
                  <div className="bg-[#1e293b] text-text-muted p-2.5 font-bold uppercase tracking-wider border-b border-[#334155]">
                    Condition Assessment (Observations)
                  </div>
                  <div className="p-3 text-text-primary leading-relaxed text-[10.5px]">
                    {selectedReport.conditionAssessment}
                  </div>
                </div>

                {/* Supporting Images */}
                <div className="border-b border-[#334155] text-[10px] bg-[#020617] p-3">
                  <span className="text-text-muted font-bold uppercase tracking-wider block mb-2 text-center text-[9px]">Supporting Images</span>
                  <div className="border border-[#1e293b] rounded p-10 bg-[#0f172a]/30 flex flex-col items-center justify-center text-text-muted italic text-[9px] gap-1">
                    <Calendar size={20} className="opacity-30" />
                    <span>No analytical screenshots uploaded for this log outcome</span>
                  </div>
                </div>

                {/* Technical Metadata info section */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">Component</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">{selectedReport.component || 'N/A'}</span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">Raised By</span>
                    <span className="p-2 text-[#38bdf8] flex-1 flex items-center flex-row gap-1">
                      <User size={10} />
                      {selectedReport.raisedBy}
                    </span>
                  </div>
                </div>

                {/* Date metadata */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">Raised Date</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center flex-row gap-1">
                      <Calendar size={10} />
                      {selectedReport.raisedDate}
                    </span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">Target Date</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center flex-row gap-1">
                      <Calendar size={10} />
                      {selectedReport.targetDate || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Description info */}
                <div className="grid grid-cols-2 text-[10px] border-b border-[#334155] uppercase font-semibold">
                  <div className="border-r border-[#334155] flex">
                    <span className="bg-[#1e293b] text-text-muted p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">Description</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center">{selectedReport.shortDescription}</span>
                  </div>
                  <div className="flex">
                    <span className="bg-[#1e293b] text-[#f87171] p-2 w-[100px] flex-shrink-0 border-r border-[#334155] flex items-center">WO Number</span>
                    <span className="p-2 text-text-primary flex-1 flex items-center flex-row gap-1 font-bold">
                      <Hash size={10} />
                      {selectedReport.woNumber || 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* Recommendations (Long Description) */}
                <div className="text-[10px]">
                  <div className="bg-[#1e293b] text-text-muted p-2.5 font-bold uppercase tracking-wider border-b border-[#334155] flex items-center gap-1.5">
                    <Wrench size={12} className="text-accent-blue" />
                    Long Description (Recommendations)
                  </div>
                  <div className="p-3 text-text-primary leading-relaxed text-[10.5px] whitespace-pre-line bg-[#090d16]/30">
                    {selectedReport.longDescription}
                  </div>
                </div>
              </div>

            </div>
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
              title="Fechar"
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
              {maximizedChart === 'wo-status' && <WorkOrderStatusPie />}
              {maximizedChart === 'days-due' && <DaysLeftBar />}
              {maximizedChart === 'equip-condition' && <EquipmentConditionPie equipments={equipments} />}
              {maximizedChart === 'cbm-criticality' && <CbmCriticalityBar equipments={equipments} />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
