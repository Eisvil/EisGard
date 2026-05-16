import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Админка | Живое Городище"
};

export default function AdminPage() {
  return (
    <AdminShell title="Дашборд" description="Сводка по сборам, объектам и последним событиям. Сейчас работает на mock-данных.">
      <AdminDashboard />
    </AdminShell>
  );
}
