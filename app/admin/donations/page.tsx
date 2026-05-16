import { AdminDonationsManager } from "@/components/admin/AdminDonationsManager";
import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDonations } from "@/lib/data";

export const metadata = {
  title: "Донаты | Админка"
};

export default async function AdminDonationsPage() {
  const donations = await getAdminDonations();

  return (
    <AdminShell title="Донаты" description="Mock-реестр платежей: фильтры, статусы и имитация webhook payment.succeeded.">
      <AdminDonationsManager initialDonations={donations} />
    </AdminShell>
  );
}
