import { AdminSettingsManager } from "@/components/admin/AdminSettingsManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { getProjectSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Настройки | Админка"
};

export default async function AdminSettingsPage() {
  const settings = await getProjectSettings();
  const yookassaEnvReady = Boolean(process.env.YOOKASSA_SHOP_ID && process.env.YOOKASSA_SECRET_KEY && process.env.YOOKASSA_WEBHOOK_SECRET);

  return (
    <AdminShell title="Настройки" description="Настройки проекта, внешних сборов, интеграций, уведомлений и юридических текстов.">
      <AdminSettingsManager initialSettings={settings} yookassaEnvReady={yookassaEnvReady} />
    </AdminShell>
  );
}
