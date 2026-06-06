import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeSessionId, totalDistance } = body;

    if (!routeSessionId) {
      return NextResponse.json({ error: 'routeSessionId is required' }, { status: 400 });
    }

    const session = await db.routeSession.findUnique({ where: { id: routeSessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Route session not found' }, { status: 404 });
    }

    // Calculate total distance from waypoints if not provided
    let calculatedDistance = totalDistance || 0;
    if (!calculatedDistance) {
      const waypoints = await db.locationWaypoint.findMany({
        where: { routeSessionId, type: { in: ['gps', 'route_point'] } },
        orderBy: { timestamp: 'asc' },
      });
      for (let i = 1; i < waypoints.length; i++) {
        calculatedDistance += haversine(
          waypoints[i - 1].latitude, waypoints[i - 1].longitude,
          waypoints[i].latitude, waypoints[i].longitude
        );
      }
    }

    // Calculate shops visited
    const shopsVisited = await db.locationWaypoint.count({
      where: { routeSessionId, type: 'shop_arrive' },
    });

    const updated = await db.routeSession.update({
      where: { id: routeSessionId },
      data: {
        status: 'completed',
        endTime: new Date(),
        totalDistance: calculatedDistance,
        shopsVisited,
      },
      include: { waypoints: { orderBy: { timestamp: 'asc' } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('End tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
