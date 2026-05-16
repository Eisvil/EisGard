"use client";

import { useMemo, useState } from "react";
import { Eye, EyeOff, Pin, Save } from "lucide-react";
import type { ChronicleEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type ModeratedEntry = ChronicleEntry & {
  type: "donation" | "volunteer_hours" | "project_news";
  isVisible: boolean;
  isPinned: boolean;
};

type AdminChronicleManagerProps = {
  initialEntries: ChronicleEntry[];
};

function toModeratedEntries(entries: ChronicleEntry[]): ModeratedEntry[] {
  return entries.map((entry) => ({
    ...entry,
    type: entry.hours ? "volunteer_hours" : "donation",
    isVisible: true,
    isPinned: entry.id === "1"
  }));
}

const typeLabels: Record<ModeratedEntry["type"], string> = {
  donation: "Донат",
  volunteer_hours: "Волонтерские часы",
  project_news: "Новость проекта"
};

export function AdminChronicleManager({ initialEntries }: AdminChronicleManagerProps) {
  const [entries, setEntries] = useState<ModeratedEntry[]>(() => toModeratedEntries(initialEntries));
  const [selectedId, setSelectedId] = useState(initialEntries[0]?.id ?? "");
  const [typeFilter, setTypeFilter] = useState<ModeratedEntry["type"] | "all">("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const typeMatch = typeFilter === "all" || entry.type === typeFilter;
      const visibilityMatch =
        visibilityFilter === "all" ||
        (visibilityFilter === "visible" && entry.isVisible) ||
        (visibilityFilter === "hidden" && !entry.isVisible);

      return typeMatch && visibilityMatch;
    });
  }, [entries, typeFilter, visibilityFilter]);

  const selectedEntry = useMemo(() => {
    return entries.find((entry) => entry.id === selectedId) ?? entries[0];
  }, [entries, selectedId]);

  function updateSelected(patch: Partial<ModeratedEntry>) {
    setSavedMessage("");
    setEntries((items) => items.map((entry) => (entry.id === selectedEntry.id ? { ...entry, ...patch } : entry)));
  }

  async function handleSave() {
    setIsSaving(true);
    setSavedMessage("");
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/chronicle/${selectedEntry.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          publicName: selectedEntry.name,
          text: selectedEntry.action,
          isVisible: selectedEntry.isVisible,
          isPinned: selectedEntry.isPinned
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить запись");
      }

      setSavedMessage(result.mode === "supabase" ? "Запись сохранена в Supabase." : "Запись летописи сохранена в mock-состоянии.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить запись");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedEntry) {
    return <div className="admin-panel">Записей летописи пока нет.</div>;
  }

  return (
    <div className="admin-editor-layout chronicle-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Записи летописи</h3>
          <div className="admin-inline-controls">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as ModeratedEntry["type"] | "all")} aria-label="Тип записи">
              <option value="all">Все типы</option>
              {Object.entries(typeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select value={visibilityFilter} onChange={(event) => setVisibilityFilter(event.target.value as "all" | "visible" | "hidden")} aria-label="Видимость">
              <option value="all">Все</option>
              <option value="visible">Видимые</option>
              <option value="hidden">Скрытые</option>
            </select>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Имя</th>
                <th>Событие</th>
                <th>Тип</th>
                <th>Сумма/часы</th>
                <th>Видимость</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className={entry.id === selectedEntry.id ? "is-selected" : ""} onClick={() => setSelectedId(entry.id)}>
                  <td>{entry.name}</td>
                  <td>{entry.action}</td>
                  <td>{typeLabels[entry.type]}</td>
                  <td>{entry.amount ? formatCurrency(entry.amount) : `${entry.hours ?? 0} ч`}</td>
                  <td>{entry.isVisible ? "Видна" : "Скрыта"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Модерация</h3>
          <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}

        <div className="volunteer-card">
          <div>
            <span>Автор</span>
            <strong>{selectedEntry.name}</strong>
          </div>
          <div>
            <span>Время</span>
            <strong>{selectedEntry.time}</strong>
          </div>
          <div>
            <span>Тип</span>
            <strong>{typeLabels[selectedEntry.type]}</strong>
          </div>
          <div>
            <span>Закреплена</span>
            <strong>{selectedEntry.isPinned ? "да" : "нет"}</strong>
          </div>
        </div>

        <label>
          Публичное имя
          <input value={selectedEntry.name} onChange={(event) => updateSelected({ name: event.target.value })} />
        </label>
        <label>
          Текст события
          <textarea rows={4} value={selectedEntry.action} onChange={(event) => updateSelected({ action: event.target.value })} />
        </label>

        <div className="admin-actions-row">
          <button className="secondary-button" type="button" onClick={() => updateSelected({ isVisible: !selectedEntry.isVisible })}>
            {selectedEntry.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            {selectedEntry.isVisible ? "Скрыть" : "Показать"}
          </button>
          <button className="secondary-button" type="button" onClick={() => updateSelected({ isPinned: !selectedEntry.isPinned })}>
            <Pin size={16} />
            {selectedEntry.isPinned ? "Открепить" : "Закрепить"}
          </button>
        </div>

        <div className="admin-muted-line">После подключения Supabase это будет CRUD по `chronicle_entries` с модерацией.</div>
      </aside>
    </div>
  );
}
