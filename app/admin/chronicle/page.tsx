import { AdminChronicleManager } from "@/components/admin/AdminChronicleManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { getChronicleEntries } from "@/lib/data";

export const metadata = {
  title: "Летопись | Админка"
};

export default async function AdminChroniclePage() {
  const entries = await getChronicleEntries();

  return (
    <AdminShell title="Летопись" description="Mock-модерация публичных записей: скрытие, закрепление и редактирование текста.">
      <AdminChronicleManager initialEntries={entries} />
    </AdminShell>
  );
}
