"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type { Building } from "@/lib/types";

type VolunteerApplicationFormProps = {
  buildings: Building[];
};

export function VolunteerApplicationForm({ buildings }: VolunteerApplicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const skills = String(formData.get("skills") ?? "")
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/volunteer-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          buildingSlug: formData.get("building"),
          skills,
          preferredDates: formData.get("dates"),
          comment: formData.get("comment")
        })
      });

      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось отправить заявку");
      }

      form.reset();
      setSuccessMessage(result.mode === "supabase" ? "Заявка отправлена и сохранена в Supabase." : "Заявка принята в mock-режиме.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="parchment volunteer-form" onSubmit={handleSubmit}>
      {successMessage ? (
        <div className="success-note" role="status">
          <CheckCircle2 size={21} />
          <span>{successMessage}</span>
        </div>
      ) : null}
      {errorMessage ? <div className="form-error">{errorMessage}</div> : null}
      <label>
        Имя
        <input name="name" placeholder="Иван Петров" required />
      </label>
      <label>
        Email
        <input name="email" type="email" placeholder="name@example.ru" required />
      </label>
      <label>
        Телефон
        <input name="phone" placeholder="+7..." />
      </label>
      <label>
        Объект
        <select name="building" defaultValue={buildings[0]?.slug}>
          {buildings.map((building) => (
            <option key={building.slug} value={building.slug}>
              {building.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        Навыки
        <input name="skills" placeholder="плотник, сад, повар" />
      </label>
      <label>
        Даты
        <input name="dates" placeholder="1-7 июня" />
      </label>
      <label>
        Комментарий
        <textarea name="comment" rows={5} placeholder="Расскажите, что умеете и когда удобно приехать" />
      </label>
      <label className="checkbox-field">
        <input type="checkbox" required />
        <span>Согласен на обработку персональных данных</span>
      </label>
      <button className="primary-button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Отправляем..." : "Отправить заявку"}
      </button>
    </form>
  );
}
