import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments, equipmentHistory, analysisReports } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';


function getOverallCondition(vibration: string, lube: string): string {
  const statuses = [vibration, lube];
  if (statuses.includes('Critical')) return 'Critical';
  if (statuses.includes('Degraded')) return 'Degraded';
  if (statuses.includes('Good')) return 'Good';
  return 'Machine Off';
}

// GET all reports
export async function GET() {
  try {
    const reports = await db
      .select()
      .from(analysisReports)
      .orderBy(desc(analysisReports.createdAt));
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Failed to fetch reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}

// POST create report
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      equipmentTag,
      vibrationStatus,
      lubeOilStatus,
      facility,
      system,
      tagNumber,
      cmmsNumber,
      cof,
      location,
      machineName,
      mcProtection,
      operatingContext,
      technology,
      component,
      raisedBy,
      raisedDate,
      targetDate,
      shortDescription,
      woNumber,
      conditionAssessment,
      longDescription,
    } = body;

    // Validate required fields
    if (
      !equipmentTag ||
      !vibrationStatus ||
      !lubeOilStatus ||
      !facility ||
      !system ||
      !tagNumber ||
      !raisedBy ||
      !raisedDate ||
      !shortDescription ||
      !conditionAssessment ||
      !longDescription
    ) {
      return NextResponse.json({ error: 'Missing required report fields' }, { status: 400 });
    }

    const overallCondition = getOverallCondition(vibrationStatus, lubeOilStatus);
    const nowStr = new Date().toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss
    const nowIso = new Date().toISOString();

    // Use transaction to update equipment, history and save report
    const result = await db.transaction(async (tx) => {
      // 1. Update equipment active status
      await tx
        .update(equipments)
        .set({
          vibrationStatus,
          lubeOilStatus,
          condition: overallCondition,
          lastUpdate: nowStr,
        })
        .where(eq(equipments.tag, equipmentTag));

      // 2. Insert into equipment history
      await tx.insert(equipmentHistory).values({
        equipmentTag,
        vibrationStatus,
        lubeOilStatus,
        overallCondition,
        changedAt: nowIso,
      });

      // 3. Insert into analysis reports
      const inserted = await tx
        .insert(analysisReports)
        .values({
          equipmentTag,
          vibrationStatus,
          lubeOilStatus,
          overallCondition,
          facility,
          system,
          tagNumber,
          cmmsNumber: cmmsNumber || null,
          cof: cof || null,
          location: location || null,
          machineName: machineName || null,
          mcProtection: mcProtection || null,
          operatingContext: operatingContext || null,
          technology: technology || null,
          component: component || null,
          raisedBy,
          raisedDate,
          targetDate: targetDate || null,
          shortDescription,
          woNumber: woNumber || null,
          conditionAssessment,
          longDescription,
          createdAt: nowIso,
        })
        .returning();

      return inserted[0];
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
