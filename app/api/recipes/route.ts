import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Fetch all recipes accessible to the user's household
export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  const householdId = membership?.householdId;
  const url = new URL(request.url);
  const recipeId = url.searchParams.get('id');
  // If an id query param is provided, fetch a single recipe
  if (recipeId) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        id: recipeId,
        OR: [
          { isGlobal: true },
          { householdId: householdId },
        ],
      },
      include: {
        ingredients: true,
        steps: true,
        reviews: true,
      },
    });
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    // compute average rating and review count
    const reviews: any[] = (recipe.reviews as any) || [];
    let avgRating = 0;
    if (reviews.length > 0) {
      avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
    }
    const result = { ...recipe, avgRating, reviewCount: reviews.length };
    return NextResponse.json(result);
  }
  // Otherwise return a list of recipes accessible to the household
  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.toLowerCase() ?? '';
  const diet = url.searchParams.get('diet');
  const cuisine = url.searchParams.get('cuisine');
  const recipes = await prisma.recipe.findMany({
    where: {
      OR: [
        { isGlobal: true },
        { householdId: householdId },
      ],
      AND: query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {},
    },
    include: {
      ingredients: true,
      steps: true,
      reviews: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  const mapped = recipes
    .filter((rec) => {
      const tags = (rec.tags as any) || {};
      const cuisines: string[] = (tags.cuisines as any) ?? [];
      const dietsInRecipe: string[] = (tags.diets as any) ?? [];
      if (diet && !dietsInRecipe.includes(diet)) return false;
      if (cuisine && !cuisines.includes(cuisine)) return false;
      return true;
    })
    .map((rec) => {
      const reviews: any[] = (rec.reviews as any) || [];
      let avgRating = 0;
      if (reviews.length > 0) {
        avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
      }
      return { ...rec, avgRating, reviewCount: reviews.length };
    });
  return NextResponse.json(mapped);
}

// Create a custom recipe for the user's household
export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json({ error: 'No household found' }, { status: 400 });
  }
  const data = await request.json();
  const { title, description, servings, ingredients, steps, image } = data;
  try {
    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        servings: servings ?? 1,
        sourceType: 'custom',
        isGlobal: false,
        householdId: membership.householdId,
        image: image ?? null,
        ingredients: {
          createMany: {
            data: ingredients.map((ing: any, index: number) => ({
              name: ing.name,
              quantity: ing.quantity,
              unit: ing.unit,
              metadata: ing.metadata ?? null,
            })),
          },
        },
        steps: {
          createMany: {
            data: steps.map((step: any, index: number) => ({
              order: index + 1,
              text: step.text,
            })),
          },
        },
      },
      include: {
        ingredients: true,
        steps: true,
      },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
  }
}