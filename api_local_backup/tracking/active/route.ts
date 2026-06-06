import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderbookerId = searchParams.get('orderbookerId');

    if (!orderbookerId) {
      return NextResponse.json({ error: 'orderbookerId is required' }, { status: 400 });
    }

    // Get the active route session for this orderbooker
    const activeSession = await db.routeSession.findFirst({
      where: { orderbookerId, status: 'active' },
      include: {
        waypoints: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return NextResponse.json(activeSession || null);
  } catch (error) {
    console.error('Get active tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get route session history for a date
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderbookerId, date } = body;

    if (!orderbookerId) {
      return NextResponse.json({ error: 'orderbookerId is required' }, { status: 400 });
    }

    const where: any = { orderbookerId };
    if (date) where.date = date;

    const sessions = await db.routeSession.findMany({
      where,
      include: {
        waypoints: {
          orderBy: { timestamp: 'asc' },
        },
      },
      orderBy: { startTime: 'desc' },
      take: 30,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Get tracking history error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
