import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments, equipmentHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

const STATUS_SEVERITY: Record<string, number> = {
  'Machine Off': 0,
  'Good': 1,
  'Degraded': 2,
  'Critical': 3,
};

function getOverallCondition(vibration: string, lube: string): string {
  const vSev = STATUS_SEVERITY[vibration] ?? 1;
  const lSev = STATUS_SEVERITY[lube] ?? 1;
  const maxSev = Math.max(vSev, lSev);
  
  return Object.keys(STATUS_SEVERITY).find(key => STATUS_SEVERITY[key] === maxSev) || 'Good';
}

// GET history for an equipment
export async function GET(request: Request, { params }: { params: { tag: string } }) {
  try {
    const { tag } = params;
    const history = await db
      .select()
      .from(equipmentHistory)
      .where(eq(equipmentHistory.equipmentTag, tag))
      .orderBy(desc(equipmentHistory.changedAt));
      
    return NextResponse.json(history);
  } catch (error) {
    console.error('Failed to fetch history:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

// PUT update statuses
export async function PUT(request: Request, { params }: { params: { tag: string } }) {
  try {
    const { tag } = params;
    const body = await request.json();
    const { 
      vibrationStatus, 
      lubeOilStatus, 
      condition, 
      observation, 
      frequency, 
      vibrationFrequency,
      lubeOilFrequency,
      lastVibrationUpdate,
      lastLubeOilUpdate,
      collectionMethod 
    } = body;
    
    const nowStr = new Date().toLocaleString('en-GB'); // dd/mm/yyyy, hh:mm:ss
    const nowIso = new Date().toISOString();
    
    const updateData: Record<string, string | null> = {};
    if (frequency !== undefined) updateData.frequency = frequency;
    if (vibrationFrequency !== undefined) updateData.vibrationFrequency = vibrationFrequency;
    if (lubeOilFrequency !== undefined) updateData.lubeOilFrequency = lubeOilFrequency;
    if (lastVibrationUpdate !== undefined) updateData.lastVibrationUpdate = lastVibrationUpdate;
    if (lastLubeOilUpdate !== undefined) updateData.lastLubeOilUpdate = lastLubeOilUpdate;
    if (collectionMethod !== undefined) updateData.collectionMethod = collectionMethod;
    
    if (condition !== undefined) {
      // Direct override of condition and observation (supporting tiers)
      const baseCondition = condition ? condition.split(' - ')[0] : 'Good';
      updateData.condition = condition;
      updateData.observation = observation || null;
      updateData.lastUpdate = nowStr;
      updateData.vibrationStatus = baseCondition;
      updateData.lubeOilStatus = baseCondition;
      
      const updated = await db
        .update(equipments)
        .set(updateData)
        .where(eq(equipments.tag, tag))
        .returning();
        
      if (updated.length === 0) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }
      
      // Record history
      await db.insert(equipmentHistory).values({
        equipmentTag: tag,
        vibrationStatus: baseCondition,
        lubeOilStatus: baseCondition,
        overallCondition: baseCondition,
        changedAt: nowIso,
      });
      
      return NextResponse.json(updated[0]);
    } else if (
      frequency !== undefined || 
      vibrationFrequency !== undefined || 
      lubeOilFrequency !== undefined ||
      lastVibrationUpdate !== undefined ||
      lastLubeOilUpdate !== undefined ||
      collectionMethod !== undefined
    ) {
      const updated = await db
        .update(equipments)
        .set(updateData)
        .where(eq(equipments.tag, tag))
        .returning();
        
      if (updated.length === 0) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }
      return NextResponse.json(updated[0]);
    } else {
      // Legacy flow
      if (!vibrationStatus || !lubeOilStatus) {
        return NextResponse.json({ error: 'Missing vibrationStatus or lubeOilStatus' }, { status: 400 });
      }
      
      const overallCondition = getOverallCondition(vibrationStatus, lubeOilStatus);
      
      const updated = await db
        .update(equipments)
        .set({
          vibrationStatus,
          lubeOilStatus,
          condition: overallCondition,
          lastUpdate: nowStr,
        })
        .where(eq(equipments.tag, tag))
        .returning();
        
      if (updated.length === 0) {
        return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
      }
      
      // Record history
      await db.insert(equipmentHistory).values({
        equipmentTag: tag,
        vibrationStatus,
        lubeOilStatus,
        overallCondition,
        changedAt: nowIso,
      });
      
      return NextResponse.json(updated[0]);
    }
  } catch (error) {
    console.error('Failed to update equipment:', error);
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
