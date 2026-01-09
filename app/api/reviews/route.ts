import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/reviews?recipeId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const recipeId = searchParams.get('recipeId');
  if (!recipeId) {
    return NextResponse.json({ error: 'recipeId is required' }, { status: 400 });
  }
  const reviews = await prisma.recipeReview.findMany({
    where: { recipeId },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(reviews);
}

// POST /api/reviews
// Body: { recipeId, rating, comment }
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { recipeId, rating, comment } = await request.json();
  if (!recipeId || !rating) {
    return NextResponse.json({ error: 'Missing recipeId or rating' }, { status: 400 });
  }
  // Upsert review: if exists, update; else create
  const existing = await prisma.recipeReview.findFirst({ where: { userId, recipeId } });
  let review;
  if (existing) {
    review = await prisma.recipeReview.update({ where: { id: existing.id }, data: { rating, comment } });
  } else {
    review = await prisma.recipeReview.create({ data: { userId, recipeId, rating, comment } });
  }
  return NextResponse.json(review);
}