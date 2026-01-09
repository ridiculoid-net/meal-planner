import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await request.json();
  try {
    const updated = await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
        ageYears: data.ageYears ?? null,
        householdSize: data.householdSize ?? 1,
      },
      create: {
        userId: session.user.id,
        heightCm: data.heightCm ?? null,
        weightKg: data.weightKg ?? null,
        ageYears: data.ageYears ?? null,
        householdSize: data.householdSize ?? 1,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}