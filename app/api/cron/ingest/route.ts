import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchNewRecipes, mapToInternalRecipe } from '@/providers/spoonacular';
import { computeNutrition } from '@/lib/nutrition';

// This endpoint is intended to be triggered via Vercel Cron
// Set CRON_SECRET env variable and include it in request header x-cron-secret

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    // Fetch new recipes from provider(s)
    const providerRecipes = await fetchNewRecipes();
    let createdCount = 0;
    for (const pr of providerRecipes) {
      // Map to internal recipe structure
      const mapped = await mapToInternalRecipe(pr);
      // Compute nutrition if missing
      const nutrition = mapped.nutrition ?? (await computeNutrition(mapped.ingredients));
      // Check if recipe already exists (by title)
      const exists = await prisma.recipe.findFirst({ where: { title: mapped.title, sourceType: 'auto' } });
      if (exists) {
        continue;
      }
      await prisma.recipe.create({
        data: {
          title: mapped.title,
          description: mapped.description,
          image: mapped.image,
          servings: mapped.servings ?? 1,
          sourceType: 'auto',
          isGlobal: true,
          attribution: mapped.attribution,
          tags: mapped.tags,
          nutrition: nutrition,
          ingredients: {
            createMany: {
              data: mapped.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
              })),
            },
          },
          steps: {
            createMany: {
              data: mapped.steps.map((step: any, idx: number) => ({ order: idx + 1, text: step.text })),
            },
          },
        },
      });
      createdCount++;
    }
    return NextResponse.json({ created: createdCount });
  } catch (error) {
    console.error('Error ingesting recipes', error);
    return NextResponse.json({ error: 'Failed to ingest' }, { status: 500 });
  }
}