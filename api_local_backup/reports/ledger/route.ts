import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shopId');

    if (!shopId) {
      return NextResponse.json(
        { error: 'shopId query parameter is required' },
        { status: 400 }
      );
    }

    const shop = await db.shop.findUnique({
      where: { id: shopId },
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

    const transactions = await db.transaction.findMany({
      where: { shopId },
      orderBy: {
        date: 'asc',
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

    // Calculate summary
    let totalDebit = 0;
    let totalCredit = 0;

    for (const txn of transactions) {
      if (txn.type === 'recovery') {
        totalDebit += txn.amount;
      } else if (txn.type === 'credit') {
        totalCredit += txn.amount;
      }
    }

    const balance = totalCredit - totalDebit;

    return NextResponse.json({
      shop,
      transactions,
      summary: {
        totalDebit,
        totalCredit,
        balance,
      },
    });
  } catch (error) {
    console.error('Ledger report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
