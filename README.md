# Recipe Planner Web App

This project is a mobile‑first, real‑time recipe, meal planning, grocery, nutrition and inventory management application built with **Next.js (App Router)** and **Supabase**. Users can sign in with Google, create or join a household, discover personalized recipes, bookmark favourites, read and write reviews, plan meals, track pantry/fridge/freezer inventory, monitor weekly nutrition, and generate aggregated grocery lists with normalized quantities and nutrition information. Invitation links allow multiple household members to collaborate in real time.

## Features

### Authentication & Households

Users authenticate via Google. After first login they create or join a household; all data is scoped per household and updates are synced in real time via Supabase Realtime. Users can generate an invitation link to invite family or roommates, and joining via the invite automatically adds the new member to the household.

### Onboarding & Preferences

The onboarding flow collects height, weight, age, household size, dietary preferences, allergies, favourite cuisines and ingredients, dislikes and goal/ activity level. These preferences directly power feed ranking and meal generation.

### Recipe Sources

Recipes come from three sources:

1. **Automatic ingestion** via scheduled cron jobs and provider abstractions.
2. **URL import** using structured data extraction with an editable draft.
3. **Custom recipes** created in‑app via a full editor.

### Personalized Feed

The infinite scroll feed mixes global auto‑sourced recipes with household recipes and imported/custom recipes. Ranking is rule‑based and takes into account diets, allergies, favourite cuisines/ingredients, what’s on hand, past reactions (heart/skip), ratings and search/filter criteria. Users can filter by diet or cuisine, search for keywords and hide skipped recipes.

### Favorites & Reviews

Users can bookmark (☆) any recipe to save it to a personal favourites page. Each recipe also supports user‑submitted reviews with 1–5 star ratings and optional comments. Average rating and review count are displayed throughout the app.

### Rich Recipe Pages

Recipe detail pages include hero images, adjustable serving sizes, check‑off ingredients, step‑by‑step instructions, nutrition panels computed per serving, ratings summary, bookmark/share/print buttons and a review form. Recipes show related recommendations based on feed ranking.

### Meal Planning

Weekly plans are displayed as lightweight cards for each day with breakfast/lunch/dinner slots. Users add meals from the feed, favourites or search, specify servings, and optionally mark meals as leftovers. The plan view is simplified for mobile and allows quick navigation between days. A nutrition summary page aggregates calories, protein, carbs, fats, sodium, sugar and fibre totals per day and per week based on the current meal plan.

### Inventory

Track items in pantry, fridge and freezer with quantities and units. Inventory deducts from the grocery list and boosts ranking for recipes that use on‑hand ingredients. Optional expiration dates trigger gentle warnings.

### Grocery List

The grocery list aggregates items from the meal plan (and manual additions) with normalized units and groups them by store section (produce, dairy/eggs, pantry, etc.). Checkboxes sync in real time across household members, and checking an item prompts adding it to inventory.

### Nutrition System

Ingredients are normalized against a nutrition database/API. Nutrition is computed per recipe and per serving and updated dynamically when serving sizes change. The dedicated nutrition page summarizes weekly and daily totals and helps users meet maintain/lose/gain goals.

### Real‑Time Collaboration

All household data (meal plans, grocery lists, inventory, reactions, reviews) is synced in real time. Household members see each other’s changes instantly and can collaborate from their own devices.

## Tech Stack

- **Frontend**: Next.js App Router (React Server Components + Client Components), TypeScript, Tailwind CSS and Shadcn UI components. State management via React‑Query and React Hook Form.
- **Auth**: NextAuth with Google provider and Prisma adapter.
- **Database**: Supabase Postgres, accessed via Prisma. Realtime updates handled via Supabase Realtime (not yet wired into UI).
- **Storage**: Supabase Storage for user‑uploaded images (placeholder).
- **Jobs**: Vercel Cron endpoints for recipe ingestion (placeholder).

## Getting Started

1. **Clone the repo** and install dependencies (note: internet access may be restricted in this environment, so installation is optional).

```bash
git clone https://example.com/recipe-app.git
cd recipe-app
npm install
```

2. **Set up environment variables**. Copy `.env.example` to `.env.local` and fill in the values for your Supabase project, Google OAuth credentials, NextAuth secret, and database connection string.

```bash
cp .env.example .env.local
# edit .env.local accordingly
```

3. **Run Prisma migrations** to create the database schema.

```bash
npx prisma migrate dev --name init
```

4. **Start the development server**.

```bash
npm run dev
```

5. **Open** `http://localhost:3000` in your browser. Sign in with Google and complete onboarding to start using the app.

## Environment Variables

The app expects the following variables to be defined (see `.env.example`):

- `NEXTAUTH_URL` – The canonical URL of your site (e.g. `http://localhost:3000`).
- `NEXTAUTH_SECRET` – A strong secret used to encrypt session tokens.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` – OAuth credentials from Google Developer Console.
- `DATABASE_URL` – Connection string for your Supabase Postgres database.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase project URL and anonymous API key.

- `CRON_SECRET` – Secret token used by the Vercel Cron ingestion endpoint (`/api/cron/ingest`). Include this token in an `x-cron-secret` header when triggering the endpoint.

## Prisma Data Model

The Prisma schema (see `prisma/schema.prisma`) defines all entities needed to support households, recipes, ingredients, steps, reactions, meal plans, inventory, grocery lists and more. Models are scoped by `householdId` where appropriate to ensure multi‑tenant isolation. See the schema for full definitions.

## Status

This repository now includes a broad implementation of the product vision. Authentication, household creation/joining, onboarding, inventory management, grocery lists, meal planning, favourites, reviews, nutrition summaries, invitations and search/filters are implemented. Automatic recipe ingestion, detailed provider integrations and some advanced ranking logic remain stubbed and can be extended. Feel free to build upon this foundation!

Contributions and improvements are welcome!