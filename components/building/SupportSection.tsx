"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Heart, X } from "lucide-react";
import type { ChronicleEntry, DonationSlot } from "@/lib/types";
import { formatCurrency } from "@/lib/format";
import { ProgressSummary } from "./ProgressSummary";
import { ChronicleFeed } from "@/components/ChronicleFeed";

type SupportSectionProps = {
  buildingSlug: string;
  buildingTitle: string;
  collected: number;
  budget: number;
  slots: DonationSlot[];
  chronicleEntries: ChronicleEntry[];
};

type MockDonation = {
  slot: DonationSlot;
  donorName: string;
  donorEmail: string;
  publishName: boolean;
};

export function SupportSection({ buildingSlug, buildingTitle, collected, budget, slots, chronicleEntries }: SupportSectionProps) {
  const [selectedSlot, setSelectedSlot] = useState<DonationSlot | null>(null);
  const [localCollected, setLocalCollected] = useState(collected);
  const [fundedSlotIds, setFundedSlotIds] = useState<string[]>([]);
  const [localEntries, setLocalEntries] = useState<ChronicleEntry[]>([]);
  const [lastDonation, setLastDonation] = useState<MockDonation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const visibleSlots = useMemo(() => {
    return slots.map((slot) => ({
      ...slot,
      remaining: Math.max(0, slot.remaining - fundedSlotIds.filter((id) => id === slot.id).length)
    }));
  }, [fundedSlotIds, slots]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSlot) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const formData = new FormData(event.currentTarget);
    const donorName = String(formData.get("name") ?? "").trim() || "Тайный доброхот";
    const donorEmail = String(formData.get("email") ?? "").trim();
    const publishName = formData.get("publishName") === "on";
    const publicName = publishName ? donorName : "Тайный доброхот";

    try {
      const response = await fetch("/api/donations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          buildingSlug,
          slotId: selectedSlot.id,
          donorName,
          donorEmail,
          amount: selectedSlot.price,
          publishName
        })
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось создать mock-вклад");
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось отправить вклад");
      setIsSubmitting(false);
      return;
    }

    setLocalCollected((value) => Math.min(budget, value + selectedSlot.price));
    setFundedSlotIds((ids) => [...ids, selectedSlot.id]);
    setLocalEntries((entries) => [
      {
        id: `local-${Date.now()}`,
        name: publicName,
        action: `поддержал(а) "${selectedSlot.title}"`,
        amount: selectedSlot.price,
        time: "только что",
        buildingSlug
      },
      ...entries
    ]);
    setLastDonation({ slot: selectedSlot, donorName, donorEmail, publishName });
    setSelectedSlot(null);
    setIsSubmitting(false);
  }

  return (
    <div className="support-section">
      <div className="support-summary">
        <div>
          <p className="eyebrow">Прогресс после mock-вклада</p>
          <h2>Поддержать {buildingTitle.toLowerCase()}</h2>
        </div>
        <ProgressSummary collected={localCollected} budget={budget} />
      </div>

      {lastDonation ? (
        <div className="success-note" role="status">
          <CheckCircle2 size={21} />
          <span>
            Вклад от {lastDonation.publishName ? lastDonation.donorName : "Тайного доброхота"} принят в mock-режиме:
            {" "}
            {lastDonation.slot.title}, {formatCurrency(lastDonation.slot.price)}.
          </span>
        </div>
      ) : null}

      <div className="grid gap-3">
        {visibleSlots.map((slot) => {
          const isFunded = slot.remaining <= 0;

          return (
            <article key={slot.id} className="grid grid-cols-[76px_1fr_auto] items-center gap-3 rounded-md border border-black/10 bg-parchment-light/62 p-3 max-sm:grid-cols-[64px_1fr]">
              <div className="relative aspect-square overflow-hidden rounded border border-black/10">
                <Image src={slot.image} alt={slot.title} fill className="object-cover" sizes="80px" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg leading-tight">{slot.title}</h3>
                <p className="mt-1 text-sm font-semibold">{formatCurrency(slot.price)}</p>
                <p className="mt-1 text-xs text-ink/65">{isFunded ? "Слот закрыт" : `Осталось ${slot.remaining} шт.`}</p>
              </div>
              <button className="primary-button min-w-28 max-sm:col-span-2" type="button" onClick={() => setSelectedSlot(slot)} disabled={isFunded}>
                <Heart size={16} />
                {isFunded ? "Закрыт" : "Выбрать"}
              </button>
            </article>
          );
        })}
      </div>

      <div className="support-chronicle">
        {localEntries.length ? (
          <div className="grid gap-3">
            {localEntries.map((entry) => (
              <article key={entry.id} className="flex gap-3 rounded-md border border-forest/20 bg-forest/10 p-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-parchment-light">
                  <CheckCircle2 size={19} />
                </span>
                <div>
                  <p className="text-sm leading-6">
                    <strong>{entry.name}</strong> {entry.action}
                  </p>
                  <p className="text-xs text-ink/62">
                    {entry.amount ? formatCurrency(entry.amount) : null} · {entry.time}
                  </p>
                </div>
              </article>
            ))}
          </div>
        ) : null}
        <ChronicleFeed entries={chronicleEntries} showAllLink />
      </div>

      {selectedSlot ? (
        <div className="donation-modal" role="dialog" aria-modal="true" aria-labelledby="donation-title">
          <div className="donation-modal__backdrop" onClick={() => setSelectedSlot(null)} />
          <form className="parchment donation-form" onSubmit={handleSubmit}>
            <button className="donation-form__close" type="button" onClick={() => setSelectedSlot(null)} aria-label="Закрыть форму">
              <X size={20} />
            </button>
            <p className="eyebrow">Mock donation</p>
            <h2 id="donation-title">Поддержать "{selectedSlot.title}"</h2>
            <p>
              Сейчас это тестовый сценарий без оплаты. После подключения ЮKassa этот шаг будет создавать платеж и ждать webhook.
            </p>
            <label>
              Имя для летописи
              <input name="name" placeholder="Иван Петров" required />
            </label>
            <label>
              Email
              <input name="email" type="email" placeholder="name@example.ru" required />
            </label>
            <label className="checkbox-field">
              <input name="publishName" type="checkbox" defaultChecked />
              <span>Показать имя в летописи</span>
            </label>
            {submitError ? <div className="form-error">{submitError}</div> : null}
            <div className="donation-form__total">
              <span>Сумма mock-вклада</span>
              <strong>{formatCurrency(selectedSlot.price)}</strong>
            </div>
            <button className="primary-button" type="submit" disabled={isSubmitting}>
              <CheckCircle2 size={18} />
              {isSubmitting ? "Отправляем..." : "Подтвердить mock-вклад"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
