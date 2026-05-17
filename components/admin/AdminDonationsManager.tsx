"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";
import type { AdminDonation, DonationStatus } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

const statusLabels: Record<DonationStatus, string> = {
  pending: "Ожидает",
  paid: "Оплачен",
  cancelled: "Отменен",
  failed: "Ошибка",
  refunded: "Возврат"
};

type AdminDonationsManagerProps = {
  initialDonations: AdminDonation[];
};

export function AdminDonationsManager({ initialDonations }: AdminDonationsManagerProps) {
  const [donations, setDonations] = useState(initialDonations);
  const [statusFilter, setStatusFilter] = useState<DonationStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(initialDonations[0]?.id ?? "");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredDonations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return donations.filter((donation) => {
      const statusMatch = statusFilter === "all" || donation.status === statusFilter;
      const queryMatch =
        !normalizedQuery ||
        donation.donorName.toLowerCase().includes(normalizedQuery) ||
        donation.donorEmail.toLowerCase().includes(normalizedQuery) ||
        donation.buildingTitle.toLowerCase().includes(normalizedQuery);

      return statusMatch && queryMatch;
    });
  }, [donations, query, statusFilter]);

  const selectedDonation = useMemo(() => {
    return donations.find((donation) => donation.id === selectedId) ?? donations[0];
  }, [donations, selectedId]);

  const totalPaid = donations.filter((donation) => donation.status === "paid").reduce((sum, donation) => sum + donation.amount, 0);

  function updateSelected(patch: Partial<AdminDonation>) {
    setSavedMessage("");
    setDonations((items) => items.map((item) => (item.id === selectedDonation.id ? { ...item, ...patch } : item)));
  }

  async function patchDonationStatus(status: DonationStatus) {
    setIsSaving(true);
    setSaveError("");
    setSavedMessage("");

    try {
      const response = await fetch(`/api/admin/donations/${selectedDonation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось обновить платеж");
      }

      updateSelected({
        status,
        paidAt: status === "paid" ? "только что" : undefined
      });
      setSavedMessage(
        status === "paid"
          ? result.mode === "supabase"
            ? "Платеж подтвержден, прогресс и летопись обновлены в Supabase."
            : "Webhook payment.succeeded обработан в mock-режиме."
          : "Статус платежа обновлен."
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось обновить платеж");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedDonation) {
    return <div className="admin-panel">Донатов пока нет.</div>;
  }

  return (
    <div className="admin-editor-layout donations-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Платежи</h3>
          <span>Оплачено: {formatCurrency(totalPaid)}</span>
        </div>
        <div className="admin-filters-row">
          <label>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по имени, email, объекту" />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DonationStatus | "all")} aria-label="Фильтр платежей">
            <option value="all">Все статусы</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Донатор</th>
                <th>Объект</th>
                <th>Слот</th>
                <th>Сумма</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className={donation.id === selectedDonation.id ? "is-selected" : ""} onClick={() => setSelectedId(donation.id)}>
                  <td>{donation.donorName}</td>
                  <td>{donation.buildingTitle}</td>
                  <td>{donation.slotTitle}</td>
                  <td>{formatCurrency(donation.amount)}</td>
                  <td>{statusLabels[donation.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Платеж</h3>
          <span>{selectedDonation.id}</span>
        </div>
        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}
        <div className="volunteer-card">
          <div>
            <span>Донатор</span>
            <strong>{selectedDonation.donorName}</strong>
          </div>
          <div>
            <span>Email</span>
            <a href={`mailto:${selectedDonation.donorEmail}`}>{selectedDonation.donorEmail}</a>
          </div>
          <div>
            <span>Объект</span>
            <strong>{selectedDonation.buildingTitle}</strong>
          </div>
          <div>
            <span>Слот</span>
            <strong>{selectedDonation.slotTitle}</strong>
          </div>
          <div>
            <span>Создан</span>
            <strong>{selectedDonation.createdAt}</strong>
          </div>
          <div>
            <span>Оплачен</span>
            <strong>{selectedDonation.paidAt ?? "нет"}</strong>
          </div>
        </div>
        <label>
          Статус
          <select value={selectedDonation.status} onChange={(event) => patchDonationStatus(event.target.value as DonationStatus)} disabled={isSaving}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="donation-total-box">
          <span>Сумма платежа</span>
          <strong>{formatCurrency(selectedDonation.amount)}</strong>
        </div>
        <div className="admin-actions-row">
          <button className="primary-button" type="button" onClick={() => patchDonationStatus("paid")} disabled={isSaving}>
            <CheckCircle2 size={16} />
            {isSaving ? "Сохраняем..." : "Подтвердить оплату"}
          </button>
          <button className="secondary-button" type="button" onClick={() => patchDonationStatus("pending")} disabled={isSaving}>
            <RefreshCw size={16} />
            Вернуть pending
          </button>
        </div>
        <div className="admin-muted-line">
          В автоматическом сценарии `paid` ставит webhook ЮKassa. Для Т-Банк Сборов это ручное подтверждение после сверки поступления.
        </div>
      </aside>
    </div>
  );
}
