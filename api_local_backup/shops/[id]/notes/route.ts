import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notes = await db.shopNote.findMany({
      where: { shopId: id },
      include: {
        creator: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Get shop notes error:', error);
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
    const { text, createdBy } = body;

    if (!text || !createdBy) {
      return NextResponse.json({ error: 'Text and createdBy are required' }, { status: 400 });
    }

    const note = await db.shopNote.create({
      data: { shopId: id, text, createdBy },
      include: {
        creator: { select: { id: true, name: true, username: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Create shop note error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
