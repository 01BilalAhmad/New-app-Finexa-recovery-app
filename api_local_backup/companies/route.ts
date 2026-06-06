import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (userId) {
      // Get companies assigned to user
      const userCompanies = await db.userCompany.findMany({
        where: { userId },
        include: { company: true },
      });
      return NextResponse.json(userCompanies.map(uc => ({
        ...uc.company,
        isPrimary: uc.isPrimary,
      })));
    }

    const companies = await db.company.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, shortName, color } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const company = await db.company.create({
      data: {
        name,
        shortName: shortName || '',
        color: color || '#16a34a',
      },
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Create company error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
