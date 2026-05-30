'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import type { User } from '@supabase/supabase-js';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  async function fetchProfile(userId: string) {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', userId)
      .single();
    if (data) {
      setDisplayName(data.full_name ?? '');
      setAvatarUrl(data.avatar_url ?? null);
      setRole(data.role ?? null);
    }
  }

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      if (data.user) fetchProfile(data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) fetchProfile(u.id); else { setDisplayName(''); setAvatarUrl(null); setRole(null); }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close user dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close nav drawer on outside click
  useEffect(() => {
    if (!navOpen) return;
    function handleClick(e: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [navOpen]);

  // Close drawer on route change
  useEffect(() => { setNavOpen(false); }, [pathname]);

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  }

  const initials = displayName
    ? displayName.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';

  const navLinks = [
    { href: '/', label: 'Карта поселения' },
    { href: '/chronicle', label: 'Летопись' },
    { href: '/volunteers', label: 'Волонтёрам' },
    { href: '/materials', label: 'Материалы' },
    { href: '/partners', label: 'Партнёрам' },
    { href: '/about', label: 'О проекте' },
  ];

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Живое Городище">
          <img src="/logo.png" alt="" width={72} height={72} />
          <span className="brand-name">Живое<br />Городище</span>
        </Link>

        <nav className="navigation" aria-label="Основная навигация">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
          ))}
        </nav>

        {/* Burger button — visible only on mobile via CSS */}
        <button
          type="button"
          className="nav-burger"
          aria-label={navOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={navOpen}
          onClick={() => setNavOpen(o => !o)}
        >
          {navOpen ? <X size={24} strokeWidth={1.75} /> : <Menu size={24} strokeWidth={1.75} />}
        </button>

        {/* Mobile nav drawer */}
        {navOpen && (
          <div className="nav-drawer" ref={drawerRef} role="dialog" aria-label="Навигация">
            <nav aria-label="Мобильная навигация">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`nav-drawer-link${pathname === href ? ' active' : ''}`}
                  onClick={() => setNavOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </nav>
            {!user && (
              <Link
                href="/auth/register"
                className="primary-button nav-drawer-cta"
                onClick={() => setNavOpen(false)}
              >
                Стать участником
              </Link>
            )}
          </div>
        )}

        <div className="header-actions">
          {user ? (
            <div className={`header-user-wrap${menuOpen ? ' open' : ''}`} ref={menuRef}>
              <button
                type="button"
                className="header-user-btn"
                onClick={() => setMenuOpen(o => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="true"
              >
                <span className="header-user-avatar">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} />
                  ) : (
                    initials
                  )}
                </span>
                <span className="header-user-name">{displayName || 'Участник'}</span>
                <span className="header-user-chevron">▾</span>
              </button>

              {menuOpen && (
                <div className="header-user-dropdown" role="menu">
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    Личный кабинет
                  </Link>
                  {(role === 'admin' || role === 'moderator') && (
                    <Link href="/admin" onClick={() => setMenuOpen(false)}>
                      Админка
                    </Link>
                  )}
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-logout"
                    onClick={handleSignOut}
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/auth/register" className="primary-button header-join">
              <span className="join-long">Стать участником</span>
              <span className="join-short">Участвовать</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
