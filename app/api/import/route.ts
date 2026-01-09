import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { computeNutrition } from '@/lib/nutrition';

// This endpoint accepts a recipe URL and optional parsed structured data.
// In a real implementation, the server would fetch and parse the page using
// a scraping library to extract JSON‑LD or microdata. Here we accept the
// structured data directly in the request body as `jsonLd` because external
// network access is not available.

export async function POST(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json({ error: 'Household not found' }, { status: 404 });
  }
  const body = await request.json();
  const { url, jsonLd } = body;
  if (!jsonLd) {
    return NextResponse.json({ error: 'jsonLd field required due to limited network access' }, { status: 400 });
  }
  try {
    // Map JSON-LD (schema.org/Recipe) to internal fields
    // This is a simplified mapping; adapt as needed
    const title = jsonLd.name || 'Imported Recipe';
    const image = Array.isArray(jsonLd.image) ? jsonLd.image[0] : jsonLd.image;
    const servings = parseFloat(jsonLd.recipeYield) || 1;
    const description = jsonLd.description || null;
    const ingredients: any[] = (jsonLd.recipeIngredient || []).map((line: string) => {
      // naive ingredient parsing: split quantity/unit/name
      const parts = line.split(' ');
      const quantity = parseFloat(parts[0]) || 1;
      const unit = parts[1] || '';
      const name = parts.slice(2).join(' ');
      return { name, quantity, unit };
    });
    const steps = (jsonLd.recipeInstructions || []).map((inst: any) => {
      if (typeof inst === 'string') return { text: inst };
      if (inst.text) return { text: inst.text };
      return { text: JSON.stringify(inst) };
    });
    const nutrition = jsonLd.nutrition || (await computeNutrition(ingredients));
    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        image,
        servings,
        sourceType: 'imported',
        isGlobal: false,
        householdId: membership.householdId,
        attribution: { source: url },
        nutrition,
        ingredients: {
          createMany: {
            data: ingredients.map((ing) => ({ name: ing.name, quantity: ing.quantity, unit: ing.unit })),
          },
        },
        steps: {
          createMany: {
            data: steps.map((step: any, idx: number) => ({ order: idx + 1, text: step.text })),
          },
        },
      },
      include: { ingredients: true, steps: true },
    });
    return NextResponse.json(recipe);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to import recipe' }, { status: 500 });
  }
}