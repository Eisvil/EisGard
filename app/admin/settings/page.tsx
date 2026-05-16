import { AdminSettingsManager } from "@/components/admin/AdminSettingsManager";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata = {
  title: "Настройки | Админка"
};

export default function AdminSettingsPage() {
  return (
    <AdminShell title="Настройки" description="Заготовка настроек проекта, интеграций, уведомлений и юридических текстов.">
      <AdminSettingsManager />
    </AdminShell>
  );
}
