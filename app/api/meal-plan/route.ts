import { getServerSession } from 'next-auth';
import { authConfig } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper to get start (Monday) and end (Sunday) of week for a given date
function getWeekRange(date: Date) {
  const day = date.getDay();
  const diffToMonday = (day + 6) % 7; // Monday=0, Sunday=6
  const monday = new Date(date);
  monday.setDate(date.getDate() - diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { start: monday, end: sunday };
}

export async function GET(request: Request) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json([], { status: 401 });
  }
  const membership = await prisma.householdMember.findFirst({ where: { userId: session.user.id } });
  if (!membership) {
    return NextResponse.json([], { status: 404 });
  }
  const url = new URL(request.url);
  const dateParam = url.searchParams.get('date');
  const date = dateParam ? new Date(dateParam) : new Date();
  const { start, end } = getWeekRange(date);
  let mealPlan = await prisma.mealPlan.findFirst({
    where: {
      householdId: membership.householdId,
      startDate: { lte: start },
      endDate: { gte: end },
    },
    include: {
      items: {
        include: {
          recipe: true,
        },
      },
    },
  });
  if (!mealPlan) {
    mealPlan = await prisma.mealPlan.create({
      data: {
        householdId: membership.householdId,
        startDate: start,
        endDate: end,
      },
      include: { items: { include: { recipe: true } } },
    });
  }
  return NextResponse.json(mealPlan);
}

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
  const { date, slot, recipeId, servings, usesLeftovers } = body;
  const targetDate = new Date(date);
  const { start, end } = getWeekRange(targetDate);
  let mealPlan = await prisma.mealPlan.findFirst({
    where: {
      householdId: membership.householdId,
      startDate: { lte: start },
      endDate: { gte: end },
    },
  });
  if (!mealPlan) {
    mealPlan = await prisma.mealPlan.create({ data: { householdId: membership.householdId, startDate: start, endDate: end } });
  }
  try {
    const item = await prisma.mealPlanItem.create({
      data: {
        mealPlanId: mealPlan.id,
        recipeId,
        date: targetDate,
        slot,
        servings: servings ?? 1,
        usesLeftovers: usesLeftovers ?? false,
	userId: session.user.id,
      },
      include: {
        recipe: true,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}