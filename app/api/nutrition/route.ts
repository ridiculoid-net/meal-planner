import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper to get start and end of week (Monday-Sunday) for a given date
function getWeekRange(date: Date) {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

// GET /api/nutrition?date=YYYY-MM-DD
// Returns aggregated nutrition totals for the meal plan week containing the given date.
export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const date = dateParam ? new Date(dateParam) : new Date();
  // Find membership and meal plan
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json({ error: 'Household not found' }, { status: 404 });
  }
  const { start, end } = getWeekRange(date);
  const mealPlan = await prisma.mealPlan.findFirst({
    where: { householdId: membership.householdId, startDate: { lte: start }, endDate: { gte: end } },
    include: { items: { include: { recipe: true } } },
  });
  if (!mealPlan) {
    return NextResponse.json({ error: 'Meal plan not found' }, { status: 404 });
  }
  // Aggregate nutrition per day and total
  type Totals = { calories: number; protein: number; carbs: number; fat: number; sodium: number; sugar: number; fiber: number };
  const totalsByDate: Record<string, Totals> = {};
  const zero: Totals = { calories: 0, protein: 0, carbs: 0, fat: 0, sodium: 0, sugar: 0, fiber: 0 };
  mealPlan.items.forEach((item) => {
    const recipe = item.recipe as any;
    const nutrition = (recipe.nutrition as any) ?? {};
    const multiplier = item.servings / (recipe.servings || 1);
    const dateKey = item.date.toISOString().substring(0, 10);
    if (!totalsByDate[dateKey]) totalsByDate[dateKey] = { ...zero };
    totalsByDate[dateKey].calories += (nutrition.calories || 0) * multiplier;
    totalsByDate[dateKey].protein += (nutrition.protein || 0) * multiplier;
    totalsByDate[dateKey].carbs += (nutrition.carbs || 0) * multiplier;
    totalsByDate[dateKey].fat += (nutrition.fat || 0) * multiplier;
    totalsByDate[dateKey].sodium += (nutrition.sodium || 0) * multiplier;
    totalsByDate[dateKey].sugar += (nutrition.sugar || 0) * multiplier;
    totalsByDate[dateKey].fiber += (nutrition.fiber || 0) * multiplier;
  });
  // Compute weekly totals
  const weeklyTotals: Totals = { ...zero };
  Object.values(totalsByDate).forEach((t) => {
    weeklyTotals.calories += t.calories;
    weeklyTotals.protein += t.protein;
    weeklyTotals.carbs += t.carbs;
    weeklyTotals.fat += t.fat;
    weeklyTotals.sodium += t.sodium;
    weeklyTotals.sugar += t.sugar;
    weeklyTotals.fiber += t.fiber;
  });
  return NextResponse.json({ totalsByDate, weeklyTotals });
}