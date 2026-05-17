import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/AuthForm";
import { getCurrentUserEmail } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export const metadata = {
  title: "Вход | Живое Городище"
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const email = await getCurrentUserEmail();

  if (email) {
    redirect(params.next || "/");
  }

  return (
    <main className="auth-page shell">
      <AuthForm mode="login" nextPath={params.next || "/"} />
    </main>
  );
}
