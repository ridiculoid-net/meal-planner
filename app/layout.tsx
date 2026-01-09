import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from '@/components/Providers';
import BottomNav from '@/components/BottomNav';

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