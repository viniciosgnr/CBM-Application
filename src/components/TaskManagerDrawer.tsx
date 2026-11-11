'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Bell,
  CheckSquare,
  MessageSquare,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Pencil,
  Paperclip,
  Tag,
  Clock,
  UploadCloud,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronLeft,
  ChevronsRight,
  FileText,
  Info,
  SendHorizontal,
  Bold,
  Italic,
  Underline,
  Baseline,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
} from 'lucide-react';

export interface TaskDrawerReport {
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
  location?: string | null;
  technology?: string | null;
  component?: string | null;
  raisedBy: string;
  raisedDate: string;
  targetDate?: string | null;
  shortDescription: string;
  woNumber?: string | null;
  conditionAssessment: string;
  longDescription: string;
  equipmentClass?: string | null;
  taskId?: number | null;
  taskNumber?: string | null;
}

export interface TaskDrawerItem {
  id: number;
  taskReference: string;
  reportId?: number | null;
  equipmentTag: string;
  type: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: string;
  dueDate: string;
  associatedEvent?: string | null;
  associatedEntity?: string | null;
  faultReportOption: string;
  workOrderId?: number | null;
  workOrderReference?: string | null;
  attachedFilename?: string | null;
  attachedFileSize?: number | null;
  sparePartNumber?: string | null;
  purchaseOrderRef?: string | null;
  quantity?: string | null;
  unitOfQuantity?: string | null;
  status: string;
  historyJson?: string | null;
  commentsJson?: string | null;
  createdAt: string;
}

export interface TaskDrawerEquipment {
  id: number;
  tag: string;
  fpso: string;
  name: string;
  class: string;
}

export interface TaskDrawerWorkOrder {
  id: number;
  reference: string;
  tagNumber: string;
  directive?: string | null;
  description: string;
}

interface TaskManagerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialView: 'list' | 'new' | 'detail';
  initialSubTab?: 'my' | 'all';
  selectedReportForNew?: TaskDrawerReport | null;
  selectedTaskForDetail?: TaskDrawerItem | null;
  tasks: TaskDrawerItem[];
  reports: TaskDrawerReport[];
  equipments: TaskDrawerEquipment[];
  workOrders: TaskDrawerWorkOrder[];
  onRefreshAll: () => Promise<void>;
  onNavigateToWorkOrder: (woRef: string) => void;
}

const CURRENT_LOGGED_USER = 'Current User (UR)';

