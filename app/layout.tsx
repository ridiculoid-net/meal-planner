import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';
import AuthWidget from '@/components/AuthWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Recipe Planner',
  description: 'Personalized recipe, meal planning, grocery and inventory app',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50`}> 
        <Providers>
          <div className="min-h-screen pb-16 flex flex-col">
            {/* Top bar */}
            <header className="sticky top-0 z-40 border-b border-zinc-200/70 bg-white/80 backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/80">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600" aria-hidden="true" />
                  <div className="leading-tight">
                    <div className="text-sm font-semibold">Meal Planner</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">Recipes • Plan • Grocery • Inventory</div>
                  </div>
                </div>

                <AuthWidget />
              </div>
            </header>

            {/* Main content */}
            <div className="flex-1">
              {children}
            </div>
            {/* Bottom navigation */}
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}