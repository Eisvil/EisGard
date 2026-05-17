import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUserEmail } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

type RegisterPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata = {
  title: "Регистрация | Живое Городище"
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const params = await searchParams;
  const email = await getCurrentUserEmail();

  if (email) {
    redirect(params.next || "/");
  }

  return (
    <main className="auth-page shell">
      <AuthForm mode="register" nextPath={params.next || "/"} />
    </main>
  );
}
