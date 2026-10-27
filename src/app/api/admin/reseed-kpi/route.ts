import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments, analysisReports } from '@/db/schema';
import { eq } from 'drizzle-orm';

const reasonsPool = [
  'Process Not Running',
  'Operational Constraints',
  'Awaiting Maintenance',
  'Process Not Running',
  'No Safe Access',
  'Operational Constraints',
  'Not collected',
  'Awaiting Maintenance',
  'Process Not Running',
  'Operational Constraints',
];

const vibMechanisms = [
  'Mechanical Failure - Unbalance',
  'Mechanical Failure - Misalignment',
  'Material Failure - Wear',
  'Material Failure - Cavitation',
  'Mechanical Failure - Looseness',
  'Mechanical Failure - Vibration',
  'Mechanical Failure - Clearance',
  'Material Failure - Fatigue',
];

const oilMechanisms = [
  'Material Failure - Wear',
  'External Influence - Contamination',
  'Material Failure - Overheating',
  'Material Failure - Corrosion',
  'Material Failure - Fatigue',
  'Mechanical Failure - Leakage',
  'External Influence - Blockage/Plugged',
];

export async function GET() {
  try {
    // 1. Enriquecer Equipamentos
    const allEqs = await db.select().from(equipments);
    let nonCollectedCount = 0;
    let surveyedCount = 0;

    for (let index = 0; index < allEqs.length; index++) {
      const e = allEqs[index];
      if (index % 5 === 0) {
        const reason = reasonsPool[(index / 5) % reasonsPool.length];
        const vibReason = index % 2 === 0 ? reason : null;
        const oilReason = index % 3 === 0 ? reason : null;

        await db
          .update(equipments)
          .set({
            nonCollectionReason: reason,
            vibrationNonCollectionReason: vibReason || reason,
            lubeOilNonCollectionReason: oilReason || reason,
          })
          .where(eq(equipments.id, e.id));
        nonCollectedCount++;
      } else {
        await db
          .update(equipments)
          .set({
            nonCollectionReason: null,
            vibrationNonCollectionReason: null,
            lubeOilNonCollectionReason: null,
          })
          .where(eq(equipments.id, e.id));
        surveyedCount++;
      }
    }

    // 2. Enriquecer Relatórios de Análise para meses recentes (2026-10 e 2026-09)
    const allReports = await db.select().from(analysisReports);
    let octCount = 0;

    for (let index = 0; index < allReports.length; index++) {
      const r = allReports[index];
      const isVib = (r.technology || '').toLowerCase().includes('vib');
      const pool = isVib ? vibMechanisms : oilMechanisms;
      const selectedMech = pool[index % pool.length];

      // Distribuir datas para 2026-10, 2026-09, 2026-08, etc.
      let targetMonth = '2026-10';
      if (index % 5 === 1) targetMonth = '2026-09';
      else if (index % 5 === 2) targetMonth = '2026-08';
      else if (index % 5 === 3) targetMonth = '2026-07';
      else if (index % 5 === 4) targetMonth = '2026-06';

      if (targetMonth === '2026-10') octCount++;

      const day = String((index % 27) + 1).padStart(2, '0');
      const newRaisedDate = `${targetMonth}-${day}`;

      await db
        .update(analysisReports)
        .set({
          raisedDate: newRaisedDate,
          failureMechanismSubdivision: selectedMech,
        })
        .where(eq(analysisReports.id, r.id));
    }

    return NextResponse.json({
      success: true,
      equipmentsTotal: allEqs.length,
      surveyed: surveyedCount,
      nonCollected: nonCollectedCount,
      reportsTotal: allReports.length,
      reportsInOctober2026: octCount,
    });
  } catch (error) {
    console.error('Failed to calibrate KPI data:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
