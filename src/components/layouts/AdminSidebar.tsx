'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Building2,
  Users,
  Tent,
  ClipboardList,
  Newspaper,
  LogOut,
  Settings,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const NAV_ITEMS = [
  { href: '/admin',                              label: 'Дашборд',        icon: LayoutDashboard },
  { href: '/admin/objects',                      label: 'Объекты',        icon: Building2 },
  { href: '/admin/map',                          label: 'Карта',          icon: Map },
  { href: '/admin/camps',                        label: 'Заезды',         icon: Tent },
  { href: '/admin/applications',                 label: 'Заявки',         icon: ClipboardList },
  { href: '/admin/news',                         label: 'Новости',        icon: Newspaper },
  { href: '/admin/users',                        label: 'Пользователи',   icon: Users },
  { href: '/admin/settings',                     label: 'Настройки',      icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-white border-r border-slate-200 shrink-0">
      <div className="px-4 py-5 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-700 leading-tight">
          Живое Городище<br />
          <span className="text-xs text-slate-400 font-normal">Панель администратора</span>
        </span>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/admin'
              ? pathname === '/admin'
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-medium'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          На сайт →
        </Link>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={15} />
          Выйти
        </button>
      </div>
    </aside>
  );
}
