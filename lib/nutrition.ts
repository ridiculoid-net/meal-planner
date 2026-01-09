/**
 * Nutrition estimation functions. In a production app this module would call
 * an external nutrition API (e.g. Edamam, USDA) to normalize ingredients
 * and compute macronutrients. Due to network restrictions we instead map a
 * limited set of common ingredients to nutrition facts per unit and compute
 * approximate totals.
 */

// Per-unit nutrition data (per 100 grams) for a few common ingredients
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'sample ingredient': { calories: 100, protein: 2, carbs: 20, fat: 0 },
  chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  rice: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
};

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export async function computeNutrition(ingredients: Ingredient[]): Promise<any> {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let estimated = false;
  for (const ing of ingredients) {
    const key = ing.name.toLowerCase();
    const data = nutritionDatabase[key];
    if (data) {
      // Assume quantity is in grams; convert to per 100g
      const ratio = ing.quantity / 100;
      totalCalories += data.calories * ratio;
      totalProtein += data.protein * ratio;
      totalCarbs += data.carbs * ratio;
      totalFat += data.fat * ratio;
    } else {
      // Unknown ingredient; mark as estimated
      estimated = true;
    }
  }
  return {
    calories: parseFloat(totalCalories.toFixed(2)),
    protein: parseFloat(totalProtein.toFixed(2)),
    carbs: parseFloat(totalCarbs.toFixed(2)),
    fat: parseFloat(totalFat.toFixed(2)),
    estimated,
  };
}