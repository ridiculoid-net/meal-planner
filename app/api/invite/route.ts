import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/invite
// Returns an invitation link (slug) for the current user's household.
export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const member = await prisma.householdMember.findFirst({ where: { userId }, include: { household: true } });
  if (!member || !member.household) {
    return NextResponse.json({ error: 'No household found' }, { status: 404 });
  }
  const slug = member.household.slug;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || '';
  const inviteLink = `${baseUrl}/join/${slug}`;
  return NextResponse.json({ slug, inviteLink });
}