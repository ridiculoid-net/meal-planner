"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  BookOpenIcon,
  CalendarIcon,
  ClipboardIcon,
  ShoppingCartIcon,
  HeartIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { href: '/', label: 'Feed', icon: BookOpenIcon },
  { href: '/recipes', label: 'Recipes', icon: HomeIcon },
  { href: '/meal-plan', label: 'Plan', icon: CalendarIcon },
  { href: '/grocery', label: 'Grocery', icon: ShoppingCartIcon },
  { href: '/inventory', label: 'Inventory', icon: ClipboardIcon },
  { href: '/favorites', label: 'Favorites', icon: HeartIcon },
  { href: '/nutrition', label: 'Nutrition', icon: ChartBarIcon },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-inner flex justify-around py-2">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} className="flex flex-col items-center text-xs">
            <Icon className={`h-6 w-6 mb-1 ${active ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className={active ? 'text-blue-600 font-medium' : 'text-gray-500'}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}