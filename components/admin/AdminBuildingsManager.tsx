"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Eye, Save } from "lucide-react";
import { BuildingCard } from "@/components/building/BuildingCard";
import type { Building, BuildingStatus, BuildingZone } from "@/lib/types";
import { formatCurrency, formatPercent, getProgress } from "@/lib/format";
import { statusLabels, zoneLabels } from "@/lib/seed";

type AdminBuildingsManagerProps = {
  initialBuildings: Building[];
};

export function AdminBuildingsManager({ initialBuildings }: AdminBuildingsManagerProps) {
  const [buildings, setBuildings] = useState(initialBuildings);
  const [selectedSlug, setSelectedSlug] = useState(initialBuildings[0]?.slug ?? "");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedBuilding = useMemo(() => {
    return buildings.find((building) => building.slug === selectedSlug) ?? buildings[0];
  }, [buildings, selectedSlug]);

  function updateSelected(patch: Partial<Building>) {
    setSavedMessage("");
    setBuildings((items) => items.map((building) => (building.slug === selectedBuilding.slug ? { ...building, ...patch } : building)));
  }

  function updateTextField(field: keyof Pick<Building, "title" | "shortDescription" | "description" | "historicalNote">) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateSelected({ [field]: event.target.value } as Partial<Building>);
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setSaveError("");
    setSavedMessage("");

    try {
      const response = await fetch(`/api/admin/buildings/${selectedBuilding.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(selectedBuilding)
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить здание");
      }

      setSavedMessage(result.mode === "supabase" ? "Здание сохранено в Supabase." : "Изменения сохранены в mock-состоянии.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить здание");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedBuilding) {
    return <div className="admin-panel">Нет зданий для редактирования.</div>;
  }

  return (
    <div className="admin-editor-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Здания</h3>
          <span>{buildings.length} объекта</span>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Название</th>
                <th>Зона</th>
                <th>Статус</th>
                <th>Прогресс</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => {
                const progress = getProgress(building.collected, building.budget);

                return (
                  <tr key={building.slug} className={building.slug === selectedSlug ? "is-selected" : ""} onClick={() => setSelectedSlug(building.slug)}>
                    <td>{building.title}</td>
                    <td>{zoneLabels[building.zone]}</td>
                    <td>{statusLabels[building.status]}</td>
                    <td>{formatPercent(progress)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Редактор здания</h3>
          <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>

        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}

        <div className="admin-form-grid">
          <label>
            Название
            <input value={selectedBuilding.title} onChange={updateTextField("title")} />
          </label>
          <label>
            Slug
            <input value={selectedBuilding.slug} readOnly />
          </label>
          <label>
            Зона
            <select value={selectedBuilding.zone} onChange={(event) => updateSelected({ zone: event.target.value as BuildingZone })}>
              {Object.entries(zoneLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select value={selectedBuilding.status} onChange={(event) => updateSelected({ status: event.target.value as BuildingStatus })}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Бюджет
            <input
              type="number"
              value={selectedBuilding.budget}
              onChange={(event) => updateSelected({ budget: Number(event.target.value) })}
            />
          </label>
          <label>
            Собрано
            <input
              type="number"
              value={selectedBuilding.collected}
              onChange={(event) => updateSelected({ collected: Number(event.target.value) })}
            />
          </label>
          <label className="admin-form-wide">
            Краткое описание
            <input value={selectedBuilding.shortDescription} onChange={updateTextField("shortDescription")} />
          </label>
          <label className="admin-form-wide">
            Описание
            <textarea rows={4} value={selectedBuilding.description} onChange={updateTextField("description")} />
          </label>
          <label className="admin-form-wide">
            Историческая справка
            <textarea rows={4} value={selectedBuilding.historicalNote} onChange={updateTextField("historicalNote")} />
          </label>
        </div>

        <div className="admin-muted-line">
          <Eye size={16} />
          Публичная карточка обновляется локально. Бюджет: {formatCurrency(selectedBuilding.budget)}.
        </div>
      </section>

      <aside className="admin-preview">
        <BuildingCard building={selectedBuilding} />
      </aside>
    </div>
  );
}
