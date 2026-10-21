import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments, equipmentHistory } from '@/db/schema';
import { inArray } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags) || tags.length === 0) {
      return NextResponse.json({ error: 'Nenhuma tag de equipamento fornecida' }, { status: 400 });
    }

    const nowStr = new Date().toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss
    const nowIso = new Date().toISOString();

    // Atualiza todos os equipamentos selecionados para a data atual mantendo Good - Tier 4
    await db
      .update(equipments)
      .set({
        lastUpdate: nowStr,
        lastVibrationUpdate: nowStr,
        lastLubeOilUpdate: nowStr,
        vibrationStatus: 'Good - Tier 4',
        lubeOilStatus: 'Good - Tier 4',
        condition: 'Good - Tier 4',
        nonCollectionReason: null,
        vibrationNonCollectionReason: null,
        lubeOilNonCollectionReason: null,
      })
      .where(inArray(equipments.tag, tags));

    // Insere registros no histórico para auditoria
    const historyEntries = tags.map((tag) => ({
      equipmentTag: tag,
      vibrationStatus: 'Good - Tier 4',
      lubeOilStatus: 'Good - Tier 4',
      thermographyStatus: 'Good',
      overallCondition: 'Good - Tier 4',
      changedAt: nowIso,
    }));

    await db.insert(equipmentHistory).values(historyEntries);

    return NextResponse.json({
      success: true,
      updatedCount: tags.length,
      updatedDate: nowStr,
    });
  } catch (error) {
    console.error('Failed to perform bulk update:', error);
    return NextResponse.json({ error: 'Falha ao realizar atualização em batelada' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