export default function TaskManagerDrawer({
  isOpen,
  onClose,
  initialView,
  initialSubTab = 'all',
  selectedReportForNew,
  selectedTaskForDetail,
  tasks,
  reports,
  equipments,
  workOrders,
  onRefreshAll,
  onNavigateToWorkOrder,
}: TaskManagerDrawerProps) {
  const [view, setView] = useState<'list' | 'new' | 'detail'>(initialView);
  const [subTab, setSubTab] = useState<'my' | 'all'>(initialSubTab);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCurrentContext, setShowCurrentContext] = useState(false);
  const [compactStatusMenuTaskId, setCompactStatusMenuTaskId] = useState<number | null>(null);
  const [activeTaskId, setActiveTaskId] = useState<number | null>(
    selectedTaskForDetail?.id ?? null
  );

  // Sync view when drawer opens or props change
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
      if (initialView === 'list') {
        setIsExpanded(false);
      } else if (initialView === 'detail' && selectedTaskForDetail) {
        setActiveTaskId(selectedTaskForDetail.id);
        setDetailRightTab(null);
      }
    }
  }, [isOpen, initialView, selectedTaskForDetail]);

  // Table Filters & Pagination for 'list' view
  const [colFilters, setColFilters] = useState<Record<string, string>>({
    title: '',
    type: '',
    assignedTo: '',
    dueDate: '',
    associatedEntity: '',
    associatedEvent: '',
    status: '',
  });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // New Task Form State
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const [taskFormFields, setTaskFormFields] = useState({
    type: '',
    title: '',
    description: '',
    assignedTo: '',
    priority: 'High',
    dueDate: '',
    associatedEvent: '',
    associatedEntity: '',
    faultReportOption: 'none' as 'none' | 'create' | 'link',
    linkedWorkOrderReference: '',
    // Fault Report fields
    entryDate: '',
    woSite: '',
    reportedBy: '',
    itemClassId: '',
    equipmentTag: '',
    operationalStatus: '01',
    actionTakenOnField: false,
    performedWork: '',
    incidentManagement: 'None',
    directive: '',
    faultDesc: '',
    maintOrg: 'MECHTS',
    symptom: 'VIB',
    discovery: '04',
    workType: 'CM',
    actionId: '6',
    externalSource: 'CBM-VIB/M',
    externalSourceId: '',
    attachedFilename: '',
    attachedFileSize: 0,
    sparePartNumber: '',
    purchaseOrderRef: '',
    quantity: '',
    unitOfQuantity: '',
  });

  const [taskFormErrors, setTaskFormErrors] = useState({
    title: '',
    description: '',
    assignedTo: '',
    directive: '',
  });
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Initialize New Task form whenever selectedReportForNew changes
  useEffect(() => {
    if (!selectedReportForNew) return;
    const report = selectedReportForNew;
    const tech = (report.technology || '').toLowerCase();
    const isLube = tech.includes('lube') || tech.includes('oil') || tech.includes('lubric');
    const techStatus =
      (isLube
        ? report.lubeOilStatus || report.overallCondition
        : report.vibrationStatus || report.overallCondition) || '';
    const statusNorm = techStatus.toLowerCase();

    let defaultPriority = 'High';
    if (statusNorm.includes('critical') || statusNorm.includes('tier 1')) {
      defaultPriority = 'High';
    } else if (statusNorm.includes('degraded') || statusNorm.includes('tier 2')) {
      defaultPriority = 'Medium';
    } else if (statusNorm.includes('tier 3')) {
      defaultPriority = 'Low';
    } else {
      defaultPriority = 'Very Low';
    }

    let critChar: 'H' | 'M' | 'L' = 'M';
    if (statusNorm.includes('critical') || statusNorm.includes('tier 1')) {
      critChar = 'H';
    } else if (statusNorm.includes('degraded') || statusNorm.includes('tier 2')) {
      critChar = 'M';
    } else {
      critChar = 'L';
    }

    const extSrc = isLube ? `CBM-LUB/${critChar}` : `CBM-VIB/${critChar}`;

    let dueDateFormatted = '';
    if (report.targetDate && /^\d{4}-\d{2}-\d{2}/.test(report.targetDate)) {
      dueDateFormatted = report.targetDate.slice(0, 10);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      dueDateFormatted = d.toISOString().split('T')[0];
    }

    const now = new Date();
    const entryDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const equipment = equipments.find((e) => e.tag === report.equipmentTag);
    const fpso = equipment?.fpso?.replace(/^FPSO\s+/i, '') || 'UNY';
    const cleanClass = (report.equipmentClass || equipment?.class || 'PUCE').replace(
      /^equipmentClass_/i,
      ''
    );
    const initialDirective = (report.shortDescription || 'INSPECT EQUIPMENT')
      .toUpperCase()
      .slice(0, 60);
    const anomalyDesc = `Anomaly: ${report.conditionAssessment || ''}\n\nRecommendation: ${
      report.longDescription || ''
    }`;

    setTaskFormFields({
      type: '',
      title: report.shortDescription || 'CBM Corrective Action',
      description: anomalyDesc,
      assignedTo: 'João Gabriel Barros do Valle Ramos',
      priority: defaultPriority,
      dueDate: dueDateFormatted,
      associatedEvent: report.cmmsNumber || `CDI26-MA${report.id}`,
      associatedEntity: report.equipmentTag,
      faultReportOption: 'none',
      linkedWorkOrderReference: '',
      entryDate: entryDateStr,
      woSite: fpso,
      reportedBy: report.raisedBy || 'Fernanda Lima',
      itemClassId: cleanClass,
      equipmentTag: report.equipmentTag,
      operationalStatus: '01',
      actionTakenOnField: false,
      performedWork: '',
      incidentManagement: 'None',
      directive: initialDirective,
      faultDesc: anomalyDesc,
      maintOrg: 'MECHTS',
      symptom: isLube ? 'ELU' : 'VIB',
      discovery: '04',
      workType: 'CM',
      actionId: isLube ? '7' : '6',
      externalSource: extSrc,
      externalSourceId: `CDI26-MA${report.id}`,
      attachedFilename: '',
      attachedFileSize: 0,
      sparePartNumber: '',
      purchaseOrderRef: '',
      quantity: '',
      unitOfQuantity: '',
    });
    setTypeDropdownOpen(false);
    setTaskFormErrors({ title: '', description: '', assignedTo: '', directive: '' });
  }, [selectedReportForNew, equipments, isOpen]);

  // Active Task in 'detail' view
  const activeTask = useMemo(() => {
    if (!activeTaskId) return selectedTaskForDetail || null;
    return tasks.find((t) => t.id === activeTaskId) || selectedTaskForDetail || null;
  }, [tasks, activeTaskId, selectedTaskForDetail]);

  // Detail View State (Status dropdown & Right-side pane: History | Comments | Fault Report)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const [detailRightTab, setDetailRightTab] = useState<'history' | 'comments' | 'fault-report' | null>(null);
  const [detailFrOption, setDetailFrOption] = useState<'none' | 'create' | 'link'>('none');
  const [detailLinkedWoRef, setDetailLinkedWoRef] = useState('');
  const [isSendingToIfs, setIsSendingToIfs] = useState(false);
  const [detailFrSuccessMsg, setDetailFrSuccessMsg] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState<string | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const [detailFrFields, setDetailFrFields] = useState({
    entryDate: '',
    woSite: 'UNY',
    reportedBy: '',
    itemClassId: 'PUCE',
    equipmentTag: '',
    operationalStatus: '01',
    actionTakenOnField: false,
    performedWork: '',
    incidentManagement: 'None',
    directive: '',
    faultDesc: '',
    maintOrg: 'MECHTS',
    symptom: 'VIB',
    discovery: '04',
    workType: 'CM',
    actionId: '6',
    externalSource: 'CBM-VIB/M',
    externalSourceId: '',
  });
  const [detailFrDirectiveError, setDetailFrDirectiveError] = useState('');

  // Sync Detail Fault Report fields when activeTask changes
  useEffect(() => {
    if (!activeTask) return;
    const linkedReport = reports.find((r) => r.id === activeTask.reportId);
    const equipment = equipments.find((e) => e.tag === activeTask.equipmentTag);
    const fpso = equipment?.fpso?.replace(/^FPSO\s+/i, '') || 'UNY';
    const cleanClass = (linkedReport?.equipmentClass || equipment?.class || 'PUCE').replace(
      /^equipmentClass_/i,
      ''
    );

    const tech = (linkedReport?.technology || '').toLowerCase();
    const isLube = tech.includes('lube') || tech.includes('oil') || tech.includes('lubric');
    const techStatus =
      (isLube
        ? linkedReport?.lubeOilStatus || linkedReport?.overallCondition
        : linkedReport?.vibrationStatus || linkedReport?.overallCondition) || '';
    const statusNorm = techStatus.toLowerCase();
    let critChar: 'H' | 'M' | 'L' = 'M';
    if (statusNorm.includes('critical') || statusNorm.includes('tier 1')) {
      critChar = 'H';
    } else if (statusNorm.includes('degraded') || statusNorm.includes('tier 2')) {
      critChar = 'M';
    } else {
      critChar = 'L';
    }
    const extSrc = isLube ? `CBM-LUB/${critChar}` : `CBM-VIB/${critChar}`;

    const now = new Date();
    const entryDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setDetailFrOption(
      (activeTask.faultReportOption as 'none' | 'create' | 'link') || 'none'
    );
    setDetailLinkedWoRef(activeTask.workOrderReference || '');
    setDetailFrDirectiveError('');
    setDetailFrSuccessMsg(null);
    setDetailFrFields({
      entryDate: entryDateStr,
      woSite: fpso,
      reportedBy: linkedReport?.raisedBy || activeTask.assignedTo || 'Fernanda Lima',
      itemClassId: cleanClass,
      equipmentTag: activeTask.equipmentTag,
      operationalStatus: '01',
      actionTakenOnField: false,
      performedWork: '',
      incidentManagement: 'None',
      directive: (activeTask.title || 'INSPECT EQUIPMENT').toUpperCase().slice(0, 60),
      faultDesc: activeTask.description || '',
      maintOrg: 'MECHTS',
      symptom: isLube ? 'ELU' : 'VIB',
      discovery: '04',
      workType: 'CM',
      actionId: isLube ? '7' : '6',
      externalSource: extSrc,
      externalSourceId: activeTask.associatedEvent || `CDI26-MA${activeTask.id}`,
    });
  }, [activeTask, reports, equipments]);

  // Close status and type dropdowns on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(e.target as Node)
      ) {
        setStatusDropdownOpen(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(e.target as Node)
      ) {
        setTypeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Filtered Tasks for 'list' view
  const filteredTasks = useMemo(() => {
    const baseList =
      subTab === 'my'
        ? tasks.filter(
            (t) =>
              t.assignedTo.toLowerCase() === CURRENT_LOGGED_USER.toLowerCase() ||
              t.assignedTo.toLowerCase() === 'ur'
          )
        : tasks;

    return baseList.filter((t) => {
      if (
        showCurrentContext &&
        selectedReportForNew?.equipmentTag &&
        t.equipmentTag !== selectedReportForNew.equipmentTag &&
        t.associatedEntity !== selectedReportForNew.equipmentTag
      ) {
        return false;
      }
      if (
        colFilters.title &&
        !t.title.toLowerCase().includes(colFilters.title.toLowerCase())
      )
        return false;
      if (
        colFilters.type &&
        !t.type.toLowerCase().includes(colFilters.type.toLowerCase())
      )
        return false;
      if (
        colFilters.assignedTo &&
        !t.assignedTo.toLowerCase().includes(colFilters.assignedTo.toLowerCase())
      )
        return false;
      if (
        colFilters.dueDate &&
        !(t.dueDate || '').toLowerCase().includes(colFilters.dueDate.toLowerCase())
      )
        return false;
      const entity = t.associatedEntity || t.equipmentTag || '';
      if (
        colFilters.associatedEntity &&
        !entity.toLowerCase().includes(colFilters.associatedEntity.toLowerCase())
      )
        return false;
      const eventStr = t.associatedEvent || '';
      if (
        colFilters.associatedEvent &&
        !eventStr.toLowerCase().includes(colFilters.associatedEvent.toLowerCase())
      )
        return false;
      if (
        colFilters.status &&
        !t.status.toLowerCase().includes(colFilters.status.toLowerCase())
      )
        return false;
      return true;
    });
  }, [tasks, subTab, colFilters, showCurrentContext, selectedReportForNew]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  if (!isOpen) return null;

  const renderStatusBadge = (status: string) => {
    const norm = (status || 'New').toLowerCase();
    let dotClass = 'bg-[#f59e0b]'; // New -> amber/yellow
    let label = status || 'New';
    if (norm === 'open' || norm === 'new') {
      dotClass = 'bg-[#f59e0b]';
      label = 'New';
    } else if (norm.includes('progress')) {
      dotClass = 'bg-[#3b82f6]';
      label = 'In Progress';
    } else if (norm.includes('cancel')) {
      dotClass = 'bg-[#64748b]';
      label = 'Cancelled';
    } else if (norm.includes('complete') || norm.includes('finish')) {
      dotClass = 'bg-[#22c55e]';
      label = 'Completed';
    }
    return (
      <span className="inline-flex items-center gap-2 text-xs text-text-primary">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
        <span>{label}</span>
      </span>
    );
  };

  const isDueDateOverdue = (dueStr?: string | null) => {
    if (!dueStr) return false;
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d.getTime() < today.getTime();
  };

  const formatDueIn = (dueStr?: string | null) => {
    if (!dueStr) return '-';
    const d = new Date(dueStr);
    if (isNaN(d.getTime())) return '-';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Due today';
    if (diffDays < 0) {
      const absDays = Math.abs(diffDays);
      const weeks = Math.round(absDays / 7);
      if (weeks >= 1) {
        return `Overdue by ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      }
      return `Overdue by ${absDays} ${absDays === 1 ? 'day' : 'days'}`;
    } else {
      const weeks = Math.round(diffDays / 7);
      if (weeks >= 1) {
        return `In ${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
      }
      return `In ${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    }
  };

  const formatPriorityLabel = (priority?: string) => {
    if (!priority) return '2-Medium';
    if (priority === 'High') return '1-High';
    if (priority === 'Medium') return '2-Medium';
    if (priority === 'Low') return '3-Low';
    if (priority === 'Very Low') return '4-very Low';
    return priority;
  };

  const formatCreatedOn = (dateStr?: string) => {
    if (!dateStr) return '2026-10-09 17:01:03';
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) return dateStr;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate()
    ).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(
      d.getMinutes()
    ).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = {
      title: !taskFormFields.title.trim() ? 'Task Title is required.' : '',
      description: !taskFormFields.description.trim()
        ? 'Task Description is required.'
        : '',
      assignedTo: !taskFormFields.assignedTo.trim()
        ? 'Assign Task To is required.'
        : '',
      directive:
        taskFormFields.faultReportOption === 'create' &&
        !taskFormFields.directive.trim()
          ? 'Directive is required.'
          : '',
    };
    if (errs.title || errs.description || errs.assignedTo || errs.directive) {
      setTaskFormErrors(errs);
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReportForNew?.id,
          equipmentTag:
            selectedReportForNew?.equipmentTag || taskFormFields.equipmentTag,
          type: taskFormFields.type,
          title: taskFormFields.title,
          description: taskFormFields.description,
          assignedTo: taskFormFields.assignedTo,
          priority: taskFormFields.priority,
          dueDate: taskFormFields.dueDate,
          associatedEvent: taskFormFields.associatedEvent,
          associatedEntity: taskFormFields.associatedEntity,
          faultReportOption: taskFormFields.faultReportOption,
          linkedWorkOrderReference: taskFormFields.linkedWorkOrderReference,
          faultReportFields:
            taskFormFields.faultReportOption === 'create'
              ? {
                  entryDate: taskFormFields.entryDate,
                  reportedBy: taskFormFields.reportedBy,
                  itemClassId: taskFormFields.itemClassId,
                  actionTakenOnField: taskFormFields.actionTakenOnField,
                  performedWork: taskFormFields.performedWork,
                  incidentManagement: taskFormFields.incidentManagement,
                  woSite: taskFormFields.woSite,
                  directive: taskFormFields.directive,
                  maintOrg: taskFormFields.maintOrg,
                  workType: taskFormFields.workType,
                  externalSource: taskFormFields.externalSource,
                  externalSourceId: taskFormFields.externalSourceId,
                  faultDesc: taskFormFields.faultDesc,
                  symptom: taskFormFields.symptom,
                  discovery: taskFormFields.discovery,
                  actionId: taskFormFields.actionId,
                  operationalStatus: taskFormFields.operationalStatus,
                }
              : undefined,
          attachedFilename: taskFormFields.attachedFilename || null,
          attachedFileSize: taskFormFields.attachedFileSize || null,
          sparePartNumber:
            taskFormFields.type === 'Spare Part Ordering'
              ? taskFormFields.sparePartNumber
              : null,
          purchaseOrderRef:
            taskFormFields.type === 'Spare Part Ordering'
              ? taskFormFields.purchaseOrderRef
              : null,
          quantity:
            taskFormFields.type === 'Spare Part Ordering'
              ? taskFormFields.quantity
              : null,
          unitOfQuantity:
            taskFormFields.type === 'Spare Part Ordering'
              ? taskFormFields.unitOfQuantity
              : null,
        }),
      });

      if (res.ok) {
        await onRefreshAll();
        // Transition to Tasks List -> All Tasks tab with newly created task at the top
        setSubTab('all');
        setCurrentPage(1);
        setView('list');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create task.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Error creating task.');
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const handleUpdateTaskStatusById = async (taskId: number, newStatus: string) => {
    setStatusDropdownOpen(false);
    setCompactStatusMenuTaskId(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await onRefreshAll();
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleUpdateTaskStatus = async (newStatus: string) => {
    if (!activeTask) return;
    await handleUpdateTaskStatusById(activeTask.id, newStatus);
  };

  const handleSendFaultReportToIfs = async () => {
    if (!activeTask) return;
    if (detailFrOption === 'create' && !detailFrFields.directive.trim()) {
      setDetailFrDirectiveError('Directive is required.');
      return;
    }
    setIsSendingToIfs(true);
    setDetailFrSuccessMsg(null);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTask.id,
          faultReportOption: detailFrOption,
          linkedWorkOrderReference: detailLinkedWoRef,
          faultReportFields:
            detailFrOption === 'create' ? detailFrFields : undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await onRefreshAll();
        setDetailFrSuccessMsg(
          detailFrOption === 'link'
            ? `Work Order ${data.workOrderReference || detailLinkedWoRef} linked to task!`
            : `Fault Report ${data.workOrderReference || ''} sent to IFS and linked!`
        );
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to send Fault Report to IFS.');
      }
    } catch (err) {
      console.error('Failed to send Fault Report to IFS:', err);
    } finally {
      setIsSendingToIfs(false);
    }
  };

  const handlePostComment = async () => {
    if (!activeTask || (!commentText.trim() && !commentAttachment)) return;
    setIsPostingComment(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeTask.id,
          newComment: {
            author: 'Marcos Lima dos Santos',
            initials: 'ML',
            text: commentText.trim() || `[Attached file: ${commentAttachment}]`,
            attachmentName: commentAttachment,
          },
        }),
      });
      if (res.ok) {
        setCommentText('');
        setCommentAttachment(null);
        await onRefreshAll();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPostingComment(false);
    }
  };

  const applyCommentFormat = (prefix: string, suffix = prefix) => {
    const el = commentInputRef.current;
    if (!el) {
      setCommentText((prev) => `${prev}${prefix}${suffix}`);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const selected = commentText.slice(start, end);
    const updated =
      commentText.slice(0, start) +
      prefix +
      (selected || 'text') +
      suffix +
      commentText.slice(end);
    setCommentText(updated);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 0);
  };

  const parsedTaskHistory = (() => {
    if (!activeTask) return [];
    if (activeTask.historyJson) {
      try {
        const arr = JSON.parse(activeTask.historyJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch {
        // fallback below
      }
    }
    return [
      {
        timestamp: formatCreatedOn(activeTask.createdAt),
        message: `${activeTask.assignedTo || 'João Gabriel Barros do Valle Ramos'} created task`,
      },
    ];
  })();

  const parsedTaskComments = (() => {
    if (!activeTask || !activeTask.commentsJson) return [];
    try {
      const arr = JSON.parse(activeTask.commentsJson);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  })();

  // Fault Report Fields Renderer (reused in 'new' view and 'detail' right pane)
  const renderFaultReportFormFields = (
    fields: typeof detailFrFields,
    setFields: (next: typeof detailFrFields) => void,
    directiveError: string,
    clearDirectiveError: () => void,
    singleColumn = false
  ) => (
    <div className="flex flex-col gap-3.5 mt-3 animate-fadeIn">
      {/* Row 1: Entry Date * & WO Site * */}
      <div className={`grid ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Entry Date <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={fields.entryDate}
              readOnly
              className="w-full bg-[#0b101d] border border-[#1e2640] rounded-md p-2 text-text-primary text-xs font-mono"
            />
            <Clock
              size={13}
              className="absolute right-2.5 text-text-muted pointer-events-none"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            WO Site<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.woSite}
            onChange={(e) => setFields({ ...fields, woSite: e.target.value })}
            placeholder="Enter"
            className="bg-[#121829] border border-[#25304d] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: Reported By * & Item Class ID * */}
      <div className={`grid ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Reported By<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.reportedBy}
            onChange={(e) =>
              setFields({ ...fields, reportedBy: e.target.value })
            }
            placeholder="Enter"
            className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Item Class ID<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={fields.itemClassId}
            onChange={(e) =>
              setFields({ ...fields, itemClassId: e.target.value })
            }
            placeholder="Select Equipment Tag"
            className="bg-[#121829] border border-[#25304d] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Row 3: Equipment Tag * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Equipment Tag <span className="text-red-500">*</span>
        </label>
        <select
          value={fields.equipmentTag}
          onChange={(e) =>
            setFields({ ...fields, equipmentTag: e.target.value })
          }
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
        >
          <option value={fields.equipmentTag}>{fields.equipmentTag || 'Select'}</option>
          {equipments
            .filter((eq) => eq.tag !== fields.equipmentTag)
            .map((eq) => (
              <option key={eq.id} value={eq.tag}>
                {eq.tag} - {eq.name}
              </option>
            ))}
        </select>
      </div>

      {/* Row 4: Operational Status * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Operational Status <span className="text-red-500">*</span>
        </label>
        <select
          value={fields.operationalStatus}
          onChange={(e) =>
            setFields({ ...fields, operationalStatus: e.target.value })
          }
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
        >
          <option value="01">01 - Non-intrusive / Non-obstructive</option>
          <option value="02">02 - Item Intrusive / Obstructive</option>
          <option value="03">03 - Package Intrusive / Obstructive</option>
        </select>
      </div>

      {/* Row 5: Action taken on the field? */}
      <div className="flex items-center gap-2 py-0.5">
        <input
          type="checkbox"
          checked={fields.actionTakenOnField}
          onChange={(e) =>
            setFields({ ...fields, actionTakenOnField: e.target.checked })
          }
          className="w-4 h-4 rounded border-[#1e2640] bg-[#0b101d] accent-[#60a5fa] cursor-pointer"
        />
        <span className="text-xs text-text-primary select-none">
          Action taken on the field?
        </span>
      </div>

      {/* Row 6: Performed Work * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Performed Work<span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          maxLength={60}
          value={fields.performedWork}
          onChange={(e) =>
            setFields({ ...fields, performedWork: e.target.value })
          }
          placeholder="Enter"
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
        />
        <span className="text-[10px] text-text-muted">
          {fields.performedWork.length}/60
        </span>
      </div>

      {/* Row 7: Incident Management */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px]">
          Incident Management
        </label>
        <select
          value={fields.incidentManagement}
          onChange={(e) =>
            setFields({ ...fields, incidentManagement: e.target.value })
          }
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
        >
          <option value="None">Select</option>
          <option value="Production Loss">Production Loss</option>
          <option value="Safety Critical">Safety Critical</option>
          <option value="Environmental">Environmental</option>
          <option value="Near Miss">Near Miss</option>
        </select>
      </div>

      {/* Row 8: Directive * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Directive<span className="text-red-500">*</span>
        </label>
        <textarea
          rows={2}
          maxLength={60}
          value={fields.directive}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setFields({ ...fields, directive: val });
            if (val.trim()) clearDirectiveError();
          }}
          className={`bg-[#0b101d] border rounded-md p-2 text-text-primary text-xs focus:border-accent-blue focus:outline-none resize-y ${
            directiveError ? 'border-red-500' : 'border-[#1e2640]'
          }`}
        />
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-text-muted">{fields.directive.length}/60</span>
          {directiveError && (
            <span className="text-red-400">{directiveError}</span>
          )}
        </div>
      </div>

      {/* Row 9: Fault Description * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Fault Description<span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          maxLength={2000}
          value={fields.faultDesc}
          onChange={(e) => setFields({ ...fields, faultDesc: e.target.value })}
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none resize-y leading-relaxed"
        />
        <span className="text-[10px] text-text-muted">
          {fields.faultDesc.length}/2000
        </span>
      </div>

      {/* Row 10: Maintenance Organization * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Maintenance Organization <span className="text-red-500">*</span>
        </label>
        <select
          value={fields.maintOrg}
          onChange={(e) => setFields({ ...fields, maintOrg: e.target.value })}
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
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

      {/* Row 11: 2x2 Grid */}
      <div className={`grid ${singleColumn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-3`}>
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Symptom <span className="text-red-500">*</span>
          </label>
          <select
            value={fields.symptom}
            onChange={(e) => setFields({ ...fields, symptom: e.target.value })}
            className="bg-[#121829] border border-[#25304d] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
          >
            <option value="VIB">VIB - Vibration</option>
            <option value="ELU">ELU - External leakage - utility medium</option>
            <option value="ELP">ELP - External leakage - process medium</option>
            <option value="NOI">NOI - Noise</option>
            <option value="OHE">OHE - Overheating</option>
            <option value="PLU">PLU - Plugged / Choked</option>
            <option value="STD">STD - Structural deficiency</option>
            <option value="BRD">BRD - Breakdown</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px]">
            Discovery Code [Optional]
          </label>
          <select
            value={fields.discovery}
            onChange={(e) =>
              setFields({ ...fields, discovery: e.target.value })
            }
            className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
          >
            <option value="04">04 - Periodic condition monitoring</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Work Type <span className="text-red-500">*</span>
          </label>
          <select
            value={fields.workType}
            onChange={(e) => setFields({ ...fields, workType: e.target.value })}
            className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
          >
            <option value="CM">CM - Corrective Maintenance</option>
            <option value="BM">BM - Breakdown Maintenance</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Action ID <span className="text-red-500">*</span>
          </label>
          <select
            value={fields.actionId}
            onChange={(e) => setFields({ ...fields, actionId: e.target.value })}
            className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
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
      </div>
    </div>
  );

  // Extract Tier label for activeTask in 'detail' view
  const getTaskTierLabel = (task: TaskDrawerItem) => {
    const rep = reports.find((r) => r.id === task.reportId);
    const cond = rep?.overallCondition || '';
    const match = cond.match(/Tier\s*\d/i);
    if (match) return match[0];
    if (task.priority === 'High') return 'Tier 1';
    if (task.priority === 'Medium') return 'Tier 2';
    if (task.priority === 'Low') return 'Tier 3';
    return 'Tier 4';
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[1040] animate-fadeIn"
      />

      {/* Right-Side Drawer */}
      <div
        className={`fixed top-10 right-0 bottom-0 z-[1050] bg-[#080c16] border-l border-[#1a2238] shadow-2xl flex transition-all duration-200 ${
          isExpanded
            ? 'w-full'
            : view === 'new'
            ? 'w-[95vw] max-w-[1380px]'
            : view === 'detail' && detailRightTab
            ? 'w-[690px] max-w-[96vw]'
            : 'w-[355px] max-w-[92vw]'
        }`}
      >
        {/* Left Vertical Rail inside Drawer (Matches Screenshot 2) */}
        <div className="w-14 bg-[#060911] border-r border-[#1a2238] flex flex-col items-center py-4 gap-5 shrink-0 select-none">
          {/* Notification */}
          <button
            type="button"
            onClick={() => setView('list')}
            className="w-full py-2 flex flex-col items-center gap-1.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors relative group"
          >
            <div className="relative">
              <Bell size={18} />
              <span className="absolute -top-1.5 -right-2.5 w-4 h-4 rounded-full bg-[#ef4444] text-white text-[9px] font-bold flex items-center justify-center shadow">
                4
              </span>
            </div>
            <span className="text-[9px] font-medium tracking-tight truncate max-w-[48px]">
              Notifica...
            </span>
          </button>

          {/* Task (Active) */}
          <button
            type="button"
            onClick={() => setView('list')}
            className="w-full py-2.5 flex flex-col items-center gap-1.5 bg-[#10182b] text-[#60a5fa] font-semibold border-y border-[#1e2946] cursor-pointer"
          >
            <CheckSquare size={18} />
            <span className="text-[10px]">Task</span>
          </button>

          {/* Discussion */}
          <button
            type="button"
            onClick={() => setView('list')}
            className="w-full py-2 flex flex-col items-center gap-1.5 text-text-muted hover:text-text-primary cursor-pointer transition-colors"
          >
            <MessageSquare size={18} />
            <span className="text-[9px] font-medium tracking-tight truncate max-w-[48px]">
              Discussi...
            </span>
          </button>
        </div>

        {/* Main Drawer Content Area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#080c16]">
          {/* ========================================================= */}
          {/* VIEW 1: TASKS LIST ('My Tasks' & 'All Tasks' - Anexos 5 & 6) */}
          {/* ========================================================= */}
          {view === 'list' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Top Header */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1a2238] shrink-0">
                <h2 className="text-sm font-bold text-text-primary">Tasks</h2>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                    title={isExpanded ? 'Restore size' : 'Maximize drawer'}
                  >
                    {isExpanded ? (
                      <Minimize2 size={15} />
                    ) : (
                      <Maximize2 size={15} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Show: Current Context Toggle (Visible in Compact Mode as in Screenshot 1) */}
              {!isExpanded && (
                <div className="flex items-center gap-2.5 px-6 pt-3 pb-1 shrink-0 select-none">
                  <button
                    type="button"
                    onClick={() => setShowCurrentContext((prev) => !prev)}
                    className={`w-8 h-4 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      showCurrentContext ? 'bg-[#3b82f6]' : 'bg-[#2a344c]'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-[#64748b] transition-transform ${
                        showCurrentContext
                          ? 'translate-x-4 bg-white'
                          : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className="text-xs text-[#64748b] font-medium">
                    Show: Current Context
                  </span>
                </div>
              )}

              {/* Sub-tabs: My Tasks | All Tasks */}
              <div className="flex items-center gap-6 px-6 pt-3 border-b border-[#1a2238] shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setSubTab('my');
                    setCurrentPage(1);
                  }}
                  className={`pb-2.5 text-xs font-semibold transition-colors relative cursor-pointer ${
                    subTab === 'my'
                      ? 'text-[#60a5fa]'
                      : 'text-text-primary hover:text-[#60a5fa]'
                  }`}
                >
                  My Tasks
                  {subTab === 'my' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-full" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubTab('all');
                    setCurrentPage(1);
                  }}
                  className={`pb-2.5 text-xs font-semibold transition-colors relative cursor-pointer ${
                    subTab === 'all'
                      ? 'text-[#60a5fa]'
                      : 'text-text-primary hover:text-[#60a5fa]'
                  }`}
                >
                  All Tasks
                  {subTab === 'all' && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#3b82f6] rounded-full" />
                  )}
                </button>
              </div>

              {/* Tasks Content: Compact Stacked Cards (!isExpanded) vs Full 7-Column Table (isExpanded) */}
              {!isExpanded ? (
                <div className="flex-1 overflow-y-auto divide-y divide-[#1a2238]">
                  {filteredTasks.length === 0 ? (
                    <div className="py-12 px-6 text-center text-text-muted text-xs">
                      No Rows To Show
                    </div>
                  ) : (
                    filteredTasks.map((t) => {
                      const overdue = isDueDateOverdue(t.dueDate);
                      const isMenuOpen = compactStatusMenuTaskId === t.id;
                      return (
                        <div
                          key={t.id}
                          className="px-6 py-4 flex flex-col gap-1.5 text-xs hover:bg-[#0d1424]/70 transition-colors"
                        >
                          {/* Created timestamp */}
                          <span className="text-[#94a3b8] font-mono text-xs">
                            {formatCreatedOn(t.createdAt)}
                          </span>

                          {/* Task Title */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTaskId(t.id);
                              setDetailRightTab(null);
                              setView('detail');
                            }}
                            className="text-left font-bold text-text-primary hover:text-[#60a5fa] transition-colors cursor-pointer text-xs mt-0.5"
                          >
                            {t.title}
                          </button>

                          {/* Associated Entity in blue */}
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTaskId(t.id);
                              setDetailRightTab(null);
                              setView('detail');
                            }}
                            className="text-left text-[#60a5fa] hover:underline font-semibold text-xs cursor-pointer w-fit"
                          >
                            {t.associatedEntity || t.equipmentTag}
                          </button>

                          {/* Key-value rows: Assigned task to, Status, Due Date */}
                          <div className="grid grid-cols-[110px_1fr] gap-y-1.5 items-center mt-1 text-xs">
                            <span className="text-[#94a3b8]">
                              Assigned task to
                            </span>
                            <span className="text-text-primary font-medium truncate">
                              {t.assignedTo}
                            </span>

                            <span className="text-[#94a3b8]">Status</span>
                            <div className="relative w-fit">
                              <button
                                type="button"
                                onClick={() =>
                                  setCompactStatusMenuTaskId(
                                    isMenuOpen ? null : t.id
                                  )
                                }
                                className="flex items-center gap-1.5 text-xs text-text-primary hover:text-[#60a5fa] cursor-pointer"
                              >
                                {renderStatusBadge(t.status)}
                                <ChevronDown
                                  size={12}
                                  className="text-text-muted"
                                />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute left-0 top-full mt-1 w-36 bg-[#121829] border border-[#263252] rounded-lg shadow-2xl py-1 z-50 flex flex-col">
                                  {[
                                    { label: 'New', dot: 'bg-[#f59e0b]' },
                                    {
                                      label: 'In Progress',
                                      dot: 'bg-[#3b82f6]',
                                    },
                                    { label: 'Cancelled', dot: 'bg-[#64748b]' },
                                    { label: 'Completed', dot: 'bg-[#22c55e]' },
                                  ].map((opt) => (
                                    <button
                                      key={opt.label}
                                      type="button"
                                      onClick={() =>
                                        handleUpdateTaskStatusById(
                                          t.id,
                                          opt.label
                                        )
                                      }
                                      className="flex items-center gap-2 px-3 py-1.5 text-left text-xs text-text-primary hover:bg-[#1c2642] transition-colors cursor-pointer"
                                    >
                                      <span
                                        className={`w-2 h-2 rounded-full ${opt.dot}`}
                                      />
                                      <span>{opt.label}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>

                            {t.dueDate ? (
                              <>
                                <span className="text-[#94a3b8]">Due Date</span>
                                <span
                                  className={`font-medium ${
                                    overdue
                                      ? 'text-[#ef4444]'
                                      : 'text-text-primary'
                                  }`}
                                >
                                  {t.dueDate}
                                </span>
                              </>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-6">
                <div className="bg-[#0d1322] border border-[#1c253e] rounded-lg p-4 flex flex-col justify-between min-h-[220px]">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#1c253e] text-[11px] font-bold text-text-primary">
                          {[
                            { key: 'title', label: 'Title' },
                            { key: 'type', label: 'Type' },
                            { key: 'assignedTo', label: 'Assign Task To' },
                            { key: 'dueDate', label: 'Due Date' },
                            {
                              key: 'associatedEntity',
                              label: 'Associated Entity',
                            },
                            {
                              key: 'associatedEvent',
                              label: 'Associated Event',
                            },
                            { key: 'status', label: 'Status' },
                          ].map((col) => (
                            <th
                              key={col.key}
                              className="py-2.5 px-3 align-top font-semibold"
                            >
                              <div className="flex flex-col gap-2">
                                <span>{col.label}</span>
                                <div className="flex items-center gap-1.5 border-b border-[#2a3659] pb-1">
                                  <input
                                    type="text"
                                    value={colFilters[col.key] || ''}
                                    onChange={(e) => {
                                      setColFilters({
                                        ...colFilters,
                                        [col.key]: e.target.value,
                                      });
                                      setCurrentPage(1);
                                    }}
                                    className="w-full bg-transparent text-[11px] font-normal text-text-primary focus:outline-none"
                                  />
                                  <SlidersHorizontal
                                    size={11}
                                    className="text-text-muted shrink-0"
                                  />
                                </div>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTasks.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-10 text-center text-text-muted text-xs"
                            >
                              No Rows To Show
                            </td>
                          </tr>
                        ) : (
                          paginatedTasks.map((t) => {
                            const overdue = isDueDateOverdue(t.dueDate);
                            return (
                              <tr
                                key={t.id}
                                className="border-b border-[#182036] hover:bg-[#131b2e]/70 transition-colors"
                              >
                                {/* Title */}
                                <td className="py-3.5 px-3">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTaskId(t.id);
                                      setDetailRightTab('history');
                                      setView('detail');
                                    }}
                                    className="text-[#60a5fa] hover:underline font-medium text-left cursor-pointer"
                                  >
                                    {t.title}
                                  </button>
                                </td>

                                {/* Type */}
                                <td className="py-3.5 px-3 text-[#cbd5e1]">
                                  {t.type}
                                </td>

                                {/* Assign Task To */}
                                <td className="py-3.5 px-3 text-[#cbd5e1] max-w-[180px]">
                                  {t.assignedTo}
                                </td>

                                {/* Due Date */}
                                <td
                                  className={`py-3.5 px-3 font-mono ${
                                    overdue
                                      ? 'text-[#f87171] font-medium'
                                      : 'text-[#cbd5e1]'
                                  }`}
                                >
                                  {t.dueDate || ''}
                                </td>

                                {/* Associated Entity */}
                                <td className="py-3.5 px-3">
                                  <span className="text-[#60a5fa] font-mono text-[11px]">
                                    {t.associatedEntity || t.equipmentTag}
                                  </span>
                                </td>

                                {/* Associated Event */}
                                <td className="py-3.5 px-3">
                                  {t.associatedEvent ? (
                                    <span className="inline-flex items-center gap-1.5 bg-[#1b243b] border border-[#2c3a5e] text-[#cbd5e1] px-2.5 py-0.5 rounded text-[11px] font-mono">
                                      <Paperclip
                                        size={11}
                                        className="text-[#94a3b8]"
                                      />
                                      {t.associatedEvent}
                                    </span>
                                  ) : null}
                                </td>

                                {/* Status */}
                                <td className="py-3.5 px-3">
                                  {renderStatusBadge(t.status)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  {filteredTasks.length > 0 && (
                    <div className="flex items-center justify-end gap-4 pt-4 mt-2 text-xs text-text-muted select-none">
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-[#090d16] border border-[#1e2640] rounded px-2 py-1 text-xs text-text-primary focus:outline-none cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                      </select>

                      <span>
                        {(currentPage - 1) * pageSize + 1} –{' '}
                        {Math.min(currentPage * pageSize, filteredTasks.length)}{' '}
                        of {filteredTasks.length}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(1)}
                          className="p-1 hover:text-text-primary disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronsLeft size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={currentPage === 1}
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          className="p-1 hover:text-text-primary disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <span className="px-2 text-text-primary font-semibold">
                          {currentPage}
                        </span>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          className="p-1 hover:text-text-primary disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronRight size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={currentPage >= totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="p-1 hover:text-text-primary disabled:opacity-40 cursor-pointer"
                        >
                          <ChevronsRight size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: NEW TASK FORM (Anexos 1, 3, 4)                    */}
          {/* ========================================================= */}
          {view === 'new' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a2238] shrink-0">
                <h2 className="text-sm font-bold text-text-primary">
                  New Task
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Form */}
              <form
                onSubmit={handleCreateTaskSubmit}
                className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4 text-xs"
              >
                {/* Type * (Starts unselected with 'Choose any item' as in Screenshot 1) */}
                <div className="flex flex-col gap-1 relative" ref={typeDropdownRef}>
                  <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setTypeDropdownOpen((prev) => !prev)}
                    className="w-full bg-[#0b101d] border border-[#b47820] rounded-md p-2.5 text-left text-xs flex items-center justify-between cursor-pointer focus:outline-none"
                  >
                    <span
                      className={
                        taskFormFields.type
                          ? 'text-text-primary font-medium'
                          : 'text-[#94a3b8]'
                      }
                    >
                      {taskFormFields.type || 'Choose any item'}
                    </span>
                    <ChevronDown size={14} className="text-text-muted" />
                  </button>

                  {typeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#121829] border border-[#222d47] rounded-md shadow-2xl py-1 z-50 flex flex-col">
                      {[
                        'Spare Part Ordering',
                        'Corrective Maintenance',
                        'Failure Analysis',
                        'Monitoring',
                      ].map((typeOpt) => {
                        const isSelected = taskFormFields.type === typeOpt;
                        const supportsFr =
                          typeOpt === 'Corrective Maintenance' ||
                          typeOpt === 'Monitoring';
                        return (
                          <button
                            key={typeOpt}
                            type="button"
                            onClick={() => {
                              setTaskFormFields((prev) => ({
                                ...prev,
                                type: typeOpt,
                                faultReportOption: supportsFr
                                  ? prev.faultReportOption
                                  : 'none',
                              }));
                              setTypeDropdownOpen(false);
                            }}
                            className={`px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#3b4766] text-white font-medium'
                                : 'text-text-primary hover:bg-[#3b4766]/80 hover:text-white'
                            }`}
                          >
                            {typeOpt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Remaining form fields appear only after a Type is selected */}
                {Boolean(taskFormFields.type) && (
                  <>
                {/* Task Title * */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                    Task Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={taskFormFields.title}
                    onChange={(e) => {
                      setTaskFormFields({
                        ...taskFormFields,
                        title: e.target.value,
                      });
                      if (e.target.value.trim())
                        setTaskFormErrors((prev) => ({ ...prev, title: '' }));
                    }}
                    className={`bg-[#0b101d] border rounded-md p-2.5 text-text-primary text-xs focus:border-accent-blue focus:outline-none ${
                      taskFormErrors.title
                        ? 'border-red-500'
                        : 'border-[#1e2640]'
                    }`}
                  />
                  {taskFormErrors.title && (
                    <span className="text-red-400 text-[10px]">
                      {taskFormErrors.title}
                    </span>
                  )}
                </div>

                {/* Task Description * */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                    Task Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={taskFormFields.description}
                    onChange={(e) => {
                      setTaskFormFields({
                        ...taskFormFields,
                        description: e.target.value,
                      });
                      if (e.target.value.trim())
                        setTaskFormErrors((prev) => ({
                          ...prev,
                          description: '',
                        }));
                    }}
                    className={`bg-[#0b101d] border rounded-md p-2.5 text-text-primary text-xs focus:border-accent-blue focus:outline-none resize-y leading-relaxed ${
                      taskFormErrors.description
                        ? 'border-red-500'
                        : 'border-[#1e2640]'
                    }`}
                  />
                  {taskFormErrors.description && (
                    <span className="text-red-400 text-[10px]">
                      {taskFormErrors.description}
                    </span>
                  )}
                </div>

                {/* Assign Task To * & Priority * */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                      Assign Task To <span className="text-red-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        list="drawer-assignees"
                        value={taskFormFields.assignedTo}
                        onChange={(e) => {
                          setTaskFormFields({
                            ...taskFormFields,
                            assignedTo: e.target.value,
                          });
                          if (e.target.value.trim())
                            setTaskFormErrors((prev) => ({
                              ...prev,
                              assignedTo: '',
                            }));
                        }}
                        placeholder="Start typing..."
                        className={`w-full bg-[#0b101d] border rounded-md p-2.5 pr-8 text-text-primary text-xs focus:border-accent-blue focus:outline-none ${
                          taskFormErrors.assignedTo
                            ? 'border-red-500'
                            : 'border-[#1e2640]'
                        }`}
                      />
                      {taskFormFields.assignedTo && (
                        <button
                          type="button"
                          onClick={() =>
                            setTaskFormFields({
                              ...taskFormFields,
                              assignedTo: '',
                            })
                          }
                          className="absolute right-2.5 text-text-muted hover:text-text-primary cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                    <datalist id="drawer-assignees">
                      <option value="João Gabriel Barros do Valle Ramos" />
                      <option value="David Capeling" />
                      <option value="Sabine Metzner" />
                      <option value="Ciciane Chiovatto" />
                      <option value="primael tiomela" />
                      <option value="Offshore Maintenance Supervisor" />
                      <option value="Vibration Specialist" />
                      <option value="Current User (UR)" />
                    </datalist>
                    {taskFormErrors.assignedTo && (
                      <span className="text-red-400 text-[10px]">
                        {taskFormErrors.assignedTo}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={taskFormFields.priority}
                      onChange={(e) =>
                        setTaskFormFields({
                          ...taskFormFields,
                          priority: e.target.value,
                        })
                      }
                      className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs cursor-pointer focus:outline-none"
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                      <option value="Very Low">Very Low</option>
                    </select>
                  </div>
                </div>

                {/* Due Date */}
                <div className="flex flex-col gap-1">
                  <label className="text-text-muted font-medium text-[11px]">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskFormFields.dueDate}
                    onChange={(e) =>
                      setTaskFormFields({
                        ...taskFormFields,
                        dueDate: e.target.value,
                      })
                    }
                    className="w-full bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs focus:outline-none"
                  />
                </div>

                {/* Associated Event & Associated Entity (Stacked as in Screenshot 1 & 4) */}
                <div className="flex flex-col gap-2.5 py-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-[10px] font-semibold">
                      Associated Event
                    </span>
                    <div className="inline-flex items-center gap-1.5 bg-[#1b243b] border border-[#2c3a5e] px-2.5 py-1 rounded text-[#cbd5e1] font-mono text-[11px] w-fit">
                      <Paperclip size={12} className="text-[#94a3b8]" />
                      <span>{taskFormFields.associatedEvent}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-text-muted text-[10px] font-semibold">
                      Associated Entity
                    </span>
                    <div className="inline-flex items-center gap-1.5 bg-[#1b243b] border border-[#2c3a5e] px-2.5 py-1 rounded text-[#cbd5e1] font-mono text-[11px] w-fit">
                      <Paperclip size={12} className="text-[#94a3b8]" />
                      <span>{taskFormFields.associatedEntity}</span>
                    </div>
                  </div>
                </div>

                {/* Spare Part Ordering Fields (Matches Spare Part Ordering Screenshot) */}
                {taskFormFields.type === 'Spare Part Ordering' && (
                  <div className="flex flex-col gap-4 pt-1 animate-fadeIn">
                    <div className="flex flex-col gap-1">
                      <label className="text-text-muted font-medium text-[11px]">
                        Spare part number
                      </label>
                      <input
                        type="text"
                        value={taskFormFields.sparePartNumber}
                        onChange={(e) =>
                          setTaskFormFields({
                            ...taskFormFields,
                            sparePartNumber: e.target.value,
                          })
                        }
                        className="w-full bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-text-muted font-medium text-[11px]">
                        Purchase order reference
                      </label>
                      <input
                        type="text"
                        value={taskFormFields.purchaseOrderRef}
                        onChange={(e) =>
                          setTaskFormFields({
                            ...taskFormFields,
                            purchaseOrderRef: e.target.value,
                          })
                        }
                        className="w-full bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-text-muted font-medium text-[11px]">
                        Quantity
                      </label>
                      <input
                        type="text"
                        value={taskFormFields.quantity}
                        onChange={(e) =>
                          setTaskFormFields({
                            ...taskFormFields,
                            quantity: e.target.value,
                          })
                        }
                        className="w-full bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-text-muted font-medium text-[11px]">
                        Unit of quantity
                      </label>
                      <input
                        type="text"
                        value={taskFormFields.unitOfQuantity}
                        onChange={(e) =>
                          setTaskFormFields({
                            ...taskFormFields,
                            unitOfQuantity: e.target.value,
                          })
                        }
                        className="w-full bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2.5 text-text-primary text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Create Fault Report Radio (Only for Corrective Maintenance & Monitoring, hidden for Failure Analysis per Screenshot 3) */}
                {(taskFormFields.type === 'Corrective Maintenance' ||
                  taskFormFields.type === 'Monitoring') && (
                <div className="flex flex-col gap-2 pt-3 border-t border-[#1e2640]">
                  <span className="text-text-primary font-semibold text-xs">
                    Create Fault Report
                  </span>
                  <div className="flex flex-col gap-2 mt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                      <input
                        type="radio"
                        name="newTaskFrOption"
                        checked={taskFormFields.faultReportOption === 'none'}
                        onChange={() =>
                          setTaskFormFields({
                            ...taskFormFields,
                            faultReportOption: 'none',
                          })
                        }
                        className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                      />
                      <span>Do not link Fault Report for now</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                      <input
                        type="radio"
                        name="newTaskFrOption"
                        checked={taskFormFields.faultReportOption === 'create'}
                        onChange={() =>
                          setTaskFormFields({
                            ...taskFormFields,
                            faultReportOption: 'create',
                          })
                        }
                        className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                      />
                      <span>Create a Fault Report</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                      <input
                        type="radio"
                        name="newTaskFrOption"
                        checked={taskFormFields.faultReportOption === 'link'}
                        onChange={() =>
                          setTaskFormFields({
                            ...taskFormFields,
                            faultReportOption: 'link',
                          })
                        }
                        className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                      />
                      <span>Link existing Fault Report</span>
                    </label>
                  </div>

                  {taskFormFields.faultReportOption === 'link' && (
                    <div className="flex flex-col gap-1.5 mt-2 animate-fadeIn">
                      <label className="text-text-muted font-medium text-[11px]">
                        Fault Report or Work order reference
                      </label>
                      <div className="flex items-center gap-2.5">
                        <input
                          type="text"
                          list="existing-wo-ref-list"
                          value={taskFormFields.linkedWorkOrderReference}
                          onChange={(e) =>
                            setTaskFormFields({
                              ...taskFormFields,
                              linkedWorkOrderReference: e.target.value,
                            })
                          }
                          placeholder="Enter or select WO reference..."
                          className="flex-1 bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
                        />
                        <datalist id="existing-wo-ref-list">
                          {workOrders.map((wo) => (
                            <option key={wo.id} value={wo.reference}>
                              {wo.tagNumber} - {wo.directive || wo.description}
                            </option>
                          ))}
                        </datalist>
                      </div>
                    </div>
                  )}

                  {taskFormFields.faultReportOption === 'create' &&
                    renderFaultReportFormFields(
                      {
                        entryDate: taskFormFields.entryDate,
                        woSite: taskFormFields.woSite,
                        reportedBy: taskFormFields.reportedBy,
                        itemClassId: taskFormFields.itemClassId,
                        equipmentTag: taskFormFields.equipmentTag,
                        operationalStatus: taskFormFields.operationalStatus,
                        actionTakenOnField: taskFormFields.actionTakenOnField,
                        performedWork: taskFormFields.performedWork,
                        incidentManagement: taskFormFields.incidentManagement,
                        directive: taskFormFields.directive,
                        faultDesc: taskFormFields.faultDesc,
                        maintOrg: taskFormFields.maintOrg,
                        symptom: taskFormFields.symptom,
                        discovery: taskFormFields.discovery,
                        workType: taskFormFields.workType,
                        actionId: taskFormFields.actionId,
                        externalSource: taskFormFields.externalSource,
                        externalSourceId: taskFormFields.externalSourceId,
                      },
                      (next) =>
                        setTaskFormFields({
                          ...taskFormFields,
                          ...next,
                        }),
                      taskFormErrors.directive,
                      () =>
                        setTaskFormErrors((prev) => ({
                          ...prev,
                          directive: '',
                        }))
                    )}
                </div>
                )}

                {/* Attachments */}
                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-text-muted font-medium text-[11px]">
                    Attachments
                  </label>
                  <div className="border border-dashed border-[#263252] hover:border-accent-blue rounded-lg p-6 bg-[#0a0f1c] flex flex-col items-center justify-center gap-2 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setTaskFormFields({
                            ...taskFormFields,
                            attachedFilename: file.name,
                            attachedFileSize: file.size,
                          });
                        }
                      }}
                    />
                    {taskFormFields.attachedFilename ? (
                      <div className="text-center">
                        <span className="text-status-ok font-semibold block text-xs">
                          ✓ {taskFormFields.attachedFilename}
                        </span>
                        <span className="text-text-muted text-[10px]">
                          ({(taskFormFields.attachedFileSize / 1024).toFixed(1)}{' '}
                          KB)
                        </span>
                      </div>
                    ) : (
                      <span className="text-text-muted text-xs">
                        Drop here or click to attach a file
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-start justify-end gap-3 pt-4 border-t border-[#1e2640] select-none mt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmittingNew}
                    className="border border-[#2b3758] hover:border-accent-blue text-text-primary px-5 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                  <div className="flex flex-col items-center">
                    <button
                      type="submit"
                      disabled={isSubmittingNew}
                      className="bg-[#4b5b7c] hover:bg-[#60a5fa] hover:text-[#080c16] text-white font-semibold px-5 py-2 rounded-full text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {isSubmittingNew ? (
                        <>
                          <RefreshCw className="animate-spin" size={12} />
                          Creating...
                        </>
                      ) : (
                        'Create Task'
                      )}
                    </button>
                    {taskFormFields.faultReportOption === 'create' && (
                      <span className="text-[10px] text-text-muted mt-1">
                        and send to IFS
                      </span>
                    )}
                  </div>
                </div>
                  </>
                )}
              </form>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: TASK DETAILS (History, Comments, Fault Report)    */}
          {/* ========================================================= */}
          {view === 'detail' && activeTask && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Top Bar: <- Back to tasks list | Pencil, Maximize, Close */}
              <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#1a2238] shrink-0">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex items-center gap-2 text-xs font-medium text-text-primary hover:text-[#60a5fa] transition-colors cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>{isExpanded ? 'Back to tasks list' : 'Back'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailRightTab('fault-report')}
                    className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                    title="Edit Task / Fault Report"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                    title={isExpanded ? 'Restore size' : 'Maximize'}
                  >
                    {isExpanded ? (
                      <Minimize2 size={15} />
                    ) : (
                      <Maximize2 size={15} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary p-1.5 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                    title="Close"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>

              {/* Split Content: Left Pane (Task Info) + Right Pane (History | Comments | Fault Report) */}
              <div className="flex-1 flex overflow-hidden">
                {/* Left Pane */}
                <div
                  className={`flex-1 overflow-y-auto flex flex-col justify-between text-xs ${
                    detailRightTab ? 'border-r border-[#1a2238]' : ''
                  }`}
                >
                  <div className="p-6 flex flex-col gap-5">
                    {/* Title & Description */}
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        {activeTask.title}
                      </h3>
                      <p className="text-xs text-[#94a3b8] whitespace-pre-line mt-2 leading-relaxed">
                        {activeTask.description}
                      </p>
                    </div>

                    {/* Metadata Key-Value Grid */}
                    <div className="grid grid-cols-[150px_1fr] gap-y-3 items-center text-xs">
                      <span className="text-text-muted">Assigned task to</span>
                      <span className="text-text-primary font-medium">
                        {activeTask.assignedTo}
                      </span>

                      <span className="text-text-muted">Priority</span>
                      <span className="text-text-primary font-medium">
                        {formatPriorityLabel(activeTask.priority)}
                      </span>

                      <span className="text-text-muted">Created On</span>
                      <span className="text-text-primary font-mono">
                        {formatCreatedOn(activeTask.createdAt)}
                      </span>

                      {activeTask.dueDate ? (
                        <>
                          <span className="text-text-muted">Due Date</span>
                          <span
                            className={`font-mono ${
                              isDueDateOverdue(activeTask.dueDate)
                                ? 'text-[#ef4444]'
                                : 'text-text-primary'
                            }`}
                          >
                            {activeTask.dueDate}
                          </span>

                          <span className="text-text-muted">Due In</span>
                          <span className="text-text-primary">
                            {formatDueIn(activeTask.dueDate)}
                          </span>
                        </>
                      ) : null}

                      {/* Interactive Status Dropdown */}
                      <span className="text-text-muted">Status</span>
                      <div className="relative w-fit" ref={statusDropdownRef}>
                        <button
                          type="button"
                          onClick={() =>
                            setStatusDropdownOpen((prev) => !prev)
                          }
                          className="flex items-center gap-2 text-xs text-text-primary hover:text-[#60a5fa] py-0.5 cursor-pointer"
                        >
                          {renderStatusBadge(activeTask.status)}
                          <ChevronDown size={13} className="text-text-muted" />
                        </button>

                        {statusDropdownOpen && (
                          <div className="absolute left-0 top-full mt-1 w-40 bg-[#121829] border border-[#263252] rounded-lg shadow-2xl py-1.5 z-50 flex flex-col">
                            {[
                              { label: 'New', dot: 'bg-[#f59e0b]' },
                              { label: 'In Progress', dot: 'bg-[#3b82f6]' },
                              { label: 'Cancelled', dot: 'bg-[#64748b]' },
                              { label: 'Completed', dot: 'bg-[#22c55e]' },
                            ].map((opt) => (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() => handleUpdateTaskStatus(opt.label)}
                                className="flex items-center gap-2.5 px-3.5 py-2 text-left text-xs text-text-primary hover:bg-[#1c2642] transition-colors cursor-pointer"
                              >
                                <span
                                  className={`w-2 h-2 rounded-full ${opt.dot}`}
                                />
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <span className="text-text-muted">Associated Event</span>
                      <div>
                        <span className="inline-flex items-center gap-1.5 bg-[#1b243b] border border-[#2c3a5e] text-[#cbd5e1] px-2.5 py-0.5 rounded text-[11px] font-mono">
                          <Paperclip size={11} className="text-[#94a3b8]" />
                          {activeTask.associatedEvent || `CDI26-MA${activeTask.id}`}
                        </span>
                      </div>

                      <span className="text-text-muted">Associated Entity</span>
                      <div>
                        <span className="inline-flex items-center gap-1.5 bg-[#1b243b] border border-[#2c3a5e] text-[#cbd5e1] px-2.5 py-0.5 rounded text-[11px] font-mono">
                          <Paperclip size={11} className="text-[#94a3b8]" />
                          {activeTask.associatedEntity || activeTask.equipmentTag}
                        </span>
                      </div>

                      <span className="text-text-muted">Type</span>
                      <span className="text-text-primary">{activeTask.type}</span>

                      <span className="text-text-muted">Tier</span>
                      <span className="text-text-primary">
                        {getTaskTierLabel(activeTask)}
                      </span>

                      {activeTask.type === 'Spare Part Ordering' ? (
                        <>
                          <span className="text-text-muted">
                            Spare part number
                          </span>
                          <span className="text-text-primary font-mono">
                            {activeTask.sparePartNumber || '-'}
                          </span>

                          <span className="text-text-muted">Quantity</span>
                          <span className="text-text-primary">
                            {activeTask.quantity || activeTask.unitOfQuantity
                              ? `${activeTask.quantity || ''} ${activeTask.unitOfQuantity || ''}`.trim()
                              : 'undefined undefined'}
                          </span>

                          <span className="text-text-muted">
                            Spare part number
                          </span>
                          <span className="text-text-primary font-mono">
                            {activeTask.purchaseOrderRef || '-'}
                          </span>
                        </>
                      ) : activeTask.type !== 'Failure Analysis' ? (
                        <>
                          <span className="text-text-muted">WO Reference</span>
                          <div>
                            {activeTask.workOrderReference ? (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onNavigateToWorkOrder(
                                    activeTask.workOrderReference!
                                  );
                                }}
                                className="text-[#60a5fa] hover:underline font-mono font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <FileText size={12} />
                                <span>{activeTask.workOrderReference}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailRightTab('fault-report');
                                  setDetailFrOption('create');
                                }}
                                className="text-[#60a5fa] hover:underline font-medium cursor-pointer"
                              >
                                Create or link a FR
                              </button>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>

                    {/* Attachments */}
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-text-primary font-semibold text-xs">
                          Attachments
                        </span>
                        <label className="text-[11px] text-[#60a5fa] hover:underline cursor-pointer">
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                await fetch('/api/tasks', {
                                  method: 'PUT',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    id: activeTask.id,
                                    attachedFilename: file.name,
                                    attachedFileSize: file.size,
                                  }),
                                });
                                await onRefreshAll();
                              }
                            }}
                          />
                        </label>
                      </div>

                      <label className="border border-dashed border-[#263252] hover:border-accent-blue rounded-lg p-6 bg-[#0a0f1c] flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              await fetch('/api/tasks', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  id: activeTask.id,
                                  attachedFilename: file.name,
                                  attachedFileSize: file.size,
                                }),
                              });
                              await onRefreshAll();
                            }
                          }}
                        />
                        {activeTask.attachedFilename ? (
                          <div className="text-center">
                            <span className="text-status-ok font-semibold block text-xs">
                              ✓ {activeTask.attachedFilename}
                            </span>
                            {activeTask.attachedFileSize ? (
                              <span className="text-text-muted text-[10px]">
                                ({(activeTask.attachedFileSize / 1024).toFixed(1)}{' '}
                                KB)
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-text-muted text-xs">
                            Drop here or click to attach a file
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Accordion Sections: History, Comments, Fault Report (Anexos 1, 2, 3) */}
                    <div className="flex flex-col border-t border-[#1a2238] mt-1 -mx-6">
                      <button
                        type="button"
                        onClick={() => setDetailRightTab('history')}
                        className={`flex items-center justify-between py-3 px-6 border-b border-[#1a2238] text-xs font-semibold transition-colors cursor-pointer ${
                          detailRightTab === 'history'
                            ? 'bg-[#2a334b] text-white'
                            : 'text-text-primary hover:bg-[#101729]'
                        }`}
                      >
                        <span>History</span>
                        <ChevronRight size={14} className="text-text-muted" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDetailRightTab('comments')}
                        className={`flex items-center justify-between py-3 px-6 border-b border-[#1a2238] text-xs font-semibold transition-colors cursor-pointer ${
                          detailRightTab === 'comments'
                            ? 'bg-[#2a334b] text-white'
                            : 'text-text-primary hover:bg-[#101729]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>Comments</span>
                          {parsedTaskComments.length > 0 && (
                            <span className="bg-[#60a5fa]/20 text-[#60a5fa] text-[10px] px-1.5 py-0.2 rounded-full">
                              {parsedTaskComments.length}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-text-muted" />
                      </button>

                      {(activeTask.type === 'Corrective Maintenance' ||
                        activeTask.type === 'Monitoring') && (
                        <button
                          type="button"
                          onClick={() => setDetailRightTab('fault-report')}
                          className={`flex items-center justify-between py-3 px-6 border-b border-[#1a2238] text-xs font-semibold transition-colors cursor-pointer ${
                            detailRightTab === 'fault-report'
                              ? 'bg-[#2a334b] text-white'
                              : 'text-text-primary hover:bg-[#101729]'
                          }`}
                        >
                          <span>Fault Report</span>
                          <ChevronRight size={14} className="text-text-muted" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* RIGHT PANE: History | Comments | Fault Report             */}
                {/* ========================================================= */}
                {detailRightTab === 'history' && (
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 text-xs bg-[#080c16] animate-fadeIn">
                    {/* Right Pane Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#1a2238]">
                      <h4 className="text-xs font-bold text-text-primary">
                        History
                      </h4>
                      <button
                        type="button"
                        onClick={() => setDetailRightTab(null)}
                        className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                        title="Close panel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Vertical Timeline (Anexo 1) */}
                    <div className="relative pl-5 flex flex-col gap-6 mt-1">
                      {/* Vertical line connecting dots */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-[#334155]" />

                      {parsedTaskHistory.map(
                        (
                          entry: { timestamp: string; message: string },
                          idx: number
                        ) => (
                          <div key={idx} className="relative flex flex-col gap-1">
                            {/* Timeline Dot */}
                            <span className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full bg-[#94a3b8] ring-4 ring-[#080c16]" />
                            <span className="text-[#94a3b8] text-[11px] font-mono">
                              {entry.timestamp}
                            </span>
                            <span className="text-text-primary text-xs leading-relaxed">
                              {entry.message}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {detailRightTab === 'comments' && (
                  <div className="flex-1 flex flex-col h-full overflow-hidden p-6 text-xs bg-[#080c16] animate-fadeIn">
                    {/* Right Pane Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#1a2238] shrink-0">
                      <h4 className="text-xs font-bold text-text-primary">
                        Comments
                      </h4>
                      <button
                        type="button"
                        onClick={() => setDetailRightTab(null)}
                        className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                        title="Close panel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {/* Comments Thread or Empty State (Anexo 2) */}
                    <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
                      {parsedTaskComments.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-text-muted select-none">
                          <Info size={16} className="text-[#94a3b8]" />
                          <span className="text-xs text-text-primary font-medium">
                            No Comments yet
                          </span>
                        </div>
                      ) : (
                        parsedTaskComments.map(
                          (c: {
                            id: number;
                            author: string;
                            initials?: string;
                            timestamp: string;
                            text: string;
                            attachmentName?: string | null;
                          }) => (
                            <div
                              key={c.id}
                              className="bg-[#0d1323] border border-[#1c2640] rounded-lg p-3.5 flex flex-col gap-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-[#3b82f6] text-white text-[9px] font-bold flex items-center justify-center">
                                    {c.initials || 'ML'}
                                  </span>
                                  <span className="font-semibold text-text-primary text-xs">
                                    {c.author}
                                  </span>
                                </div>
                                <span className="text-[10px] text-text-muted font-mono">
                                  {c.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-[#cbd5e1] whitespace-pre-line leading-relaxed pl-7">
                                {c.text}
                              </p>
                              {c.attachmentName && (
                                <div className="pl-7 pt-1">
                                  <span className="inline-flex items-center gap-1.5 bg-[#162038] border border-[#263559] text-[#60a5fa] px-2 py-0.5 rounded text-[10px]">
                                    <Paperclip size={10} />
                                    {c.attachmentName}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        )
                      )}
                    </div>

                    {/* Rich-Text Comment Composer Box (Anexo 2) */}
                    <div className="border border-[#2b3c60] rounded-md bg-[#0a0f1c] p-2.5 flex flex-col gap-2 shrink-0">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-3.5 px-1 pb-1.5 border-b border-[#182238] text-[#94a3b8]">
                        <button
                          type="button"
                          onClick={() => applyCommentFormat('**')}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Bold"
                        >
                          <Bold size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCommentFormat('*')}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Italic"
                        >
                          <Italic size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCommentFormat('__')}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Underline"
                        >
                          <Underline size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => applyCommentFormat('[Highlight: ', ']')}
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Text Highlight"
                        >
                          <Baseline size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCommentText((prev) => `${prev}\n`)
                          }
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Align Left"
                        >
                          <AlignLeft size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCommentText((prev) => `${prev}  `)
                          }
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Align Center / Indent"
                        >
                          <AlignCenter size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCommentText((prev) =>
                              prev ? `${prev}\n• ` : '• '
                            )
                          }
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Bullet List"
                        >
                          <List size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setCommentText((prev) =>
                              prev ? `${prev}\n1. ` : '1. '
                            )
                          }
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Numbered List"
                        >
                          <ListOrdered size={13} />
                        </button>
                        <label
                          className="hover:text-white transition-colors cursor-pointer"
                          title="Attach file to comment"
                        >
                          <Paperclip size={13} />
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setCommentAttachment(file.name);
                              }
                            }}
                          />
                        </label>
                        {commentAttachment && (
                          <span className="text-[10px] text-[#60a5fa] truncate max-w-[140px]">
                            📎 {commentAttachment}
                          </span>
                        )}
                      </div>

                      {/* Textarea + Send Button */}
                      <div className="relative flex items-end">
                        <textarea
                          ref={commentInputRef}
                          rows={3}
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment();
                            }
                          }}
                          placeholder="Start typing..."
                          className="w-full bg-transparent text-xs text-text-primary placeholder:text-text-muted/60 focus:outline-none resize-none pr-8 leading-relaxed"
                        />
                        <button
                          type="button"
                          disabled={
                            isPostingComment ||
                            (!commentText.trim() && !commentAttachment)
                          }
                          onClick={handlePostComment}
                          className="text-[#60a5fa] hover:text-[#3b82f6] disabled:opacity-40 p-1 transition-colors cursor-pointer"
                          title="Send comment"
                        >
                          <SendHorizontal size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {detailRightTab === 'fault-report' && (
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 text-xs bg-[#080c16] animate-fadeIn">
                    {/* Right Pane Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-[#1a2238]">
                      <h4 className="text-xs font-bold text-text-primary">
                        Fault Report
                      </h4>
                      <button
                        type="button"
                        onClick={() => setDetailRightTab(null)}
                        className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                        title="Close panel"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    {detailFrSuccessMsg && (
                      <div className="bg-status-ok/10 border border-status-ok/30 text-status-ok p-2.5 rounded-lg text-xs font-medium">
                        ✓ {detailFrSuccessMsg}
                      </div>
                    )}

                    {/* Radio Options */}
                    <div className="flex flex-col gap-2.5">
                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                        <input
                          type="radio"
                          name="detailFrOption"
                          checked={detailFrOption === 'none'}
                          onChange={() => setDetailFrOption('none')}
                          className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                        />
                        <span>Do not link Fault Report for now</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                        <input
                          type="radio"
                          name="detailFrOption"
                          checked={detailFrOption === 'create'}
                          onChange={() => setDetailFrOption('create')}
                          className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                        />
                        <span>Create a Fault Report</span>
                      </label>

                      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-text-primary">
                        <input
                          type="radio"
                          name="detailFrOption"
                          checked={detailFrOption === 'link'}
                          onChange={() => setDetailFrOption('link')}
                          className="w-3.5 h-3.5 accent-[#60a5fa] cursor-pointer"
                        />
                        <span>Link existing Fault Report</span>
                      </label>
                    </div>

                    {/* Link existing Fault Report (Anexo 6) */}
                    {detailFrOption === 'link' && (
                      <div className="flex flex-col gap-1.5 mt-2 animate-fadeIn">
                        <label className="text-text-muted font-medium text-[11px]">
                          Fault Report or Work order reference
                        </label>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="text"
                            list="detail-wo-ref-list"
                            value={detailLinkedWoRef}
                            onChange={(e) =>
                              setDetailLinkedWoRef(e.target.value)
                            }
                            placeholder=""
                            className="flex-1 bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
                          />
                          <datalist id="detail-wo-ref-list">
                            {workOrders.map((wo) => (
                              <option key={wo.id} value={wo.reference}>
                                {wo.tagNumber} - {wo.directive || wo.description}
                              </option>
                            ))}
                          </datalist>
                          <button
                            type="button"
                            disabled={!detailLinkedWoRef.trim() || isSendingToIfs}
                            onClick={handleSendFaultReportToIfs}
                            className={`px-4 py-2 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                              detailLinkedWoRef.trim()
                                ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080c16]'
                                : 'bg-[#4b5b7c] text-[#94a3b8] opacity-70 cursor-not-allowed'
                            }`}
                          >
                            Link
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Create a Fault Report (Anexos 4 & 5) */}
                    {detailFrOption === 'create' && (
                      <>
                        {renderFaultReportFormFields(
                          detailFrFields,
                          setDetailFrFields,
                          detailFrDirectiveError,
                          () => setDetailFrDirectiveError(''),
                          !isExpanded
                        )}

                        {/* Send to IFS Button */}
                        <div className="flex justify-end pt-3">
                          <button
                            type="button"
                            disabled={isSendingToIfs}
                            onClick={handleSendFaultReportToIfs}
                            className="bg-[#60a5fa] hover:bg-[#3b82f6] text-[#080c16] font-semibold px-5 py-2 rounded-full text-xs transition-colors cursor-pointer shadow disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {isSendingToIfs ? (
                              <>
                                <RefreshCw
                                  className="animate-spin"
                                  size={12}
                                />
                                Sending...
                              </>
                            ) : (
                              'Send to IFS'
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

