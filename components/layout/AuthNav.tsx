import Link from "next/link";
import { UserCircle } from "lucide-react";
import { getCurrentUserEmail } from "@/lib/auth/current-user";

export async function AuthNav() {
  const email = await getCurrentUserEmail();

  if (email) {
    return (
      <form action="/auth/sign-out" method="post">
        <button className="secondary-button border-gold/30 bg-transparent text-parchment-light" type="submit">
          <UserCircle size={18} />
          Выйти
        </button>
      </form>
    );
  }

  return (
    <Link href="/auth/login" className="secondary-button border-gold/30 bg-transparent text-parchment-light">
      <UserCircle size={18} />
      Войти
    </Link>
  );
}
