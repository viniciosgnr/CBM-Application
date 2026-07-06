import { NextResponse } from 'next/server';
import { db } from '@/db';
import { workOrders, analysisReports, equipments } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

// GET all work orders
export async function GET() {
  try {
    const wos = await db
      .select()
      .from(workOrders)
      .orderBy(desc(workOrders.reference));
    return NextResponse.json(wos);
  } catch (error) {
    console.error('Failed to fetch work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

// POST create work order
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reportId,
      woSite,
      directive,
      maintOrg,
      workType,
      externalSource,
      externalSourceId,
      faultDesc,
      symptom,
      discovery,
      actionId,
      operationalStatus,
      attachedFilename,
      attachedFileSize,
    } = body;

    // Validate required fields
    if (
      !reportId ||
      !woSite ||
      !directive ||
      !maintOrg ||
      !workType ||
      !externalSource ||
      !externalSourceId ||
      !faultDesc ||
      !symptom ||
      !discovery ||
      !actionId ||
      !operationalStatus
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Run transaction
    const result = await db.transaction(async (tx) => {
      // 1. Fetch corresponding analysis report
      const reports = await tx
        .select()
        .from(analysisReports)
        .where(eq(analysisReports.id, Number(reportId)));
      
      if (reports.length === 0) {
        throw new Error(`Analysis report with ID ${reportId} not found`);
      }
      const report = reports[0];

      // 2. Fetch corresponding equipment (for fpso/details)
      const equs = await tx
        .select()
        .from(equipments)
        .where(eq(equipments.tag, report.equipmentTag));
      const equipment = equs[0];

      // 3. Generate unique 9-digit WO Reference
      const allWos = await tx.select({ reference: workOrders.reference }).from(workOrders);
      let nextRef = '801021315';
      if (allWos.length > 0) {
        const refs = allWos.map((w) => parseInt(w.reference, 10)).filter((num) => !isNaN(num));
        if (refs.length > 0) {
          nextRef = String(Math.max(...refs) + 1);
        }
      }

      const nowStr = new Date().toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss
      const targetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleString('en-GB');

      const tagDesc = equipment ? equipment.name : (report.component || 'Equipment');
      const monitoringTech = report.technology ? `CBM ${report.technology}` : 'CBM Analysis';
      
      // Detailed description combining directive and short fault desc
      const summaryDescription = `${directive} - ${faultDesc.split('\n')[0]}`;

      // 4. Create new Work Order
      const inserted = await tx
        .insert(workOrders)
        .values({
          reference: nextRef,
          fpso: equipment ? equipment.fpso : 'UNY',
          description: summaryDescription,
          priority: 'Accepted', // Default priority
          status: 'Observed', // Starts as 'Observed' once created by supervisor review
          tagNumber: report.equipmentTag,
          tagDescription: tagDesc,
          monitoringTechnique: monitoringTech,
          creationDate: nowStr,
          dueDate: targetDate,
          reportId: Number(reportId),
          woSite,
          directive,
          maintOrg,
          workType,
          externalSource,
          externalSourceId,
          faultDesc,
          symptom,
          discovery,
          actionId,
          operationalStatus,
          attachedFilename: attachedFilename || null,
          attachedFileSize: attachedFileSize || null,
        })
        .returning();

      // 5. Update analysis report's woNumber field to point to this new WO Reference
      await tx
        .update(analysisReports)
        .set({ woNumber: nextRef })
        .where(eq(analysisReports.id, Number(reportId)));

      return inserted[0];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create work order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create work order';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
