import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Support single point or bulk array
    const points: any[] = Array.isArray(body) ? body : [body];

    const created = [];
    for (const point of points) {
      const { routeSessionId, latitude, longitude, accuracy, speed, type, shopId, stayDuration, timestamp } = point;

      if (!routeSessionId || latitude === undefined || longitude === undefined) continue;

      // Verify session exists and is active
      const session = await db.routeSession.findUnique({ where: { id: routeSessionId } });
      if (!session) continue;

      const waypoint = await db.locationWaypoint.create({
        data: {
          routeSessionId,
          latitude: parseFloat(String(latitude)),
          longitude: parseFloat(String(longitude)),
          accuracy: accuracy ? parseFloat(String(accuracy)) : null,
          speed: speed ? parseFloat(String(speed)) : null,
          type: type || 'gps',
          shopId: shopId || null,
          stayDuration: stayDuration || null,
          timestamp: timestamp ? new Date(timestamp) : new Date(),
        },
      });
      created.push(waypoint);

      // If shop_arrive, mark the shop as visited
      if (type === 'shop_arrive' && shopId) {
        await db.routeSession.update({
          where: { id: routeSessionId },
          data: { shopsVisited: { increment: 1 } },
        });
      }
    }

    return NextResponse.json({ count: created.length, waypoints: created });
  } catch (error) {
    console.error('Location tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
