import Link from "next/link";
import { BarChart3, Boxes, HeartHandshake, ListChecks, LogOut, Map, ScrollText, Settings, UserCog, UsersRound } from "lucide-react";
import { requireAdminPageAccess } from "@/lib/auth/admin";

const adminLinks = [
  { href: "/admin", label: "Дашборд", icon: BarChart3 },
  { href: "/admin/buildings", label: "Здания", icon: Boxes },
  { href: "/admin/collection-items", label: "Слоты", icon: ListChecks },
  { href: "/admin/donations", label: "Донаты", icon: HeartHandshake },
  { href: "/admin/map", label: "Карта", icon: Map },
  { href: "/admin/volunteers", label: "Волонтеры", icon: UsersRound },
  { href: "/admin/users", label: "Пользователи", icon: UserCog },
  { href: "/admin/chronicle", label: "Летопись", icon: ScrollText },
  { href: "/admin/settings", label: "Настройки", icon: Settings }
];

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export async function AdminShell({ title, description, children }: AdminShellProps) {
  const access = await requireAdminPageAccess();

  return (
    <main className="admin-page shell">
      <aside className="admin-nav" aria-label="Административная навигация">
        <div>
          <p className="eyebrow">Админка</p>
          <h1>Конструктор городища</h1>
          <p className="admin-user-line">{access.email} · {access.role}</p>
        </div>
        <nav>
          {adminLinks.map((link) => {
            const Icon = link.icon;

            return (
              <Link key={link.href} href={link.href}>
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <section className="admin-content">
        <header className="admin-heading">
          <div>
            <p className="eyebrow">Mock control panel</p>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
          <div className="admin-heading-actions">
            <Link href="/" className="secondary-button">
              На публичную карту
            </Link>
            <form action="/auth/sign-out" method="post">
              <button className="secondary-button" type="submit">
                <LogOut size={17} />
                Выйти
              </button>
            </form>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
