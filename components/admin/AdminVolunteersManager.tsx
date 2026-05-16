"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Clock, Save, XCircle } from "lucide-react";
import type { VolunteerApplication, VolunteerStatus } from "@/lib/types";

const statusLabels: Record<VolunteerStatus, string> = {
  new: "Новая",
  reviewing: "В обработке",
  approved: "Подтверждена",
  declined: "Отклонена",
  completed: "Отработана"
};

type AdminVolunteersManagerProps = {
  initialApplications: VolunteerApplication[];
};

export function AdminVolunteersManager({ initialApplications }: AdminVolunteersManagerProps) {
  const [applications, setApplications] = useState(initialApplications);
  const [statusFilter, setStatusFilter] = useState<VolunteerStatus | "all">("all");
  const [selectedId, setSelectedId] = useState(initialApplications[0]?.id ?? "");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => statusFilter === "all" || application.status === statusFilter);
  }, [applications, statusFilter]);

  const selectedApplication = useMemo(() => {
    return applications.find((application) => application.id === selectedId) ?? applications[0];
  }, [applications, selectedId]);

  function updateSelected(patch: Partial<VolunteerApplication>) {
    setSavedMessage("");
    setApplications((items) => items.map((item) => (item.id === selectedApplication.id ? { ...item, ...patch } : item)));
  }

  async function patchApplication(patch: Partial<VolunteerApplication>) {
    setIsSaving(true);
    setSavedMessage("");
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/volunteer-applications/${selectedApplication.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(patch)
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить заявку");
      }

      updateSelected(patch);
      setSavedMessage(result.mode === "supabase" ? "Заявка сохранена в Supabase." : "Заявка сохранена в mock-состоянии.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить заявку");
    } finally {
      setIsSaving(false);
    }
  }

  async function confirmHours(hours: number) {
    await patchApplication({
      status: "completed",
      hours,
      points: hours * 5
    });
  }

  if (!selectedApplication) {
    return <div className="admin-panel">Заявок пока нет.</div>;
  }

  return (
    <div className="admin-editor-layout volunteers-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Заявки</h3>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as VolunteerStatus | "all")} aria-label="Фильтр статуса">
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
                <th>Имя</th>
                <th>Объект</th>
                <th>Навыки</th>
                <th>Статус</th>
                <th>Часы</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application.id} className={application.id === selectedApplication.id ? "is-selected" : ""} onClick={() => setSelectedId(application.id)}>
                  <td>{application.name}</td>
                  <td>{application.buildingTitle}</td>
                  <td>{application.skills.join(", ")}</td>
                  <td>{statusLabels[application.status]}</td>
                  <td>{application.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Карточка заявки</h3>
          <button className="primary-button" type="button" onClick={() => patchApplication(selectedApplication)} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}

        <div className="volunteer-card">
          <div>
            <span>Имя</span>
            <strong>{selectedApplication.name}</strong>
          </div>
          <div>
            <span>Email</span>
            <a href={`mailto:${selectedApplication.email}`}>{selectedApplication.email}</a>
          </div>
          <div>
            <span>Телефон</span>
            <a href={`tel:${selectedApplication.phone}`}>{selectedApplication.phone}</a>
          </div>
          <div>
            <span>Объект</span>
            <strong>{selectedApplication.buildingTitle}</strong>
          </div>
          <div>
            <span>Даты</span>
            <strong>{selectedApplication.preferredDates}</strong>
          </div>
          <div>
            <span>Создана</span>
            <strong>{selectedApplication.createdAt}</strong>
          </div>
        </div>

        <label>
          Статус
          <select value={selectedApplication.status} onChange={(event) => patchApplication({ status: event.target.value as VolunteerStatus })} disabled={isSaving}>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Комментарий
          <textarea rows={4} value={selectedApplication.comment} onChange={(event) => updateSelected({ comment: event.target.value })} />
        </label>

        <div className="admin-actions-row">
          <button className="secondary-button" type="button" onClick={() => patchApplication({ status: "approved" })} disabled={isSaving}>
            <CheckCircle2 size={16} />
            Подтвердить
          </button>
          <button className="secondary-button" type="button" onClick={() => patchApplication({ status: "declined" })} disabled={isSaving}>
            <XCircle size={16} />
            Отклонить
          </button>
          <button className="primary-button" type="button" onClick={() => confirmHours(36)} disabled={isSaving}>
            <Clock size={16} />
            Зачесть 36 ч
          </button>
        </div>

        <div className="admin-muted-line">Баллы: {selectedApplication.points}. Формула MVP: 1 час = 5 баллов.</div>
      </section>
    </div>
  );
}
