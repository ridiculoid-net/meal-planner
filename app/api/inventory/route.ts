import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }
  // find household membership of user
  const membership = await prisma.householdMember.findFirst({
    where: { userId: session.user.id },
  });
  if (!membership) {
    return NextResponse.json([], { status: 404 });
  }
  const items = await prisma.inventoryItem.findMany({
    where: { householdId: membership.householdId },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json({ error: 'Household not found' }, { status: 404 });
  }
  const data = await request.json();
  try {
    const item = await prisma.inventoryItem.create({
      data: {
        householdId: membership.householdId,
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        location: data.location,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}