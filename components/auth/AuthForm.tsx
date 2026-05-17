"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthFormProps = {
  mode: "login" | "register";
  nextPath?: string;
};

export function AuthForm({ mode, nextPath = "/" }: AuthFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const supabase = createSupabaseBrowserClient();

    const result = isRegister
      ? await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name
            },
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(nextPath)}`
          }
        })
      : await supabase.auth.signInWithPassword({
          email,
          password
        });

    if (result.error) {
      setErrorMessage(result.error.message);
      setIsSubmitting(false);
      return;
    }

    if (isRegister && !result.data.session) {
      setSuccessMessage("Проверьте email и подтвердите регистрацию.");
      setIsSubmitting(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  return (
    <form className="parchment auth-card" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">{isRegister ? "Регистрация" : "Вход"}</p>
        <h1>{isRegister ? "Создать аккаунт" : "Войти в аккаунт"}</h1>
        <p>{isRegister ? "Аккаунт нужен для будущего личного кабинета, заявок и истории вкладов." : "Войдите, чтобы продолжить работу с проектом."}</p>
      </div>

      {isRegister ? (
        <label>
          Имя
          <input name="name" autoComplete="name" required />
        </label>
      ) : null}
      <label>
        Email
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Пароль
        <input name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={6} required />
      </label>

      {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
      {successMessage ? <div className="admin-success">{successMessage}</div> : null}

      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isRegister ? <UserPlus size={18} /> : <LogIn size={18} />}
        {isSubmitting ? "Отправляем..." : isRegister ? "Зарегистрироваться" : "Войти"}
      </button>

      <div className="admin-muted-line">
        {isRegister ? (
          <Link href={`/auth/login?next=${encodeURIComponent(nextPath)}`}>Уже есть аккаунт</Link>
        ) : (
          <Link href={`/auth/register?next=${encodeURIComponent(nextPath)}`}>Создать аккаунт</Link>
        )}
      </div>
    </form>
  );
}
