import { AdminShell } from "@/components/admin/AdminShell";
import { AdminVolunteersManager } from "@/components/admin/AdminVolunteersManager";
import { getVolunteerApplications } from "@/lib/data";

export const metadata = {
  title: "Волонтеры | Админка"
};

export default async function AdminVolunteersPage() {
  const applications = await getVolunteerApplications();

  return (
    <AdminShell title="Волонтеры" description="Mock-обработка заявок: статусы, контакты, подтверждение часов и начисление баллов.">
      <AdminVolunteersManager initialApplications={applications} />
    </AdminShell>
  );
}
