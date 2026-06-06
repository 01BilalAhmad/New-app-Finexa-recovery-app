import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const shop = await db.shop.findUnique({
      where: { id },
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

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Get shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingShop = await db.shop.findUnique({
      where: { id },
    });

    if (!existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.ownerName !== undefined) updateData.ownerName = body.ownerName;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.area !== undefined) updateData.area = body.area;
    if (body.address !== undefined) updateData.address = body.address;
    if (body.balance !== undefined) updateData.balance = body.balance;
    if (body.creditLimit !== undefined) updateData.creditLimit = body.creditLimit;
    if (body.latitude !== undefined) updateData.latitude = body.latitude;
    if (body.longitude !== undefined) updateData.longitude = body.longitude;
    if (body.routeDay !== undefined) updateData.routeDay = body.routeDay;
    if (body.orderbookerId !== undefined) updateData.orderbookerId = body.orderbookerId;
    if (body.visited !== undefined) updateData.visited = body.visited;
    if (body.lastVisitDate !== undefined) updateData.lastVisitDate = body.lastVisitDate;

    const shop = await db.shop.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Update shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existingShop = await db.shop.findUnique({
      where: { id },
    });

    if (!existingShop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    await db.shop.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
