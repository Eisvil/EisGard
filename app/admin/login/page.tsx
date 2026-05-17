import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getAdminAccess } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

type AdminLoginPageProps = {
  searchParams: Promise<{
    next?: string;
    reason?: string;
  }>;
};

export const metadata = {
  title: "Вход в админку | Живое Городище"
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const access = await getAdminAccess();

  if (access.ok) {
    redirect(params.next || "/admin");
  }

  return (
    <main className="admin-login-page shell">
      <AdminLoginForm nextPath={params.next || "/admin"} reason={params.reason ?? access.reason} />
    </main>
  );
}
