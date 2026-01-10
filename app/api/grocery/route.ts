import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Returns the current active grocery list and its items for the user's household
export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json([]);
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json([], { status: 404 });
  }
  let list = await prisma.groceryList.findFirst({
    where: { householdId: membership.householdId, status: 'active' },
    include: { items: true },
  });
  if (!list) {
    // create new list if none exists
    list = await prisma.groceryList.create({
      data: {
        householdId: membership.householdId,
        status: 'active',
      },
      include: { items: true },
    });
  }
  return NextResponse.json(list);
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
  const { name, quantity, unit, section } = await request.json();
  try {
    let list = await prisma.groceryList.findFirst({ where: { householdId: membership.householdId, status: 'active' } });
    if (!list) {
      list = await prisma.groceryList.create({ data: { householdId: membership.householdId, status: 'active' } });
    }
    const item = await prisma.groceryListItem.create({
      data: {
        groceryListId: list.id,
        name,
        quantity,
        unit,
        section,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}