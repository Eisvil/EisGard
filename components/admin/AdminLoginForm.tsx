"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AdminLoginFormProps = {
  nextPath: string;
  reason?: string;
};

export function AdminLoginForm({ nextPath, reason }: AdminLoginFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const supabase = createSupabaseBrowserClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push(nextPath || "/admin");
    router.refresh();
  }

  return (
    <form className="parchment admin-login-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Админ-доступ</p>
        <h1>Вход в конструктор</h1>
        <p>Используйте пользователя Supabase Auth с ролью `editor`, `admin` или `superadmin` в `profiles`.</p>
      </div>

      {reason === "forbidden" ? <div className="form-error">У пользователя нет административной роли.</div> : null}
      {reason === "unauthenticated" ? <div className="admin-muted-line">Для доступа к админке требуется вход.</div> : null}
      {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Пароль
        <input name="password" type="password" autoComplete="current-password" required />
      </label>

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        <LogIn size={18} />
        {isSubmitting ? "Проверяем..." : "Войти"}
      </button>
    </form>
  );
}
