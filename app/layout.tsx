import type { Metadata } from "next";
import "./globals.css";

import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import AuthWidget from "@/components/AuthWidget";

export const metadata: Metadata = {
  title: "Meal Planner",
  description: "Personalized meal planning and groceries",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {/* TOP APP BAR */}
          <header className="sticky top-0 z-40 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="font-semibold">Meal Planner</div>

            {/* 🔑 AUTH WIDGET GOES HERE */}
            <AuthWidget />
          </header>

          {/* MAIN CONTENT */}
          <main className="pb-16">{children}</main>

          {/* BOTTOM NAV */}
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
