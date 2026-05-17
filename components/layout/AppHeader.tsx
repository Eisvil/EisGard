"use client";

import Link from "next/link";
import { Menu, UserCircle } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/", label: "Карта поселения" },
  { href: "/chronicle", label: "Летопись" },
  { href: "/volunteers", label: "Волонтерам" },
  { href: "/#about", label: "О проекте" },
  { href: "/admin", label: "Админка" }
];

export function AppHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/95 text-parchment-light backdrop-blur">
      <div className="shell flex min-h-[76px] items-center justify-between gap-5">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Живое Городище">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/55 text-gold">
            <span className="text-2xl leading-none">✥</span>
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl leading-tight text-parchment-light">Живое Городище</span>
            <span className="block truncate text-xs text-gold">Строим наше наследие вместе</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-parchment-light/86 lg:flex" aria-label="Основная навигация">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="border-b border-transparent py-2 transition hover:border-gold hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/auth/login" className="secondary-button border-gold/30 bg-transparent text-parchment-light">
            <UserCircle size={18} />
            Войти
          </Link>
        </div>

        <button
          className="grid h-11 w-11 place-items-center rounded-md border border-gold/30 text-gold lg:hidden"
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          aria-expanded={isOpen}
          aria-label="Открыть меню"
        >
          <Menu size={24} />
        </button>
      </div>

      {isOpen ? (
        <div className="border-t border-white/10 bg-ink lg:hidden">
          <nav className="shell grid gap-1 py-3 text-parchment-light" aria-label="Мобильная навигация">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-2 py-3 hover:bg-white/5" onClick={() => setIsOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link href="/auth/login" className="rounded-md px-2 py-3 text-gold" onClick={() => setIsOpen(false)}>
              Войти
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
