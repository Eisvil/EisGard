"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { Save } from "lucide-react";
import type { Building, DonationSlot } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type EditableSlot = DonationSlot & {
  buildingSlug: string;
  status: "available" | "funded" | "hidden";
};

type AdminCollectionItemsManagerProps = {
  buildings: Building[];
};

function flattenSlots(buildings: Building[]): EditableSlot[] {
  return buildings.flatMap((building) =>
    building.slots.map((slot) => ({
      ...slot,
      buildingSlug: building.slug,
      status: "available" as const
    }))
  );
}

export function AdminCollectionItemsManager({ buildings }: AdminCollectionItemsManagerProps) {
  const [slots, setSlots] = useState<EditableSlot[]>(() => flattenSlots(buildings));
  const [selectedId, setSelectedId] = useState(slots[0]?.id ?? "");
  const [buildingFilter, setBuildingFilter] = useState("all");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => buildingFilter === "all" || slot.buildingSlug === buildingFilter);
  }, [buildingFilter, slots]);

  const selectedSlot = useMemo(() => {
    return slots.find((slot) => slot.id === selectedId) ?? slots[0];
  }, [selectedId, slots]);

  function updateSelected(patch: Partial<EditableSlot>) {
    setSavedMessage("");
    setSlots((items) => items.map((slot) => (slot.id === selectedSlot.id ? { ...slot, ...patch } : slot)));
  }

  function updateTextField(field: keyof Pick<EditableSlot, "title" | "description">) {
    return (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      updateSelected({ [field]: event.target.value } as Partial<EditableSlot>);
    };
  }

  async function handleSave() {
    setIsSaving(true);
    setSavedMessage("");
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/collection-items/${selectedSlot.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(selectedSlot)
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить слот");
      }

      setSavedMessage(result.mode === "supabase" ? "Слот сохранен в Supabase." : "Слот сохранен в mock-состоянии.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить слот");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedSlot) {
    return <div className="admin-panel">Нет слотов для редактирования.</div>;
  }

  const selectedBuilding = buildings.find((building) => building.slug === selectedSlot.buildingSlug);

  return (
    <div className="admin-editor-layout slots-layout">
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h3>Слоты поддержки</h3>
          <select value={buildingFilter} onChange={(event) => setBuildingFilter(event.target.value)} aria-label="Фильтр по зданию">
            <option value="all">Все здания</option>
            {buildings.map((building) => (
              <option key={building.slug} value={building.slug}>
                {building.title}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Слот</th>
                <th>Здание</th>
                <th>Цена</th>
                <th>Остаток</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {filteredSlots.map((slot) => {
                const building = buildings.find((item) => item.slug === slot.buildingSlug);

                return (
                  <tr key={`${slot.buildingSlug}-${slot.id}`} className={slot.id === selectedSlot.id ? "is-selected" : ""} onClick={() => setSelectedId(slot.id)}>
                    <td>{slot.title}</td>
                    <td>{building?.title ?? slot.buildingSlug}</td>
                    <td>{formatCurrency(slot.price)}</td>
                    <td>{slot.remaining}</td>
                    <td>{slot.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Редактор слота</h3>
          <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}
        <div className="admin-form-grid">
          <label>
            Здание
            <select value={selectedSlot.buildingSlug} onChange={(event) => updateSelected({ buildingSlug: event.target.value })}>
              {buildings.map((building) => (
                <option key={building.slug} value={building.slug}>
                  {building.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Статус
            <select value={selectedSlot.status} onChange={(event) => updateSelected({ status: event.target.value as EditableSlot["status"] })}>
              <option value="available">available</option>
              <option value="funded">funded</option>
              <option value="hidden">hidden</option>
            </select>
          </label>
          <label className="admin-form-wide">
            Название
            <input value={selectedSlot.title} onChange={updateTextField("title")} />
          </label>
          <label>
            Цена
            <input type="number" value={selectedSlot.price} onChange={(event) => updateSelected({ price: Number(event.target.value) })} />
          </label>
          <label>
            Остаток
            <input type="number" value={selectedSlot.remaining} onChange={(event) => updateSelected({ remaining: Number(event.target.value) })} />
          </label>
          <label className="admin-form-wide">
            Описание
            <textarea rows={4} value={selectedSlot.description} onChange={updateTextField("description")} />
          </label>
        </div>
        <div className="admin-muted-line">
          Связанное здание: {selectedBuilding?.title ?? "не выбрано"}. После Supabase это будет таблица `collection_items`.
        </div>
      </section>
    </div>
  );
}
