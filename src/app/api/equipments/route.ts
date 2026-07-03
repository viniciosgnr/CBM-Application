import { NextResponse } from 'next/server';
import { db } from '@/db';
import { equipments } from '@/db/schema';

export async function GET() {
  try {
    const allEquipments = await db.select().from(equipments);
    return NextResponse.json(allEquipments);
  } catch (error) {
    console.error('Failed to fetch equipments:', error);
    return NextResponse.json({ error: 'Failed to fetch equipments' }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
