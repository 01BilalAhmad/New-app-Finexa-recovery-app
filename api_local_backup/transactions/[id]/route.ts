import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // LIMITATION: Only pending (non-approved) recoveries can be edited
    if (existingTransaction.approved) {
      return NextResponse.json(
        { error: 'Approved recovery cannot be edited. Only pending entries can be modified.' },
        { status: 403 }
      );
    }

    // Calculate balance adjustment if amount changes
    const newAmount = body.amount !== undefined ? body.amount : existingTransaction.amount;
    const amountDiff = newAmount - existingTransaction.amount;

    // Update transaction and adjust shop balance
    const updated = await db.$transaction(async (tx) => {
      if (amountDiff !== 0) {
        const shop = await tx.shop.findUnique({
          where: { id: existingTransaction.shopId },
        });
        if (shop) {
          let newBalance = shop.balance;
          if (existingTransaction.type === 'recovery') {
            newBalance = shop.balance - amountDiff; // more recovery = less balance
          } else if (existingTransaction.type === 'credit') {
            newBalance = shop.balance + amountDiff;
          }
          await tx.shop.update({
            where: { id: existingTransaction.shopId },
            data: { balance: newBalance },
          });
        }
      }

      return tx.transaction.update({
        where: { id },
        data: {
          ...(body.amount !== undefined ? { amount: body.amount } : {}),
          ...(body.description !== undefined ? { description: body.description } : {}),
          ...(body.note !== undefined ? { description: body.note } : {}),
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
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const transaction = await db.transaction.findUnique({
      where: { id },
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
        orderbooker: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
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

    const existingTransaction = await db.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // LIMITATION: Order booker cannot delete approved recoveries
    if (existingTransaction.approved) {
      return NextResponse.json(
        { error: 'Approved recovery cannot be deleted. Only admin can delete approved entries.' },
        { status: 403 }
      );
    }

    // Reverse the balance effect and delete in a transaction
    await db.$transaction(async (tx) => {
      const shop = await tx.shop.findUnique({
        where: { id: existingTransaction.shopId },
      });

      if (shop) {
        let newBalance = shop.balance;
        // Reverse the effect: if it was recovery (reduced balance), add back; if credit (increased balance), subtract
        if (existingTransaction.type === 'recovery') {
          newBalance = shop.balance + existingTransaction.amount;
        } else if (existingTransaction.type === 'credit') {
          newBalance = shop.balance - existingTransaction.amount;
        }

        await tx.shop.update({
          where: { id: existingTransaction.shopId },
          data: { balance: newBalance },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });
    });

    return NextResponse.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
