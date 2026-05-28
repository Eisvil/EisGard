'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  const menuRef = useRef<HTMLDivElement>(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Живое Городище">
          <img src="/logo.png" alt="" width={72} height={72} />
          <span className="brand-name">Живое<br />Городище</span>
        </Link>

        <nav className="navigation" aria-label="Основная навигация">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>Карта поселения</Link>
          <Link href="/chronicle" className={pathname === '/chronicle' ? 'active' : ''}>Летопись</Link>
          <Link href="/volunteers" className={pathname === '/volunteers' ? 'active' : ''}>Волонтёрам</Link>
          <Link href="/materials" className={pathname === '/materials' ? 'active' : ''}>Материалы</Link>
          <Link href="/partners" className={pathname === '/partners' ? 'active' : ''}>Партнёрам</Link>
          <Link href="/about" className={pathname === '/about' ? 'active' : ''}>О проекте</Link>
        </nav>

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
