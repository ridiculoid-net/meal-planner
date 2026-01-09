"use client";

import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const IngredientSchema = z.object({
  name: z.string().min(1, 'Ingredient name is required'),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

const StepSchema = z.object({
  text: z.string().min(1, 'Step description is required'),
});

const RecipeSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  servings: z.number().positive().default(1),
  ingredients: z.array(IngredientSchema).min(1, 'At least one ingredient'),
  steps: z.array(StepSchema).min(1, 'At least one step'),
});

type RecipeForm = z.infer<typeof RecipeSchema>;

export default function CreateRecipePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status !== 'loading' && !session) {
      router.push('/login');
    }
  }, [session, status, router]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RecipeForm>({ resolver: zodResolver(RecipeSchema), defaultValues: { servings: 1, ingredients: [{ name: '', quantity: 1, unit: '' }], steps: [{ text: '' }] } });
  const { fields: ingredientFields, append: appendIngredient, remove: removeIngredient } = useFieldArray({ control, name: 'ingredients' });
  const { fields: stepFields, append: appendStep, remove: removeStep } = useFieldArray({ control, name: 'steps' });

  const onSubmit = async (data: RecipeForm) => {
    const res = await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const recipe = await res.json();
      router.push(`/recipes/${recipe.id}`);
    }
  };

  return (
    <main className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Create Custom Recipe</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block font-medium mb-1">Title</label>
          <input {...register('title')} className="border p-2 rounded-md w-full" />
          {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-1">Description</label>
          <textarea {...register('description')} className="border p-2 rounded-md w-full" rows={3}></textarea>
        </div>
        <div>
          <label className="block font-medium mb-1">Servings</label>
          <input type="number" step="0.1" {...register('servings', { valueAsNumber: true })} className="border p-2 rounded-md w-full" />
          {errors.servings && <p className="text-red-500 text-sm mt-1">{errors.servings.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-2">Ingredients</label>
          {ingredientFields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-4 gap-2 mb-2 items-end">
              <div className="col-span-2">
                <input
                  {...register(`ingredients.${index}.name` as const)}
                  placeholder="Name"
                  className="border p-2 rounded-md w-full"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.1"
                  {...register(`ingredients.${index}.quantity` as const, { valueAsNumber: true })}
                  placeholder="Qty"
                  className="border p-2 rounded-md w-full"
                />
              </div>
              <div>
                <input
                  {...register(`ingredients.${index}.unit` as const)}
                  placeholder="Unit"
                  className="border p-2 rounded-md w-full"
                />
              </div>
              <div className="col-span-4 flex justify-end">
                {ingredientFields.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(index)} className="text-sm text-red-600">Remove</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => appendIngredient({ name: '', quantity: 1, unit: '' })} className="mt-2 px-3 py-1 bg-gray-200 rounded-md">Add Ingredient</button>
          {errors.ingredients && <p className="text-red-500 text-sm mt-1">{errors.ingredients.message}</p>}
        </div>
        <div>
          <label className="block font-medium mb-2">Steps</label>
          {stepFields.map((field, index) => (
            <div key={field.id} className="mb-2">
              <textarea
                {...register(`steps.${index}.text` as const)}
                placeholder={`Step ${index + 1}`}
                className="border p-2 rounded-md w-full"
                rows={2}
              ></textarea>
              {stepFields.length > 1 && (
                <button type="button" onClick={() => removeStep(index)} className="text-sm text-red-600 mt-1">Remove Step</button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => appendStep({ text: '' })} className="mt-2 px-3 py-1 bg-gray-200 rounded-md">Add Step</button>
          {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps.message}</p>}
        </div>
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md">Create Recipe</button>
      </form>
    </main>
  );
}