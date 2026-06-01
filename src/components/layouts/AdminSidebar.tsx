'use client';

import { useState } from 'react';
import Image from 'next/image';
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
  BookOpen,
} from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

const NAV_ITEMS = [
  { href: '/admin',              label: 'Дашборд',       icon: LayoutDashboard },
  { href: '/admin/objects',      label: 'Объекты',       icon: Building2 },
  { href: '/admin/map',          label: 'Карта',         icon: Map },
  { href: '/admin/camps',        label: 'Заезды',        icon: Tent },
  { href: '/admin/applications', label: 'Заявки',        icon: ClipboardList },
  { href: '/admin/news',         label: 'Новости',       icon: Newspaper },
  { href: '/admin/users',        label: 'Пользователи',  icon: Users },
  { href: '/admin/tutorial',     label: 'Задания',        icon: BookOpen },
  { href: '/admin/settings',     label: 'Настройки',     icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <aside
      className="flex flex-col w-56 min-h-screen shrink-0"
      style={{ background: 'hsl(var(--background))', borderRight: '1px solid hsl(var(--border) / .6)' }}
    >
      {/* Brand */}
      <div className="admin-brand">
        <Image
          src="/logo.png"
          alt="Живое Городище"
          width={44}
          height={44}
          className="admin-brand-logo"
        />
        <div className="admin-brand-text">
          <span className="admin-brand-name">Живое Городище</span>
          <span className="admin-brand-sub">Панель администратора</span>
        </div>
      </div>

      {/* Navigation */}
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
              className={`admin-nav-link${isActive ? ' admin-nav-active' : ''}`}
            >
              <Icon size={15} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="admin-sidebar-footer">
        <Link href="/" className="admin-sidebar-footer-link">
          На сайт →
        </Link>
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          className="admin-sidebar-footer-link danger"
        >
          <LogOut size={14} />
          {signingOut ? 'Выход…' : 'Выйти'}
        </button>
      </div>
    </aside>
  );
}
