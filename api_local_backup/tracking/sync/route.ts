import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { routeSessionId, waypoints, pendingTransactions } = body;

    if (!routeSessionId) {
      return NextResponse.json({ error: 'routeSessionId is required' }, { status: 400 });
    }

    // Verify session exists
    const session = await db.routeSession.findUnique({ where: { id: routeSessionId } });
    if (!session) {
      return NextResponse.json({ error: 'Route session not found' }, { status: 404 });
    }

    let waypointsSynced = 0;

    // Bulk sync waypoints
    if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
      for (const wp of waypoints) {
        try {
          await db.locationWaypoint.create({
            data: {
              routeSessionId,
              latitude: parseFloat(String(wp.latitude)),
              longitude: parseFloat(String(wp.longitude)),
              accuracy: wp.accuracy ? parseFloat(String(wp.accuracy)) : null,
              speed: wp.speed ? parseFloat(String(wp.speed)) : null,
              type: wp.type || 'gps',
              shopId: wp.shopId || null,
              stayDuration: wp.stayDuration || null,
              timestamp: wp.timestamp ? new Date(wp.timestamp) : new Date(),
              synced: true,
            },
          });
          waypointsSynced++;
        } catch (err) {
          console.error('Failed to sync waypoint:', err);
        }
      }

      // Update shops visited count
      const shopsVisited = await db.locationWaypoint.count({
        where: { routeSessionId, type: 'shop_arrive' },
      });
      await db.routeSession.update({
        where: { id: routeSessionId },
        data: { shopsVisited },
      });
    }

    // Sync pending transactions
    let transactionsSynced = 0;
    if (pendingTransactions && Array.isArray(pendingTransactions) && pendingTransactions.length > 0) {
      for (const tx of pendingTransactions) {
        try {
          // Check if already exists (by date + shopId + amount + type)
          const existing = await db.transaction.findFirst({
            where: {
              shopId: tx.shopId,
              createdBy: tx.createdBy,
              amount: tx.amount,
              type: tx.type,
              date: tx.date,
            },
          });
          if (!existing) {
            await db.transaction.create({ data: tx });
            transactionsSynced++;
          }
        } catch (err) {
          console.error('Failed to sync transaction:', err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      waypointsSynced,
      transactionsSynced,
    });
  } catch (error) {
    console.error('Sync tracking error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
