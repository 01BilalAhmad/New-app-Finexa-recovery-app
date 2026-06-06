import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderbookerId, date, totalShops } = body;

    if (!orderbookerId || !date) {
      return NextResponse.json({ error: 'orderbookerId and date are required' }, { status: 400 });
    }

    // End any existing active session for this orderbooker
    const activeSessions = await db.routeSession.findMany({
      where: { orderbookerId, status: 'active' },
    });
    if (activeSessions.length > 0) {
      await db.routeSession.updateMany({
        where: { orderbookerId, status: 'active' },
        data: { status: 'completed', endTime: new Date() },
      });
    }

    // Create new route session
    const session = await db.routeSession.create({
      data: {
        orderbookerId,
        date,
        totalShops: totalShops || 0,
        status: 'active',
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    console.error('Start tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
