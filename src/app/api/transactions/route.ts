import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createdBy = searchParams.get('createdBy');
    const shopId = searchParams.get('shopId');
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const startDate = searchParams.get('startDate');
    const limit = searchParams.get('limit');

    const where: any = {};

    if (createdBy) {
      where.createdBy = createdBy;
    }

    if (shopId) {
      where.shopId = shopId;
    }

    if (type) {
      where.type = type;
    }

    if (date) {
      where.date = date;
    }

    if (startDate) {
      where.date = { gte: startDate };
    }

    const take = limit ? parseInt(limit, 10) : undefined;

    const transactions = await db.transaction.findMany({
      where,
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            ownerName: true,
            phone: true,
            area: true,
            balance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      ...(take ? { take } : {}),
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
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
      shopId,
      type,
      amount,
      createdBy,
      description,
      date,
      gpsLat,
      gpsLng,
      gpsAddress,
      approved,
    } = body;

    if (!shopId || !amount || !createdBy || !date) {
      return NextResponse.json(
        { error: 'shopId, amount, createdBy, and date are required' },
        { status: 400 }
      );
    }

    // Get the current shop to update balance
    const shop = await db.shop.findUnique({
      where: { id: shopId },
    });

    if (!shop) {
      return NextResponse.json(
        { error: 'Shop not found' },
        { status: 404 }
      );
    }

    // Update shop balance based on transaction type
    let newBalance = shop.balance;
    if (type === 'recovery') {
      newBalance = shop.balance - amount;
    } else if (type === 'credit') {
      newBalance = shop.balance + amount;
    }

    // Create transaction and update shop balance in a transaction
    const transaction = await db.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          shopId,
          type: type || 'recovery',
          amount,
          createdBy,
          description: description || '',
          date,
          gpsLat: gpsLat ?? null,
          gpsLng: gpsLng ?? null,
          gpsAddress: gpsAddress ?? null,
          approved: approved ?? false,
        },
        include: {
          shop: {
            select: {
              id: true,
              name: true,
              ownerName: true,
              phone: true,
              area: true,
              balance: true,
            },
          },
        },
      });

      await tx.shop.update({
        where: { id: shopId },
        data: { balance: newBalance },
      });

      return newTransaction;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
