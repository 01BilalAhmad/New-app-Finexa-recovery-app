import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const target = await db.dailyTarget.findUnique({
      where: { orderbookerId_month: { orderbookerId: id, month } },
    });

    if (!target) {
      return NextResponse.json({ target: 0, month });
    }

    return NextResponse.json(target);
  } catch (error) {
    console.error('Get daily target error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { target } = body;

    if (target === undefined || target === null) {
      return NextResponse.json({ error: 'Target is required' }, { status: 400 });
    }

    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const dailyTarget = await db.dailyTarget.upsert({
      where: { orderbookerId_month: { orderbookerId: id, month } },
      update: { target: parseFloat(String(target)) },
      create: {
        orderbookerId: id,
        target: parseFloat(String(target)),
        month,
      },
    });

    return NextResponse.json(dailyTarget);
  } catch (error) {
    console.error('Set daily target error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
