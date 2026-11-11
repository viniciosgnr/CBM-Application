import { NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, workOrders, analysisReports, equipments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET all tasks
export async function GET() {
  try {
    const allTasks = await db
      .select()
      .from(tasks)
      .orderBy(desc(tasks.id));
    return NextResponse.json(allTasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST create task (with optional integrated Fault Report / Work Order creation)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reportId,
      equipmentTag,
      type = 'Corrective Maintenance',
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      associatedEvent,
      associatedEntity,
      faultReportOption = 'none', // 'none' | 'create' | 'link'
      linkedWorkOrderReference,
      faultReportFields,
      attachedFilename,
      attachedFileSize,
      sparePartNumber,
      purchaseOrderRef,
      quantity,
      unitOfQuantity,
    } = body;

    if (!title || !description || !assignedTo || !priority) {
      return NextResponse.json({ error: 'Missing required task fields' }, { status: 400 });
    }

    const result = db.transaction((tx) => {
      // 1. Fetch analysis report if provided
      let report: typeof analysisReports.$inferSelect | undefined;
      if (reportId) {
        const found = tx
          .select()
          .from(analysisReports)
          .where(eq(analysisReports.id, Number(reportId)))
          .all();
        report = found[0];
      }

      // 2. Fetch equipment
      const tagToSearch = equipmentTag || report?.equipmentTag || '';
      let equipment: typeof equipments.$inferSelect | undefined;
      if (tagToSearch) {
        const foundEq = tx
          .select()
          .from(equipments)
          .where(eq(equipments.tag, tagToSearch))
          .all();
        equipment = foundEq[0];
      }

      // 3. Generate unique Task Reference: TSK-1001, TSK-1002, ...
      const existingTasks = tx
        .select({ ref: tasks.taskReference })
        .from(tasks)
        .all();
      let nextTaskNum = 1001;
      if (existingTasks.length > 0) {
        const nums = existingTasks
          .map((t) => {
            const m = t.ref.match(/TSK-(\d+)/);
            return m ? parseInt(m[1], 10) : 0;
          })
          .filter((n) => !isNaN(n));
        if (nums.length > 0) {
          nextTaskNum = Math.max(...nums) + 1;
        }
      }
      const taskRef = `TSK-${nextTaskNum}`;

      let createdWorkOrderId: number | null = null;
      let createdWorkOrderRef: string | null = null;

      // 4. Handle Fault Report creation if selected
      if (faultReportOption === 'create' && faultReportFields) {
        const {
          entryDate,
          reportedBy,
          itemClassId,
          actionTakenOnField,
          performedWork,
          incidentManagement,
          woSite,
          directive,
          maintOrg,
          workType = 'CM',
          externalSource,
          externalSourceId,
          faultDesc,
          symptom,
          discovery = '04',
          actionId = '6',
          operationalStatus = '01',
        } = faultReportFields;

        if (!directive || !woSite || !maintOrg) {
          throw new Error('Directive, WO Site and Maintenance Organization are required for Fault Report creation.');
        }

        const allWos = tx.select({ reference: workOrders.reference }).from(workOrders).all();
        let nextRef = '801021315';
        if (allWos.length > 0) {
          const refs = allWos.map((w) => parseInt(w.reference, 10)).filter((num) => !isNaN(num));
          if (refs.length > 0) {
            nextRef = String(Math.max(...refs) + 1);
          }
        }

        const nowStr = entryDate || new Date().toLocaleString('en-GB');
        const tagDesc = equipment ? equipment.name : (report?.component || 'Equipment');
        const monitoringTech = report?.technology ? `CBM ${report.technology}` : 'CBM Analysis';
        const summaryDescription = `${directive} - ${(faultDesc || description || '').split('\n')[0]}`;

        const insertedWo = tx
          .insert(workOrders)
          .values({
            reference: nextRef,
            fpso: equipment ? equipment.fpso : (woSite || 'UNY'),
            description: summaryDescription,
            priority: priority === 'High' || priority === 'Critical' ? 'Accepted' : 'Pending',
            status: 'Open',
            tagNumber: tagToSearch,
            tagDescription: tagDesc,
            monitoringTechnique: monitoringTech,
            creationDate: nowStr,
            dueDate: dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            reportId: reportId ? Number(reportId) : null,
            entryDate: nowStr,
            reportedBy: reportedBy || report?.raisedBy || 'Maintenance Engineer',
            itemClassId: itemClassId || equipment?.class || 'PUCE',
            actionTakenOnField: actionTakenOnField ? 1 : 0,
            performedWork: performedWork || null,
            incidentManagement: incidentManagement || null,
            woSite: woSite || equipment?.fpso || 'UNY',
            directive: directive.toUpperCase(),
            maintOrg: maintOrg || 'MECHTS',
            workType: workType || 'CM',
            externalSource: externalSource || 'CBM-VIB/M',
            externalSourceId: externalSourceId || `EVT-${reportId || nextTaskNum}`,
            faultDesc: faultDesc || description,
            symptom: symptom || 'VIB',
            discovery: discovery || '04',
            actionId: actionId || '6',
            operationalStatus: operationalStatus || '01',
            attachedFilename: attachedFilename || null,
            attachedFileSize: attachedFileSize || null,
          })
          .returning()
          .all();

        createdWorkOrderId = insertedWo[0].id;
        createdWorkOrderRef = insertedWo[0].reference;
      } else if (faultReportOption === 'link' && linkedWorkOrderReference) {
        createdWorkOrderRef = linkedWorkOrderReference;
        const linkedWo = tx
          .select({ id: workOrders.id })
          .from(workOrders)
          .where(eq(workOrders.reference, linkedWorkOrderReference))
          .all();
        if (linkedWo.length > 0) {
          createdWorkOrderId = linkedWo[0].id;
        }
      }

      // 5. Insert Task (initial status 'New')
      const now = new Date();
      const nowIso = now.toISOString();
      const nowFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      const creatorName = faultReportFields?.reportedBy || report?.raisedBy || 'Marcos Lima dos Santos';
      const initialHistory = JSON.stringify([
        {
          timestamp: nowFormatted,
          message: `${creatorName} created task`,
        },
      ]);

      const insertedTask = tx
        .insert(tasks)
        .values({
          taskReference: taskRef,
          reportId: reportId ? Number(reportId) : null,
          equipmentTag: tagToSearch,
          type: type || 'Corrective Maintenance',
          title: title.trim(),
          description: description.trim(),
          assignedTo: assignedTo.trim(),
          priority,
          dueDate: dueDate || '',
          associatedEvent: associatedEvent || (reportId ? `CDI26-MA${reportId}` : `CDI26-MA${nextTaskNum}`),
          associatedEntity: associatedEntity || tagToSearch,
          faultReportOption,
          workOrderId: createdWorkOrderId,
          workOrderReference: createdWorkOrderRef,
          attachedFilename: attachedFilename || null,
          attachedFileSize: attachedFileSize || null,
          sparePartNumber: sparePartNumber || null,
          purchaseOrderRef: purchaseOrderRef || null,
          quantity: quantity || null,
          unitOfQuantity: unitOfQuantity || null,
          status: 'New',
          historyJson: initialHistory,
          commentsJson: '[]',
          createdAt: nowIso,
        })
        .returning()
        .all();

      // 6. Update Report linking if reportId exists
      if (reportId && report) {
        const updateData: Record<string, unknown> = {
          taskId: insertedTask[0].id,
          taskNumber: taskRef,
        };
        if (createdWorkOrderRef) {
          updateData.woNumber = createdWorkOrderRef;
          const isGood = (report.overallCondition || '').includes('Good');
          updateData.cbmCaseStatus = isGood ? 'Closed' : 'Awaiting Action';
        }
        tx.update(analysisReports)
          .set(updateData)
          .where(eq(analysisReports.id, Number(reportId)))
          .run();
      }

      return {
        task: insertedTask[0],
        workOrderReference: createdWorkOrderRef,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// PUT update task (status, attachments, or deferred Fault Report creation/linking via 'Send to IFS')
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      status,
      attachedFilename,
      attachedFileSize,
      faultReportOption,
      linkedWorkOrderReference,
      faultReportFields,
      newComment,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });
    }

    const result = db.transaction((tx) => {
      const existingList = tx
        .select()
        .from(tasks)
        .where(eq(tasks.id, Number(id)))
        .all();

      if (existingList.length === 0) {
        throw new Error('Task not found');
      }
      const currentTask = existingList[0];

      let report: typeof analysisReports.$inferSelect | undefined;
      if (currentTask.reportId) {
        const found = tx
          .select()
          .from(analysisReports)
          .where(eq(analysisReports.id, Number(currentTask.reportId)))
          .all();
        report = found[0];
      }

      const tagToSearch = currentTask.equipmentTag || report?.equipmentTag || '';
      let equipment: typeof equipments.$inferSelect | undefined;
      if (tagToSearch) {
        const foundEq = tx
          .select()
          .from(equipments)
          .where(eq(equipments.tag, tagToSearch))
          .all();
        equipment = foundEq[0];
      }

      const now = new Date();
      const nowFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const updateFields: Record<string, unknown> = {};
      if (status) {
        updateFields.status = status;
        if (status !== currentTask.status) {
          let parsedHistory: Array<{ timestamp: string; message: string }> = [];
          try {
            parsedHistory = currentTask.historyJson ? JSON.parse(currentTask.historyJson) : [];
          } catch {
            parsedHistory = [];
          }
          parsedHistory.unshift({
            timestamp: nowFormatted,
            message: `Marcos Lima dos Santos modified status from '${currentTask.status}' to '${status}'`,
          });
          updateFields.historyJson = JSON.stringify(parsedHistory);
        }
      }
      if (newComment && typeof newComment.text === 'string' && newComment.text.trim()) {
        let parsedComments: Array<Record<string, unknown>> = [];
        try {
          parsedComments = currentTask.commentsJson ? JSON.parse(currentTask.commentsJson) : [];
        } catch {
          parsedComments = [];
        }
        parsedComments.push({
          id: Date.now(),
          author: newComment.author || 'Marcos Lima dos Santos',
          initials: newComment.initials || 'ML',
          timestamp: nowFormatted,
          text: newComment.text.trim(),
          attachmentName: newComment.attachmentName || null,
        });
        updateFields.commentsJson = JSON.stringify(parsedComments);
      }
      if (attachedFilename !== undefined) {
        updateFields.attachedFilename = attachedFilename;
      }
      if (attachedFileSize !== undefined) {
        updateFields.attachedFileSize = attachedFileSize;
      }

      let createdWorkOrderRef = currentTask.workOrderReference;
      let createdWorkOrderId = currentTask.workOrderId;

      if (faultReportOption === 'create' && faultReportFields) {
        const {
          entryDate,
          reportedBy,
          itemClassId,
          actionTakenOnField,
          performedWork,
          incidentManagement,
          woSite,
          directive,
          maintOrg,
          workType = 'CM',
          externalSource,
          externalSourceId,
          faultDesc,
          symptom,
          discovery = '04',
          actionId = '6',
          operationalStatus = '01',
        } = faultReportFields;

        if (!directive || !woSite || !maintOrg) {
          throw new Error('Directive, WO Site and Maintenance Organization are required for Fault Report creation.');
        }

        const allWos = tx.select({ reference: workOrders.reference }).from(workOrders).all();
        let nextRef = '801021315';
        if (allWos.length > 0) {
          const refs = allWos.map((w) => parseInt(w.reference, 10)).filter((num) => !isNaN(num));
          if (refs.length > 0) {
            nextRef = String(Math.max(...refs) + 1);
          }
        }

        const nowStr = entryDate || new Date().toLocaleString('en-GB');
        const tagDesc = equipment ? equipment.name : (report?.component || 'Equipment');
        const monitoringTech = report?.technology ? `CBM ${report.technology}` : 'CBM Analysis';
        const summaryDescription = `${directive} - ${(faultDesc || currentTask.description || '').split('\n')[0]}`;

        const insertedWo = tx
          .insert(workOrders)
          .values({
            reference: nextRef,
            fpso: equipment ? equipment.fpso : (woSite || 'UNY'),
            description: summaryDescription,
            priority: currentTask.priority === 'High' ? 'Accepted' : 'Pending',
            status: 'Open',
            tagNumber: faultReportFields.equipmentTag || tagToSearch,
            tagDescription: tagDesc,
            monitoringTechnique: monitoringTech,
            creationDate: nowStr,
            dueDate: currentTask.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            reportId: currentTask.reportId ? Number(currentTask.reportId) : null,
            entryDate: nowStr,
            reportedBy: reportedBy || report?.raisedBy || 'Maintenance Engineer',
            itemClassId: itemClassId || equipment?.class || 'PUCE',
            actionTakenOnField: actionTakenOnField ? 1 : 0,
            performedWork: performedWork || null,
            incidentManagement: incidentManagement || null,
            woSite: woSite || equipment?.fpso || 'UNY',
            directive: directive.toUpperCase(),
            maintOrg: maintOrg || 'MECHTS',
            workType: workType || 'CM',
            externalSource: externalSource || 'CBM-VIB/M',
            externalSourceId: externalSourceId || currentTask.associatedEvent || `EVT-${currentTask.id}`,
            faultDesc: faultDesc || currentTask.description,
            symptom: symptom || 'VIB',
            discovery: discovery || '04',
            actionId: actionId || '6',
            operationalStatus: operationalStatus || '01',
            attachedFilename: currentTask.attachedFilename || null,
            attachedFileSize: currentTask.attachedFileSize || null,
          })
          .returning()
          .all();

        createdWorkOrderId = insertedWo[0].id;
        createdWorkOrderRef = insertedWo[0].reference;
        updateFields.faultReportOption = 'create';
        updateFields.workOrderId = createdWorkOrderId;
        updateFields.workOrderReference = createdWorkOrderRef;
      } else if (faultReportOption === 'link' && linkedWorkOrderReference) {
        createdWorkOrderRef = linkedWorkOrderReference;
        const linkedWo = tx
          .select({ id: workOrders.id })
          .from(workOrders)
          .where(eq(workOrders.reference, linkedWorkOrderReference))
          .all();
        if (linkedWo.length > 0) {
          createdWorkOrderId = linkedWo[0].id;
        }
        updateFields.faultReportOption = 'link';
        updateFields.workOrderId = createdWorkOrderId;
        updateFields.workOrderReference = createdWorkOrderRef;
      }

      const updatedTask = tx
        .update(tasks)
        .set(updateFields)
        .where(eq(tasks.id, Number(id)))
        .returning()
        .all();

      if (currentTask.reportId && report && createdWorkOrderRef) {
        const isGood = (report.overallCondition || '').includes('Good');
        tx.update(analysisReports)
          .set({
            woNumber: createdWorkOrderRef,
            cbmCaseStatus: isGood ? 'Closed' : 'Awaiting Action',
          })
          .where(eq(analysisReports.id, Number(currentTask.reportId)))
          .run();
      }

      return {
        task: updatedTask[0],
        workOrderReference: createdWorkOrderRef,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update task:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
