import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// POST /api/join
// Body: { slug }
// Join household by slug. Adds current user as member.
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { slug } = await request.json();
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }
  // Find household by slug
  const household = await prisma.household.findFirst({ where: { slug } });
  if (!household) {
    return NextResponse.json({ error: 'Household not found' }, { status: 404 });
  }
  // Check if user already a member
  const existing = await prisma.householdMember.findFirst({ where: { userId: session.user.id, householdId: household.id } });
  if (existing) {
    return NextResponse.json({ household, alreadyMember: true });
  }
  await prisma.householdMember.create({ data: { userId: session.user.id, householdId: household.id } });
  return NextResponse.json({ household, alreadyMember: false });
}