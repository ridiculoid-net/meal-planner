"use client";

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const FormSchema = z.object({
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  ageYears: z.number().optional(),
  householdSize: z.number().min(1).default(1),
  diets: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
});

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { householdSize: 1 },
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      router.push('/');
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Onboarding</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Height (cm)</label>
          <input
            type="number"
            {...register('heightCm', { valueAsNumber: true })}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Weight (kg)</label>
          <input
            type="number"
            {...register('weightKg', { valueAsNumber: true })}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Age (years)</label>
          <input
            type="number"
            {...register('ageYears', { valueAsNumber: true })}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Household size</label>
          <input
            type="number"
            {...register('householdSize', { valueAsNumber: true })}
            className="border rounded-md px-3 py-2 w-full"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow"
        >
          Save
        </button>
      </form>
    </main>
  );
}