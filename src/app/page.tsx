'use client';
import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DashboardCard from '@/components/DashboardCard';
import CustomTable from '@/components/CustomTable';
import { ArrowLeft, X, RefreshCw } from 'lucide-react';
import {
  WorkOrderStatusPie,
  DaysLeftBar,
  EquipmentConditionPie,
  CbmCriticalityBar
} from '@/components/MetricCharts';

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

// Mock de dados para os Equipamentos (Equipments)
const equipmentMock = [
  { id: '1', tag: 'COCE_TIME_NRS_01', fpso: 'UNY', name: 'Compressor Performance', class: 'COCE - Compressor, Centrifugal', system: 'Gas', criticality: 'High', objectType: 'SECE', condition: 'Good', lastUpdate: '23/02/2026, 12:47:04', observation: 'The work order for the equipment has been flagged.' },
  { id: '2', tag: 'COCE_TIME_NRS_02', fpso: 'UNY', name: 'Compressor Performance', class: 'COCE - Compressor, Centrifugal', system: 'Gas', criticality: 'Medium', objectType: 'NCE', condition: 'Critical', lastUpdate: '23/02/2026, 12:47:04', observation: 'High vibration alarm triggered yesterday.' },
  { id: '3', tag: 'COCE_TIME_NRS_03', fpso: 'UNY', name: 'Compressor Performance', class: 'COCE - Compressor, Centrifugal', system: 'Gas', criticality: 'Low', objectType: 'SECE', condition: 'Degraded', lastUpdate: '23/02/2026, 12:47:04', observation: 'Lube oil level slightly below nominal.' },
  { id: '4', tag: 'COCE_TIME_NRS_04', fpso: 'UNY', name: 'Compressor Performance', class: 'COCE - Compressor, Centrifugal', system: 'Gas', criticality: 'Medium', objectType: 'NCE', condition: 'Pending', lastUpdate: '23/02/2026, 12:47:04', observation: 'Inspection scheduled for upcoming maintenance window.' },
  { id: '5', tag: 'COCE_TIME_NRS_05', fpso: 'UNY', name: 'Compressor Performance', class: 'COCE - Compressor, Centrifugal', system: 'Gas', criticality: 'Low', objectType: 'NCE', condition: 'Pending', lastUpdate: '23/02/2026, 12:47:04', observation: 'No issues reported.' },
  { id: '6', tag: 'TURB_METH_GDS_01', fpso: 'UNY', name: 'Turbine Performance', class: 'TURB - Turbine, Gas', system: 'Gas', criticality: 'High', objectType: 'SECE', condition: 'Good', lastUpdate: '24/02/2026, 10:20:15', observation: 'Operating under normal parameters.' },
  { id: '7', tag: 'TURB_METH_GDS_02', fpso: 'UNY', name: 'Turbine Performance', class: 'TURB - Turbine, Gas', system: 'Gas', criticality: 'Medium', objectType: 'SECE', condition: 'Degraded', lastUpdate: '24/02/2026, 11:35:40', observation: 'Increased exhaust temperature readings.' },
  { id: '8', tag: 'PUMP_COOL_AUX_01', fpso: 'UNY', name: 'Cooling Pump', class: 'PUMP - Centrifugal Pump', system: 'Water', criticality: 'Low', objectType: 'NCE', condition: 'Good', lastUpdate: '25/02/2026, 08:00:00', observation: 'Seal oil pressure stable.' },
];

export default function MainPage() {
  const [activeTab, setActiveTab] = useState<'equipment' | 'work-order'>('work-order');
  const [maximizedChart, setMaximizedChart] = useState<string | null>(null);

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
      case 'Pending':
      case 'Degraded':
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-status-warn" />
            <span className="text-[#a2b4cd]">{status}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 font-medium text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted" />
            <span className="text-[#a2b4cd]">{status}</span>
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
    { key: 'class', header: 'Equipment Class' },
    { key: 'system', header: 'System' },
    { key: 'criticality', header: 'Criticality' },
    { key: 'objectType', header: 'Object Type' },
    { key: 'condition', header: 'Equip. CBM Condition', render: (val: string) => getStatusDot(val) },
    { key: 'lastUpdate', header: 'Last Update' },
    { key: 'observation', header: 'Observation' },
  ];

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
            <h2 className="text-base font-semibold text-text-primary tracking-wide">Main Gas Compression</h2>
          </div>
          
          {/* Aba de navegação principal (Switch entre as duas visualizações) */}
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
          </div>
        </div>

        {/* Lógica SPA: Alternando as duas telas com animação */}
        {activeTab === 'work-order' ? (
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
        ) : (
          <div className="flex flex-col gap-6 animate-fadeIn">
            {/* Cards superiores com gráficos (Equipment) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DashboardCard
                title="Equipment by CBM Condition"
                filterText="Last Month"
                onMaximize={() => setMaximizedChart('equip-condition')}
              >
                <EquipmentConditionPie />
              </DashboardCard>
              
              <DashboardCard
                title="CBM Condition by Equipment Criticality"
                filterText="Last Week"
                onMaximize={() => setMaximizedChart('cbm-criticality')}
              >
                <CbmCriticalityBar />
              </DashboardCard>
            </div>

            {/* Seção inferior com tabela (Equipment) */}
            <div className="bg-bg-card border border-border-panel rounded-card p-4">
              <CustomTable title="Equipment List" columns={equipColumns} data={equipmentMock} />
            </div>
          </div>
        )}
      </main>

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
              {maximizedChart === 'equip-condition' && <EquipmentConditionPie />}
              {maximizedChart === 'cbm-criticality' && <CbmCriticalityBar />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
