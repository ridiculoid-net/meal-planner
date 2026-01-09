import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { recipeId, type } = await request.json();
  if (!['heart', 'skip'].includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 });
  }
  try {
    const reaction = await prisma.recipeReaction.upsert({
      where: {
        userId_recipeId: {
          userId: session.user.id,
          recipeId,
        },
      },
      update: { type },
      create: {
        userId: session.user.id,
        recipeId,
        type,
      },
    });
    return NextResponse.json(reaction);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save reaction' }, { status: 500 });
  }
}