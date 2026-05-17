import { AdminShell } from "@/components/admin/AdminShell";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Пользователи | Админка"
};

export default function AdminUsersPage() {
  return (
    <AdminShell title="Пользователи" description="Управление статусами пользователей: участник, модератор и администратор.">
      <AdminUsersManager />
    </AdminShell>
  );
}
