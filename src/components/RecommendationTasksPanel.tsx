'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  ArrowLeft,
  Pencil,
  Paperclip,
  Clock,
  Info,
  ChevronRight,
  ChevronDown,
  SendHorizontal,
  Bold,
  Italic,
  Underline,
  Baseline,
  AlignLeft,
  AlignCenter,
  List,
  ListOrdered,
  RefreshCw,
} from 'lucide-react';
import {
  TaskDrawerReport,
  TaskDrawerItem,
  TaskDrawerEquipment,
  TaskDrawerWorkOrder,
} from './TaskManagerDrawer';

interface RecommendationTasksPanelProps {
  report: TaskDrawerReport;
  tasks: TaskDrawerItem[];
  equipments: TaskDrawerEquipment[];
  workOrders: TaskDrawerWorkOrder[];
  onClosePanel: () => void;
  onRefreshAll: () => Promise<void>;
  onNavigateToWorkOrder?: (woRef: string) => void;
}

type PanelSubView =
  | 'list'
  | 'new'
  | 'new-fr'
  | 'detail'
  | 'detail-history'
  | 'detail-comments'
  | 'detail-fr';

export default function RecommendationTasksPanel({
  report,
  tasks,
  equipments,
  workOrders,
  onClosePanel,
  onRefreshAll,
  onNavigateToWorkOrder,
}: RecommendationTasksPanelProps) {
  const [subView, setSubView] = useState<PanelSubView>('list');
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
  const [statusMenuTaskId, setStatusMenuTaskId] = useState<number | null>(null);
  const [detailStatusDropdownOpen, setDetailStatusDropdownOpen] = useState(false);

  // Filter tasks linked to this specific recommendation
  const reportTasks = tasks.filter(
    (t) => Number(t.reportId) === Number(report.id)
  );

  const activeTask =
    reportTasks.find((t) => t.id === activeTaskId) ||
    tasks.find((t) => t.id === activeTaskId) ||
    null;

  // Reset to list view when selected report changes
  useEffect(() => {
    setSubView('list');
    setActiveTaskId(null);
  }, [report.id]);

  // New Task Form State
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const typeDropdownRef = useRef<HTMLDivElement>(null);

  const buildInitialFormState = () => {
    const tech = (report.technology || '').toLowerCase();
    const isLube =
      tech.includes('lube') || tech.includes('oil') || tech.includes('lubric');
    const techStatus =
      (isLube
        ? report.lubeOilStatus || report.overallCondition
        : report.vibrationStatus || report.overallCondition) || '';
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
    const eq = equipments.find((e) => e.tag === report.equipmentTag);
    const fpso =
      eq?.fpso?.replace(/^FPSO\s+/i, '') ||
      report.facility?.replace(/^FPSO\s+/i, '') ||
      'CDI';
    const cleanClass = (report.equipmentClass || eq?.class || 'PUCE').replace(
      /^equipmentClass_/i,
      ''
    );

    const now = new Date();
    const entryDateStr = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(
      now.getSeconds()
    ).padStart(2, '0')}`;

    const eventCode = report.cmmsNumber || `CDI26-MA${report.id}`;

    return {
      type: '',
      title: '',
      description: '',
      assignedTo: '',
      priority: '',
      dueDate: '',
      associatedEvent: eventCode,
      associatedEntity: report.equipmentTag,
      faultReportOption: 'none' as 'none' | 'create' | 'link',
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
      directive: '',
      faultDesc: `event_${eventCode} | ${
        report.shortDescription || 'Monitoring alert triggered'
      }`,
      maintOrg: 'MECHTS',
      symptom: isLube ? 'ELU' : 'VIB',
      discovery: '04',
      workType: 'CM',
      actionId: isLube ? '7' : '6',
      externalSource: extSrc,
      externalSourceId: eventCode,
      attachedFilename: '',
      attachedFileSize: 0,
      sparePartNumber: '',
      purchaseOrderRef: '',
      quantity: '',
      unitOfQuantity: '',
    };
  };

  const [taskFormFields, setTaskFormFields] = useState(buildInitialFormState);
  const [frDraftOption, setFrDraftOption] = useState<'none' | 'create' | 'link'>('none');
  const [frDraftDirectiveError, setFrDraftDirectiveError] = useState('');
  const [taskFormErrors, setTaskFormErrors] = useState({
    title: '',
    description: '',
    assignedTo: '',
    priority: '',
  });
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Comments composer state
  const [commentText, setCommentText] = useState('');
  const [commentAttachment, setCommentAttachment] = useState<string | null>(null);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Detail Fault Report state
  const [detailFrOption, setDetailFrOption] = useState<'none' | 'create' | 'link'>('none');
  const [detailLinkedWoRef, setDetailLinkedWoRef] = useState('');
  const [detailFrDirectiveError, setDetailFrDirectiveError] = useState('');
  const [isSendingToIfs, setIsSendingToIfs] = useState(false);

  const handleOpenNewTask = () => {
    const initial = buildInitialFormState();
    setTaskFormFields(initial);
    setFrDraftOption('none');
    setFrDraftDirectiveError('');
    setTaskFormErrors({ title: '', description: '', assignedTo: '', priority: '' });
    setTypeDropdownOpen(false);
    setSubView('new');
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

  const formatPriorityLabel = (priority?: string) => {
    if (!priority) return '2-medium';
    if (priority === 'High') return '1-high';
    if (priority === 'Medium') return '2-medium';
    if (priority === 'Low') return '3-low';
    if (priority === 'Very Low') return '4-very Low';
    return priority;
  };

  const getTaskTierLabel = (task: TaskDrawerItem) => {
    const cond = report.overallCondition || '';
    const match = cond.match(/Tier\s*\d/i);
    if (match) return match[0];
    if (task.priority === 'High') return 'Tier 1';
    if (task.priority === 'Medium') return 'Tier 2';
    if (task.priority === 'Low') return 'Tier 3';
    return 'Tier 4';
  };

  const renderStatusBadge = (status: string) => {
    const norm = (status || 'New').toLowerCase();
    let dotClass = 'bg-[#f59e0b]';
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

  const handleUpdateTaskStatusById = async (taskId: number, newStatus: string) => {
    setStatusMenuTaskId(null);
    setDetailStatusDropdownOpen(false);
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
      priority: !taskFormFields.priority ? 'Priority is required.' : '',
    };
    if (errs.title || errs.description || errs.assignedTo || errs.priority) {
      setTaskFormErrors(errs);
      return;
    }

    setIsSubmittingNew(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: report.id,
          equipmentTag: report.equipmentTag,
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
                  directive:
                    taskFormFields.directive ||
                    taskFormFields.title.toUpperCase().slice(0, 60),
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
        setSubView('list');
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create task.');
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsSubmittingNew(false);
    }
  };

  const parsedTaskHistory = (() => {
    if (!activeTask) return [];
    if (activeTask.historyJson) {
      try {
        const arr = JSON.parse(activeTask.historyJson);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      } catch {
        // fallback
      }
    }
    return [
      {
        timestamp: formatCreatedOn(activeTask.createdAt),
        message: `${activeTask.assignedTo || 'Sabine Metzner'} created task`,
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
  };

  const availableWosForEquipment = workOrders.filter(
    (wo) =>
      (wo.tagNumber || '').trim().toUpperCase() ===
      (report.equipmentTag || '').trim().toUpperCase()
  );

  // Render Fault Report fields (shared by 'new-fr' and 'detail-fr')
  const renderFaultReportFields = () => (
    <div className="flex flex-col gap-3.5 mt-4 animate-fadeIn">
      {/* Row 1: Entry Date * & WO Site * */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Entry Date <span className="text-red-500">*</span>
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={taskFormFields.entryDate}
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
            value={taskFormFields.woSite}
            onChange={(e) =>
              setTaskFormFields({ ...taskFormFields, woSite: e.target.value })
            }
            placeholder="Enter"
            className="bg-[#121829] border border-[#25304d] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* Row 2: Reported By * & Item Class ID * */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Reported By<span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={taskFormFields.reportedBy}
            onChange={(e) =>
              setTaskFormFields({
                ...taskFormFields,
                reportedBy: e.target.value,
              })
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
            value={taskFormFields.itemClassId}
            onChange={(e) =>
              setTaskFormFields({
                ...taskFormFields,
                itemClassId: e.target.value,
              })
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
          value={taskFormFields.equipmentTag}
          onChange={(e) =>
            setTaskFormFields({
              ...taskFormFields,
              equipmentTag: e.target.value,
            })
          }
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
        >
          <option value={taskFormFields.equipmentTag}>
            {taskFormFields.equipmentTag || 'Select'}
          </option>
          {equipments
            .filter((eq) => eq.tag !== taskFormFields.equipmentTag)
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
          value={taskFormFields.operationalStatus}
          onChange={(e) =>
            setTaskFormFields({
              ...taskFormFields,
              operationalStatus: e.target.value,
            })
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
          checked={taskFormFields.actionTakenOnField}
          onChange={(e) =>
            setTaskFormFields({
              ...taskFormFields,
              actionTakenOnField: e.target.checked,
            })
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
          value={taskFormFields.performedWork}
          onChange={(e) =>
            setTaskFormFields({
              ...taskFormFields,
              performedWork: e.target.value,
            })
          }
          placeholder="Enter"
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
        />
        <span className="text-[10px] text-text-muted">
          {taskFormFields.performedWork.length}/60
        </span>
      </div>

      {/* Row 7: Incident Management */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px]">
          Incident Management
        </label>
        <select
          value={taskFormFields.incidentManagement}
          onChange={(e) =>
            setTaskFormFields({
              ...taskFormFields,
              incidentManagement: e.target.value,
            })
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
          value={taskFormFields.directive}
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setTaskFormFields({ ...taskFormFields, directive: val });
            if (val.trim()) setFrDraftDirectiveError('');
          }}
          className={`bg-[#0b101d] border rounded-md p-2 text-text-primary text-xs focus:border-accent-blue focus:outline-none resize-y ${
            frDraftDirectiveError ? 'border-red-500' : 'border-[#1e2640]'
          }`}
        />
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-text-muted">
            {taskFormFields.directive.length}/60
          </span>
          {frDraftDirectiveError && (
            <span className="text-red-400">{frDraftDirectiveError}</span>
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
          value={taskFormFields.faultDesc}
          onChange={(e) =>
            setTaskFormFields({ ...taskFormFields, faultDesc: e.target.value })
          }
          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none resize-y leading-relaxed"
        />
        <span className="text-[10px] text-text-muted">
          {taskFormFields.faultDesc.length}/2000
        </span>
      </div>

      {/* Row 10: Maintenance Organization * */}
      <div className="flex flex-col gap-1">
        <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
          Maintenance Organization <span className="text-red-500">*</span>
        </label>
        <select
          value={taskFormFields.maintOrg}
          onChange={(e) =>
            setTaskFormFields({ ...taskFormFields, maintOrg: e.target.value })
          }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
            Symptom <span className="text-red-500">*</span>
          </label>
          <select
            value={taskFormFields.symptom}
            onChange={(e) =>
              setTaskFormFields({ ...taskFormFields, symptom: e.target.value })
            }
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
            value={taskFormFields.discovery}
            onChange={(e) =>
              setTaskFormFields({
                ...taskFormFields,
                discovery: e.target.value,
              })
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
            value={taskFormFields.workType}
            onChange={(e) =>
              setTaskFormFields({ ...taskFormFields, workType: e.target.value })
            }
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
            value={taskFormFields.actionId}
            onChange={(e) =>
              setTaskFormFields({ ...taskFormFields, actionId: e.target.value })
            }
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

  return (
    <div className="flex flex-col h-full bg-[#080c16] border-l border-[#1a2238] text-text-primary select-none">
      {/* ========================================================= */}
      {/* SUB-VIEW 1: TASKS LIST FOR THIS RECOMMENDATION (Anexos 2 & 9) */}
      {/* ========================================================= */}
      {subView === 'list' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Header: Tasks | + | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <span className="text-xs font-bold text-text-primary">Tasks</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenNewTask}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Create a new task"
              >
                <Plus size={16} />
              </button>
              <button
                type="button"
                onClick={onClosePanel}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Close Tasks panel"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Body: No Tasks (Anexo 2) or Task Cards (Anexo 9) */}
          {reportTasks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-start pt-16 px-6 text-center gap-2">
              <Info size={18} className="text-[#94a3b8]" />
              <span className="text-xs font-bold text-text-primary">
                No Tasks
              </span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-[#1a2238]">
              {reportTasks.map((t) => {
                const isMenuOpen = statusMenuTaskId === t.id;
                return (
                  <div
                    key={t.id}
                    className="px-5 py-4 flex flex-col gap-1.5 text-xs hover:bg-[#0d1424]/70 transition-colors"
                  >
                    {/* Timestamp */}
                    <span className="text-[#94a3b8] font-mono text-xs">
                      {formatCreatedOn(t.createdAt)}
                    </span>

                    {/* Title (clickable to open Task Detail) */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTaskId(t.id);
                        setSubView('detail');
                      }}
                      className="text-left font-bold text-text-primary hover:text-[#60a5fa] transition-colors cursor-pointer text-xs mt-0.5 w-fit"
                    >
                      {t.title}
                    </button>

                    {/* Assigned task to */}
                    <div className="grid grid-cols-12 items-center mt-1">
                      <span className="col-span-5 text-[#94a3b8]">
                        Assigned task to
                      </span>
                      <span
                        className="col-span-7 text-text-primary font-medium truncate"
                        title={t.assignedTo}
                      >
                        {t.assignedTo}
                      </span>
                    </div>

                    {/* Status with inline dropdown */}
                    <div className="grid grid-cols-12 items-center relative">
                      <span className="col-span-5 text-[#94a3b8]">Status</span>
                      <div className="col-span-7 relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setStatusMenuTaskId(isMenuOpen ? null : t.id);
                          }}
                          className="inline-flex items-center gap-1.5 hover:bg-[#151d30] px-1.5 py-0.5 -ml-1.5 rounded transition-colors cursor-pointer"
                        >
                          {renderStatusBadge(t.status)}
                          <ChevronDown size={12} className="text-text-muted" />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute left-0 top-full mt-1 w-40 bg-[#141c2e] border border-[#263252] rounded-md shadow-2xl py-1 z-50 animate-fadeIn">
                            {[
                              'New',
                              'In Progress',
                              'Cancelled',
                              'Completed',
                            ].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleUpdateTaskStatusById(t.id, st);
                                }}
                                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#1e2946] flex items-center gap-2 cursor-pointer transition-colors ${
                                  t.status === st
                                    ? 'bg-[#1e2946]/60 font-semibold'
                                    : ''
                                }`}
                              >
                                {renderStatusBadge(st)}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 2: NEW TASK (Anexos 3, 4 & 5)                     */}
      {/* ========================================================= */}
      {subView === 'new' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Header: ← New Task | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubView('list')}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Back to Tasks"
              >
                <ArrowLeft size={15} />
              </button>
              <span className="text-xs font-bold text-text-primary">
                New Task
              </span>
            </div>
            <button
              type="button"
              onClick={onClosePanel}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleCreateTaskSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4 text-xs">
              {/* Type * Custom Select */}
              <div className="flex flex-col gap-1" ref={typeDropdownRef}>
                <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTypeDropdownOpen((prev) => !prev)}
                    className={`w-full bg-[#0b101d] border rounded-md px-3 py-2 text-left text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      typeDropdownOpen
                        ? 'border-[#3b82f6]'
                        : 'border-[#1e2640] hover:border-[#2e3a5c]'
                    }`}
                  >
                    <span
                      className={
                        taskFormFields.type
                          ? 'text-text-primary font-medium'
                          : 'text-[#64748b]'
                      }
                    >
                      {taskFormFields.type || 'Choose any item'}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-text-muted transition-transform ${
                        typeDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {typeDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-[#141a29] border border-[#24304d] rounded-md shadow-2xl py-1 z-50 animate-fadeIn">
                      {[
                        'Spare Part Ordering',
                        'Corrective Maintenance',
                        'Failure Analysis',
                        'Monitoring',
                      ].map((opt) => {
                        const isSelected = taskFormFields.type === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setTaskFormFields({
                                ...taskFormFields,
                                type: opt,
                              });
                              setTypeDropdownOpen(false);
                            }}
                            className={`w-full px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer block ${
                              isSelected
                                ? 'bg-[#4b5563]/60 text-white font-semibold'
                                : 'text-[#e2e8f0] hover:bg-[#28334a]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Fields appear once a Type is chosen (Anexo 5) */}
              {taskFormFields.type !== '' && (
                <div className="flex flex-col gap-4 animate-fadeIn">
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
                        if (e.target.value.trim()) {
                          setTaskFormErrors((prev) => ({ ...prev, title: '' }));
                        }
                      }}
                      className={`bg-[#0b101d] border rounded-md p-2 text-text-primary text-xs focus:border-accent-blue focus:outline-none ${
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
                      rows={3}
                      value={taskFormFields.description}
                      onChange={(e) => {
                        setTaskFormFields({
                          ...taskFormFields,
                          description: e.target.value,
                        });
                        if (e.target.value.trim()) {
                          setTaskFormErrors((prev) => ({
                            ...prev,
                            description: '',
                          }));
                        }
                      }}
                      className={`bg-[#0b101d] border rounded-md p-2 text-text-primary text-xs focus:border-accent-blue focus:outline-none resize-y leading-relaxed ${
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-text-muted font-medium text-[11px] flex items-center gap-1">
                        Assign Task To <span className="text-red-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          list="rec-task-assignee-options"
                          placeholder="Start typing..."
                          value={taskFormFields.assignedTo}
                          onChange={(e) => {
                            setTaskFormFields({
                              ...taskFormFields,
                              assignedTo: e.target.value,
                            });
                            if (e.target.value.trim()) {
                              setTaskFormErrors((prev) => ({
                                ...prev,
                                assignedTo: '',
                              }));
                            }
                          }}
                          className={`w-full bg-[#0b101d] border rounded-md p-2 pr-7 text-text-primary text-xs focus:border-accent-blue focus:outline-none ${
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
                            className="absolute right-2 text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            <X size={13} />
                          </button>
                        )}
                        <datalist id="rec-task-assignee-options">
                          <option value="João Gabriel Barros do Valle Ramos" />
                          <option value="Sabine Metzner" />
                          <option value="Fernanda Lima" />
                          <option value="Marcos Lima dos Santos" />
                          <option value="Current User (UR)" />
                        </datalist>
                      </div>
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
                        onChange={(e) => {
                          setTaskFormFields({
                            ...taskFormFields,
                            priority: e.target.value,
                          });
                          if (e.target.value) {
                            setTaskFormErrors((prev) => ({
                              ...prev,
                              priority: '',
                            }));
                          }
                        }}
                        className={`bg-[#0b101d] border rounded-md p-2 text-xs focus:border-accent-blue focus:outline-none cursor-pointer ${
                          taskFormFields.priority
                            ? 'text-text-primary'
                            : 'text-[#64748b]'
                        } ${
                          taskFormErrors.priority
                            ? 'border-red-500'
                            : 'border-[#1e2640]'
                        }`}
                      >
                        <option value="">Choose any item</option>
                        <option value="High">1-High</option>
                        <option value="Medium">2-Medium</option>
                        <option value="Low">3-Low</option>
                        <option value="Very Low">4-Very Low</option>
                      </select>
                      {taskFormErrors.priority && (
                        <span className="text-red-400 text-[10px]">
                          {taskFormErrors.priority}
                        </span>
                      )}
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
                      className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* Associated Event & Associated Entity Pills */}
                  <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex flex-col gap-1">
                      <span className="text-text-muted font-medium text-[11px]">
                        Associated Event
                      </span>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#28334e] border border-[#38476b] text-white text-[11px] font-semibold">
                          <Paperclip size={11} className="text-[#93c5fd]" />
                          {taskFormFields.associatedEvent}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-text-muted font-medium text-[11px]">
                        Associated Entity
                      </span>
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#28334e] border border-[#38476b] text-white text-[11px] font-semibold">
                          <Paperclip size={11} className="text-[#93c5fd]" />
                          {taskFormFields.associatedEntity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spare Part Ordering Fields vs WO Reference link (Anexo 5) */}
                  {taskFormFields.type === 'Spare Part Ordering' ? (
                    <div className="flex flex-col gap-3 pt-1">
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
                          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
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
                          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
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
                          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
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
                          className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    /* WO Reference row with "Create or link a FR" (Anexo 5) */
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-text-primary font-semibold text-[11px]">
                        WO Reference
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFrDraftOption(taskFormFields.faultReportOption);
                          setFrDraftDirectiveError('');
                          setSubView('new-fr');
                        }}
                        className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline text-xs font-medium cursor-pointer transition-colors"
                      >
                        {taskFormFields.faultReportOption === 'create'
                          ? `FR Draft: ${
                              taskFormFields.directive || 'Create FR'
                            }`
                          : taskFormFields.faultReportOption === 'link' &&
                            taskFormFields.linkedWorkOrderReference
                          ? `Linked: ${taskFormFields.linkedWorkOrderReference}`
                          : 'Create or link a FR'}
                      </button>
                    </div>
                  )}

                  {/* Attachments */}
                  <div className="flex flex-col gap-1.5 pt-1">
                    <span className="text-text-primary font-semibold text-[11px]">
                      Attachments
                    </span>
                    <label className="border border-dashed border-[#2a3654] hover:border-accent-blue rounded-lg bg-[#0b101d]/60 py-7 px-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                      <span className="text-xs text-text-primary font-medium">
                        {taskFormFields.attachedFilename
                          ? `Attached: ${taskFormFields.attachedFilename}`
                          : 'Drop here or click to attach a file'}
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setTaskFormFields({
                              ...taskFormFields,
                              attachedFilename: f.name,
                              attachedFileSize: f.size,
                            });
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Bottom Buttons: Close | Create Task */}
                  <div className="flex items-center justify-end gap-2.5 pt-3">
                    <button
                      type="button"
                      onClick={() => setSubView('list')}
                      className="px-4 py-1.5 rounded-full border border-[#2c3754] hover:border-text-muted text-text-primary text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingNew}
                      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                        taskFormFields.title.trim() &&
                        taskFormFields.description.trim() &&
                        taskFormFields.assignedTo.trim() &&
                        taskFormFields.priority
                          ? 'bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] cursor-pointer shadow'
                          : 'bg-[#334155] text-[#94a3b8] cursor-pointer'
                      }`}
                    >
                      {isSubmittingNew && (
                        <RefreshCw size={12} className="animate-spin" />
                      )}
                      Create Task
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 3: CREATE FAULT REPORT (Anexos 6, 7 & 8)          */}
      {/* ========================================================= */}
      {subView === 'new-fr' && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Header: ← Create Fault Report | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubView('new')}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Back to New Task"
              >
                <ArrowLeft size={15} />
              </button>
              <span className="text-xs font-bold text-text-primary">
                Create Fault Report
              </span>
            </div>
            <button
              type="button"
              onClick={onClosePanel}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 text-xs">
            {/* Radio Options */}
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recPanelFrOption"
                  checked={frDraftOption === 'none'}
                  onChange={() => setFrDraftOption('none')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Do not link Fault Report for now</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recPanelFrOption"
                  checked={frDraftOption === 'create'}
                  onChange={() => setFrDraftOption('create')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Create a Fault Report</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recPanelFrOption"
                  checked={frDraftOption === 'link'}
                  onChange={() => setFrDraftOption('link')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Link existing Fault Report</span>
              </label>
            </div>

            {frDraftOption === 'create' && renderFaultReportFields()}

            {frDraftOption === 'link' && (
              <div className="mt-2 flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-text-muted font-medium text-[11px]">
                  Select Existing Fault Report / Work Order
                </label>
                <select
                  value={taskFormFields.linkedWorkOrderReference}
                  onChange={(e) =>
                    setTaskFormFields({
                      ...taskFormFields,
                      linkedWorkOrderReference: e.target.value,
                    })
                  }
                  className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">Select a Work Order...</option>
                  {(availableWosForEquipment.length > 0
                    ? availableWosForEquipment
                    : workOrders.slice(0, 15)
                  ).map((wo) => (
                    <option key={wo.id} value={wo.reference}>
                      WO #{wo.reference} — {wo.tagNumber} (
                      {wo.directive || wo.description.slice(0, 35)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cancel / Save Buttons (Anexos 6 & 8) */}
            <div className="flex items-center justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setSubView('new')}
                className="px-4 py-1.5 rounded-full border border-[#2c3754] hover:border-text-muted text-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    frDraftOption === 'create' &&
                    !taskFormFields.directive.trim()
                  ) {
                    setFrDraftDirectiveError('Directive is required.');
                    return;
                  }
                  setTaskFormFields({
                    ...taskFormFields,
                    faultReportOption: frDraftOption,
                  });
                  setSubView('new');
                }}
                className="px-4 py-1.5 rounded-full bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] text-xs font-semibold transition-colors cursor-pointer shadow"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 4: TASK DETAILS INSIDE RIGHT PANEL (Anexo 10)     */}
      {/* ========================================================= */}
      {subView === 'detail' && activeTask && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Header: ← | ✎ | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <button
              type="button"
              onClick={() => setSubView('list')}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Back to Tasks list"
            >
              <ArrowLeft size={15} />
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDetailStatusDropdownOpen((prev) => !prev)}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Edit task"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={onClosePanel}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col justify-between">
            <div className="px-5 py-5 flex flex-col gap-3 text-xs">
              <h3 className="text-sm font-bold text-text-primary">
                {activeTask.title}
              </h3>
              <p className="text-xs text-[#94a3b8] leading-relaxed whitespace-pre-line">
                {activeTask.description}
              </p>

              <div className="flex flex-col gap-3 mt-1">
                {/* Assigned task to */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-[#94a3b8]">
                    Assigned task to
                  </span>
                  <span className="col-span-7 text-text-primary font-medium">
                    {activeTask.assignedTo}
                  </span>
                </div>

                {/* Priority */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-[#94a3b8]">Priority</span>
                  <span className="col-span-7 text-text-primary font-medium">
                    {formatPriorityLabel(activeTask.priority)}
                  </span>
                </div>

                {/* Created On */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-[#94a3b8]">Created On</span>
                  <span className="col-span-7 text-text-primary font-mono">
                    {formatCreatedOn(activeTask.createdAt)}
                  </span>
                </div>

                {/* Status */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-[#94a3b8]">Status</span>
                  <div className="col-span-7 relative">
                    <button
                      type="button"
                      onClick={() =>
                        setDetailStatusDropdownOpen((prev) => !prev)
                      }
                      className="inline-flex items-center gap-1.5 hover:bg-[#151d30] px-2 py-1 -ml-2 rounded transition-colors cursor-pointer"
                    >
                      {renderStatusBadge(activeTask.status)}
                      <ChevronDown size={13} className="text-text-muted" />
                    </button>

                    {detailStatusDropdownOpen && (
                      <div className="absolute left-0 top-full mt-1 w-40 bg-[#141c2e] border border-[#263252] rounded-md shadow-2xl py-1 z-50 animate-fadeIn">
                        {['New', 'In Progress', 'Cancelled', 'Completed'].map(
                          (st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() =>
                                handleUpdateTaskStatusById(activeTask.id, st)
                              }
                              className={`w-full px-3 py-1.5 text-left text-xs hover:bg-[#1e2946] flex items-center gap-2 cursor-pointer transition-colors ${
                                activeTask.status === st
                                  ? 'bg-[#1e2946]/60 font-semibold'
                                  : ''
                              }`}
                            >
                              {renderStatusBadge(st)}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Associated Event */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-5 text-[#94a3b8]">
                    Associated Event
                  </span>
                  <div className="col-span-7">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#28334e] border border-[#38476b] text-white text-[11px] font-semibold">
                      {activeTask.associatedEvent || `CDI26-MA${activeTask.id}`}
                    </span>
                  </div>
                </div>

                {/* Type */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-10 text-text-primary font-semibold">
                    Type
                  </span>
                  <span className="col-span-2 text-right text-text-primary font-semibold whitespace-nowrap">
                    {activeTask.type || 'Failure Analysis'}
                  </span>
                </div>

                {/* Tier */}
                <div className="grid grid-cols-12 items-center">
                  <span className="col-span-10 text-text-primary font-semibold">
                    Tier
                  </span>
                  <span className="col-span-2 text-right text-text-primary font-semibold whitespace-nowrap">
                    {getTaskTierLabel(activeTask)}
                  </span>
                </div>

                {/* WO Reference if applicable */}
                {activeTask.type !== 'Spare Part Ordering' && (
                  <div className="grid grid-cols-12 items-center">
                    <span className="col-span-5 text-[#94a3b8]">
                      WO Reference
                    </span>
                    <div className="col-span-7 text-right">
                      {activeTask.workOrderReference ? (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigateToWorkOrder?.(
                              activeTask.workOrderReference!
                            )
                          }
                          className="text-[#60a5fa] hover:underline font-semibold cursor-pointer"
                        >
                          {activeTask.workOrderReference}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setDetailFrOption('none');
                            setDetailLinkedWoRef('');
                            setDetailFrDirectiveError('');
                            setSubView('detail-fr');
                          }}
                          className="text-[#3b82f6] hover:text-[#60a5fa] hover:underline font-medium cursor-pointer"
                        >
                          Create or link a FR
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Attachments */}
              <div className="flex flex-col gap-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-text-primary font-semibold text-xs">
                    Attachments
                  </span>
                  <span className="text-[11px] text-[#64748b]">Upload</span>
                </div>
                <label className="border border-dashed border-[#2a3654] hover:border-accent-blue rounded-lg bg-[#0b101d]/60 py-6 px-4 flex flex-col items-center justify-center cursor-pointer transition-colors text-center">
                  <span className="text-xs text-text-primary font-medium">
                    {activeTask.attachedFilename
                      ? `Attached: ${activeTask.attachedFilename}`
                      : 'Drop here or click to attach a file'}
                  </span>
                  <input type="file" className="hidden" />
                </label>
              </div>
            </div>

            {/* Bottom Accordion Rows: History > | Comments (N) > (Anexo 10) */}
            <div className="border-t border-[#1a2238] divide-y divide-[#1a2238]">
              <button
                type="button"
                onClick={() => setSubView('detail-history')}
                className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-[#141c2f] transition-colors cursor-pointer"
              >
                <span>History</span>
                <ChevronRight size={14} className="text-text-muted" />
              </button>

              <button
                type="button"
                onClick={() => setSubView('detail-comments')}
                className="w-full px-5 py-3 flex items-center justify-between text-xs font-semibold text-text-primary hover:bg-[#141c2f] transition-colors cursor-pointer"
              >
                <span>
                  Comments
                  {parsedTaskComments.length > 0
                    ? ` (${parsedTaskComments.length})`
                    : ''}
                </span>
                <ChevronRight size={14} className="text-text-muted" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 5: TASK HISTORY (Anexo 11)                        */}
      {/* ========================================================= */}
      {subView === 'detail-history' && activeTask && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Top Bar: ← | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <button
              type="button"
              onClick={() => setSubView('detail')}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Back to Task Details"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              type="button"
              onClick={onClosePanel}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sub-header: History */}
          <div className="px-5 py-2.5 border-b border-[#1a2238] shrink-0">
            <span className="text-xs font-bold text-text-primary">History</span>
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="relative pl-5 space-y-5 before:content-[''] before:absolute before:left-[5px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#2a3654]">
              {parsedTaskHistory.map((item, idx) => (
                <div key={idx} className="relative text-xs">
                  <span className="absolute -left-[18px] top-1.5 w-2 h-2 rounded-full bg-[#64748b] ring-4 ring-[#080c16]" />
                  <div className="text-[#94a3b8] font-mono text-[11px]">
                    {item.timestamp}
                  </div>
                  <div className="text-text-primary mt-0.5 leading-relaxed">
                    {item.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 6: TASK COMMENTS                                  */}
      {/* ========================================================= */}
      {subView === 'detail-comments' && activeTask && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Top Bar: ← | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <button
              type="button"
              onClick={() => setSubView('detail')}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Back to Task Details"
            >
              <ArrowLeft size={15} />
            </button>
            <button
              type="button"
              onClick={onClosePanel}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          {/* Sub-header: Comments */}
          <div className="px-5 py-2.5 border-b border-[#1a2238] shrink-0">
            <span className="text-xs font-bold text-text-primary">
              Comments
            </span>
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {parsedTaskComments.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                <Info size={18} className="text-[#94a3b8]" />
                <span className="text-xs font-semibold text-text-primary">
                  No comments yet
                </span>
              </div>
            ) : (
              parsedTaskComments.map((c: any) => (
                <div
                  key={c.id}
                  className="bg-[#0e1424] border border-[#1e2946] rounded-lg p-3 text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">
                        {c.initials || 'ML'}
                      </span>
                      <span className="font-semibold text-text-primary">
                        {c.author}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {c.createdAt}
                    </span>
                  </div>
                  <p className="text-text-primary pl-8 whitespace-pre-line leading-relaxed">
                    {c.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Comment Composer */}
          <div className="p-4 border-t border-[#1a2238] bg-[#0a0f1c]">
            <div className="border border-[#232f4d] rounded-lg bg-[#0d1323] overflow-hidden">
              <div className="flex items-center gap-1 px-2.5 py-1.5 border-b border-[#1a2238] text-text-muted">
                <button
                  type="button"
                  onClick={() => applyCommentFormat('**')}
                  className="p-1 hover:text-text-primary rounded cursor-pointer"
                >
                  <Bold size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyCommentFormat('*')}
                  className="p-1 hover:text-text-primary rounded cursor-pointer"
                >
                  <Italic size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyCommentFormat('__')}
                  className="p-1 hover:text-text-primary rounded cursor-pointer"
                >
                  <Underline size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => applyCommentFormat('\n- ', '')}
                  className="p-1 hover:text-text-primary rounded cursor-pointer"
                >
                  <List size={13} />
                </button>
              </div>
              <textarea
                ref={commentInputRef}
                rows={2}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full bg-transparent px-3 py-2 text-xs text-text-primary focus:outline-none resize-none"
              />
              <div className="flex items-center justify-end px-2.5 py-1.5 border-t border-[#1a2238]">
                <button
                  type="button"
                  disabled={isPostingComment || !commentText.trim()}
                  onClick={handlePostComment}
                  className="p-1.5 text-[#60a5fa] hover:text-white disabled:opacity-40 cursor-pointer"
                >
                  <SendHorizontal size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-VIEW 7: DETAIL FAULT REPORT                            */}
      {/* ========================================================= */}
      {subView === 'detail-fr' && activeTask && (
        <div className="flex-1 flex flex-col h-full overflow-hidden animate-fadeIn">
          {/* Header: ← Create Fault Report | X */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a2238] shrink-0">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSubView('detail')}
                className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
                title="Back to Task Details"
              >
                <ArrowLeft size={15} />
              </button>
              <span className="text-xs font-bold text-text-primary">
                Create Fault Report
              </span>
            </div>
            <button
              type="button"
              onClick={onClosePanel}
              className="text-text-muted hover:text-text-primary p-1 rounded hover:bg-[#151d30] transition-colors cursor-pointer"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 text-xs">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recDetailFrOption"
                  checked={detailFrOption === 'none'}
                  onChange={() => setDetailFrOption('none')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Do not link Fault Report for now</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recDetailFrOption"
                  checked={detailFrOption === 'create'}
                  onChange={() => setDetailFrOption('create')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Create a Fault Report</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-text-primary">
                <input
                  type="radio"
                  name="recDetailFrOption"
                  checked={detailFrOption === 'link'}
                  onChange={() => setDetailFrOption('link')}
                  className="accent-[#60a5fa] w-3.5 h-3.5 cursor-pointer"
                />
                <span>Link existing Fault Report</span>
              </label>
            </div>

            {detailFrOption === 'create' && renderFaultReportFields()}

            {detailFrOption === 'link' && (
              <div className="mt-2 flex flex-col gap-1.5 animate-fadeIn">
                <label className="text-text-muted font-medium text-[11px]">
                  Select Existing Fault Report / Work Order
                </label>
                <select
                  value={detailLinkedWoRef}
                  onChange={(e) => setDetailLinkedWoRef(e.target.value)}
                  className="bg-[#0b101d] border border-[#1e2640] focus:border-accent-blue rounded-md p-2 text-text-primary text-xs focus:outline-none cursor-pointer"
                >
                  <option value="">Select a Work Order...</option>
                  {(availableWosForEquipment.length > 0
                    ? availableWosForEquipment
                    : workOrders.slice(0, 15)
                  ).map((wo) => (
                    <option key={wo.id} value={wo.reference}>
                      WO #{wo.reference} — {wo.tagNumber} (
                      {wo.directive || wo.description.slice(0, 35)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {detailFrDirectiveError && (
              <span className="text-red-400 text-[10px]">
                {detailFrDirectiveError}
              </span>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setSubView('detail')}
                className="px-4 py-1.5 rounded-full border border-[#2c3754] hover:border-text-muted text-text-primary text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSendingToIfs}
                onClick={async () => {
                  if (detailFrOption === 'none') {
                    setSubView('detail');
                    return;
                  }
                  if (
                    detailFrOption === 'create' &&
                    !taskFormFields.directive.trim()
                  ) {
                    setDetailFrDirectiveError('Directive is required.');
                    return;
                  }
                  setIsSendingToIfs(true);
                  try {
                    const res = await fetch('/api/tasks', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        id: activeTask.id,
                        faultReportOption: detailFrOption,
                        linkedWorkOrderReference: detailLinkedWoRef,
                        faultReportFields:
                          detailFrOption === 'create'
                            ? {
                                entryDate: taskFormFields.entryDate,
                                reportedBy: taskFormFields.reportedBy,
                                itemClassId: taskFormFields.itemClassId,
                                actionTakenOnField:
                                  taskFormFields.actionTakenOnField,
                                performedWork: taskFormFields.performedWork,
                                incidentManagement:
                                  taskFormFields.incidentManagement,
                                woSite: taskFormFields.woSite,
                                directive: taskFormFields.directive,
                                maintOrg: taskFormFields.maintOrg,
                                workType: taskFormFields.workType,
                                externalSource: taskFormFields.externalSource,
                                externalSourceId:
                                  taskFormFields.externalSourceId,
                                faultDesc: taskFormFields.faultDesc,
                                symptom: taskFormFields.symptom,
                                discovery: taskFormFields.discovery,
                                actionId: taskFormFields.actionId,
                                operationalStatus:
                                  taskFormFields.operationalStatus,
                              }
                            : undefined,
                      }),
                    });
                    if (res.ok) {
                      await onRefreshAll();
                      setSubView('detail');
                    }
                  } finally {
                    setIsSendingToIfs(false);
                  }
                }}
                className="px-4 py-1.5 rounded-full bg-[#60a5fa] hover:bg-[#3b82f6] text-[#090d16] text-xs font-semibold transition-colors cursor-pointer shadow flex items-center gap-1.5"
              >
                {isSendingToIfs && (
                  <RefreshCw size={12} className="animate-spin" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
