import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderbookerId = searchParams.get('orderbookerId');
    const routeDay = searchParams.get('routeDay');

    const where: any = {};

    if (orderbookerId) {
      where.orderbookerId = orderbookerId;
    }

    if (routeDay) {
      where.routeDay = routeDay;
    }

    const shops = await db.shop.findMany({
      where,
      include: {
        orderbooker: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error('Get shops error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      ownerName,
      phone,
      area,
      address,
      balance,
      creditLimit,
      latitude,
      longitude,
      routeDay,
      orderbookerId,
      visited,
      lastVisitDate,
    } = body;

    if (!name || !orderbookerId) {
      return NextResponse.json(
        { error: 'Name and orderbookerId are required' },
        { status: 400 }
      );
    }

    const shop = await db.shop.create({
      data: {
        name,
        ownerName: ownerName || '',
        phone: phone || '',
        area: area || '',
        address: address || '',
        balance: balance ?? 0,
        creditLimit: creditLimit ?? 0,
        latitude: latitude ?? 31.5204,
        longitude: longitude ?? 74.3587,
        routeDay: routeDay || 'monday',
        orderbookerId,
        visited: visited ?? false,
        lastVisitDate: lastVisitDate || '',
      },
      include: {
        orderbooker: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error('Create shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
