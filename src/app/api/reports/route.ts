import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments, equipmentHistory, analysisReports } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';


function getOverallCondition(vibration: string, lube: string, thermography: string = 'Good'): string {
  const statuses = [vibration, lube, thermography];
  if (statuses.some(s => s.includes('Critical'))) return 'Critical - Tier 1';
  if (statuses.some(s => s.includes('Degraded'))) return 'Degraded - Tier 2';
  if (statuses.some(s => s.includes('Tier 3'))) return 'Good - Tier 3';
  if (statuses.some(s => s.includes('Good'))) return 'Good - Tier 4';
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      equipmentTag,
      analysisType, // 'Vibration' | 'Lube Oil' | 'Thermography'
      vibrationStatus,
      lubeOilStatus,
      thermographyStatus,
      cbmStatus, // Unified status tier (e.g. 'Good - Tier 4', 'Degraded - Tier 2')
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
      imageUrl,
    } = body;

    // Validate required fields
    if (
      !equipmentTag ||
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

    // Use transaction to update equipment, history and save report
    const result = await db.transaction(async (tx) => {
      // Fetch current equipment status
      const eqList = await tx
        .select()
        .from(equipments)
        .where(eq(equipments.tag, equipmentTag));
      
      if (eqList.length === 0) {
        throw new Error('Equipment not found');
      }
      const eqRecord = eqList[0];

      let finalVibrationStatus = eqRecord.vibrationStatus;
      let finalLubeOilStatus = eqRecord.lubeOilStatus;
      let finalThermographyStatus = eqRecord.thermographyStatus || 'Good';

      const statusToApply = cbmStatus || vibrationStatus || lubeOilStatus || thermographyStatus || 'Good - Tier 4';

      if (analysisType === 'Vibration') {
        finalVibrationStatus = statusToApply;
      } else if (analysisType === 'Lube Oil') {
        finalLubeOilStatus = statusToApply;
      } else if (analysisType === 'Thermography') {
        finalThermographyStatus = statusToApply;
      } else {
        if (vibrationStatus) finalVibrationStatus = vibrationStatus;
        if (lubeOilStatus) finalLubeOilStatus = lubeOilStatus;
        if (thermographyStatus) finalThermographyStatus = thermographyStatus;
      }

      const overallCondition = cbmStatus || getOverallCondition(finalVibrationStatus, finalLubeOilStatus, finalThermographyStatus);
      const nowStr = new Date().toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss
      const nowIso = new Date().toISOString();

      // 1. Update equipment active status
      await tx
        .update(equipments)
        .set({
          vibrationStatus: finalVibrationStatus,
          lubeOilStatus: finalLubeOilStatus,
          thermographyStatus: finalThermographyStatus,
          condition: overallCondition,
          lastUpdate: nowStr,
        })
        .where(eq(equipments.tag, equipmentTag));

      // 2. Insert into equipment history
      await tx.insert(equipmentHistory).values({
        equipmentTag,
        vibrationStatus: finalVibrationStatus,
        lubeOilStatus: finalLubeOilStatus,
        thermographyStatus: finalThermographyStatus,
        overallCondition,
        changedAt: nowIso,
      });

      // 3. Insert into analysis reports
      const inserted = await tx
        .insert(analysisReports)
        .values({
          equipmentTag,
          vibrationStatus: finalVibrationStatus,
          lubeOilStatus: finalLubeOilStatus,
          thermographyStatus: finalThermographyStatus,
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
          technology: technology || (analysisType === 'Thermography' ? 'Thermography Analysis' : analysisType === 'Vibration' ? 'Vibration Analysis' : 'Lube Oil Analysis'),
          component: component || null,
          raisedBy,
          raisedDate,
          targetDate: targetDate || null,
          shortDescription,
          woNumber: woNumber || null,
          conditionAssessment,
          longDescription,
          imageUrl: imageUrl || null,
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

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, imageUrl } = body;
    if (!id) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
    }

    const updated = await db
      .update(analysisReports)
      .set({ imageUrl: imageUrl || null })
      .where(eq(analysisReports.id, Number(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Failed to update report image:', error);
    return NextResponse.json({ error: 'Failed to update report image' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
