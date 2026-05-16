import { AdminMapEditor } from "@/components/admin/AdminMapEditor";
import { AdminShell } from "@/components/admin/AdminShell";
import { getBuildings } from "@/lib/data";

export const metadata = {
  title: "Карта | Админка"
};

export default async function AdminMapPage() {
  const buildings = await getBuildings();

  return (
    <AdminShell title="Редактор карты" description="Mock-конструктор маркеров: выбор здания и настройка координат X/Y в процентах.">
      <AdminMapEditor buildings={buildings} />
    </AdminShell>
  );
}
