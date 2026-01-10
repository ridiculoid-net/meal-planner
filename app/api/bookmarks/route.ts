import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/bookmarks
export async function GET() {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    // Anonymous visitors can browse the UI; bookmarks are simply empty.
    return NextResponse.json([]);
  }
  const userId = session.user.id;
  const bookmarks = await prisma.recipeBookmark.findMany({
    where: { userId },
    include: {
      recipe: {
        include: { ingredients: true, steps: true, reviews: true },
      },
    },
  });
  // Map to recipe with rating summary
  const result = bookmarks.map((b) => {
    const { recipe } = b;
    const reviews: any[] = (recipe.reviews as any) || [];
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    }
    return {
      ...recipe,
      avgRating,
      reviewCount: reviews.length,
    };
  });
  return NextResponse.json(result);
}

// POST /api/bookmarks
// Toggle bookmark for a recipe: if exists, remove; otherwise create
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const { recipeId } = await request.json();
  if (!recipeId) {
    return NextResponse.json({ error: 'Missing recipeId' }, { status: 400 });
  }
  const existing = await prisma.recipeBookmark.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  }).catch(() => null);
  if (existing) {
    await prisma.recipeBookmark.delete({ where: { id: existing.id } });
    return NextResponse.json({ bookmarked: false });
  } else {
    await prisma.recipeBookmark.create({ data: { userId, recipeId } });
    return NextResponse.json({ bookmarked: true });
  }
}