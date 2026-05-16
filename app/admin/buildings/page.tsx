import { AdminBuildingsManager } from "@/components/admin/AdminBuildingsManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { getBuildings } from "@/lib/data";

export const metadata = {
  title: "Здания | Админка"
};

export default async function AdminBuildingsPage() {
  const buildings = await getBuildings();

  return (
    <AdminShell title="Здания" description="Mock CRUD для зданий поселения: тексты, статусы, бюджеты и превью публичной карточки.">
      <AdminBuildingsManager initialBuildings={buildings} />
    </AdminShell>
  );
}
