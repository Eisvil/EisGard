import { AdminCollectionItemsManager } from "@/components/admin/AdminCollectionItemsManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { getBuildings } from "@/lib/data";

export const metadata = {
  title: "Слоты поддержки | Админка"
};

export default async function AdminCollectionItemsPage() {
  const buildings = await getBuildings();

  return (
    <AdminShell title="Слоты поддержки" description="Mock CRUD вложенных объектов сбора: цена, остаток, статус и связь со зданием.">
      <AdminCollectionItemsManager buildings={buildings} />
    </AdminShell>
  );
}
