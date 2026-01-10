"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Home,
  CalendarDays,
  ShoppingCart,
  ClipboardList,
  Heart,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Feed", Icon: BookOpen },
  { href: "/recipes", label: "Recipes", Icon: Home },
  { href: "/meal-plan", label: "Plan", Icon: CalendarDays },
  { href: "/grocery", label: "Grocery", Icon: ShoppingCart },
  { href: "/inventory", label: "Inventory", Icon: ClipboardList },
  { href: "/favorites", label: "Favorites", Icon: Heart },
  { href: "/nutrition", label: "Nutrition", Icon: BarChart3 },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
      <div className="mx-auto flex max-w-xl justify-around px-2 py-2">
        {navItems.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-1 text-[11px]">
              <Icon className={`h-5 w-5 ${active ? "text-blue-600" : "text-zinc-500"}`} />
              <span className={active ? "text-blue-600 font-medium" : "text-zinc-500"}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
