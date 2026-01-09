import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET() {
  // Get current user's households
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }
  const memberships = await prisma.householdMember.findMany({
    where: { userId: session.user.id },
    include: { household: true },
  });
  const households = memberships.map((m) => m.household);
  return NextResponse.json(households);
}

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await request.json();
  const { action, name, householdId } = body;
  try {
    if (action === 'create') {
      // Create new household and add user as member
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const household = await prisma.household.create({
        data: {
          name,
          slug: `${slug}-${nanoid(6)}`,
          members: {
            create: {
              userId: session.user.id,
              role: 'owner',
            },
          },
        },
      });
      return NextResponse.json(household);
    }
    if (action === 'join') {
      // join existing household by ID
      const household = await prisma.household.findUnique({
        where: { id: householdId },
      });
      if (!household) {
        return NextResponse.json({ error: 'Household not found' }, { status: 404 });
      }
      await prisma.householdMember.create({
        data: {
          userId: session.user.id,
          householdId: household.id,
        },
      });
      return NextResponse.json(household);
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}