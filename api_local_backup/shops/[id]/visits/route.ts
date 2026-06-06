import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const visits = await db.shopVisit.findMany({
      where: { shopId: id },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return NextResponse.json(visits);
  } catch (error) {
    console.error('Get shop visits error:', error);
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
    const { userId, gpsLat, gpsLng, gpsAddress, visitDate } = body;

    if (!userId || !visitDate) {
      return NextResponse.json({ error: 'userId and visitDate are required' }, { status: 400 });
    }

    const visit = await db.shopVisit.create({
      data: {
        shopId: id,
        userId,
        gpsLat: gpsLat ?? null,
        gpsLng: gpsLng ?? null,
        gpsAddress: gpsAddress ?? null,
        visitDate,
      },
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(visit, { status: 201 });
  } catch (error) {
    console.error('Create shop visit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
