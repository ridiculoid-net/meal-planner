import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    // Anonymous visitors: return a simple global feed without personalization.
    const recipes = await prisma.recipe.findMany({
      where: { isGlobal: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { ingredients: true, steps: true, reviews: true },
    });
    const result = recipes.map((recipe) => {
      const reviews: any[] = (recipe.reviews as any) || [];
      const avgRating = reviews.length
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;
      return { ...recipe, avgRating, reviewCount: reviews.length };
    });
    return NextResponse.json(result);
  }
  const userId = session.user.id;
  const membership = await prisma.householdMember.findFirst({ where: { userId } });
  const householdId = membership?.householdId;
  // Parse search params for optional query and filters
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() ?? '';
  const dietFilter = searchParams.get('diet');
  const cuisineFilter = searchParams.get('cuisine');
  const hideSkipped = searchParams.get('hideSkipped') === 'true';

  // Load user profile preferences
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const diets: string[] = profile?.diets ?? [];
  const allergies: string[] = profile?.allergies ?? [];
  const favCuisines: string[] = profile?.favoriteCuisines ?? [];
  const favMeats: string[] = profile?.favoriteMeats ?? [];
  const favVeggies: string[] = profile?.favoriteVegetables ?? [];
  const disliked: string[] = profile?.dislikedIngredients ?? [];
  // Load inventory ingredient names for ranking
  const inventoryItems = householdId
    ? await prisma.inventoryItem.findMany({ where: { householdId } })
    : [];
  const inventoryNames = inventoryItems.map((item) => item.name.toLowerCase());
  // Load reactions
  const reactions = await prisma.recipeReaction.findMany({ where: { userId }, select: { recipeId: true, type: true } });
  const reactionMap: Record<string, string> = {};
  reactions.forEach((r) => {
    reactionMap[r.recipeId] = r.type;
  });
  // Fetch accessible recipes along with average rating and review count
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
  });
  // Compute scores and filter by optional diet/cuisine
  const scored = recipes
    .map((recipe) => {
      let score = 0;
      const tags = (recipe.tags as any) || {};
      const cuisines: string[] = (tags.cuisines as any) ?? [];
      const dietsInRecipe: string[] = (tags.diets as any) ?? [];
      const allergens: string[] = (tags.allergens as any) ?? [];
      // Diet compatibility
      if (diets.length > 0 && dietsInRecipe.length > 0) {
        const intersects = dietsInRecipe.every((d) => diets.includes(d));
        if (!intersects) score -= 100;
      }
      // Apply diet filter if provided
      if (dietFilter) {
        if (!dietsInRecipe.includes(dietFilter)) {
          score -= 100;
        }
      }
      // Allergies
      if (allergens.some((a: string) => allergies.includes(a))) {
        score -= 100;
      }
      // Cuisine preferences
      cuisines.forEach((c: string) => {
        if (favCuisines.includes(c)) score += 5;
      });
      // Apply cuisine filter
      if (cuisineFilter) {
        if (!cuisines.includes(cuisineFilter)) {
          score -= 50;
        }
      }
      // Ingredients preferences/diet
      recipe.ingredients.forEach((ing) => {
        const name = ing.name.toLowerCase();
        if (favMeats.includes(name) || favVeggies.includes(name)) score += 2;
        if (disliked.includes(name)) score -= 5;
        if (inventoryNames.includes(name)) score += 1;
      });
      // Reaction boost or penalty
      const reaction = reactionMap[recipe.id];
      if (reaction === 'heart') score += 20;
      if (reaction === 'skip') score -= 100;
      // Rating boost
      const reviews: any[] = (recipe.reviews as any) || [];
      let avgRating = 0;
      if (reviews.length > 0) {
        avgRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length;
        score += avgRating * 2; // weight rating moderately
      }
      return { recipe, score, avgRating, reviewCount: reviews.length };
    })
    .filter((item) => {
      // Optionally hide skipped recipes
      if (hideSkipped && reactionMap[item.recipe.id] === 'skip') return false;
      return true;
    });
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  // Return sorted recipes with rating summary; limit to 50
  const sortedRecipes = scored.slice(0, 50).map((r) => {
    const { recipe, avgRating, reviewCount } = r;
    return { ...recipe, avgRating, reviewCount };
  });
  return NextResponse.json(sortedRecipes);
}