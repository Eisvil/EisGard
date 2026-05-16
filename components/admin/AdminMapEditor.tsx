"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Save } from "lucide-react";
import { BuildingIcon } from "@/components/BuildingIcon";
import type { Building } from "@/lib/types";

type AdminMapEditorProps = {
  buildings: Building[];
};

export function AdminMapEditor({ buildings }: AdminMapEditorProps) {
  const [items, setItems] = useState(buildings);
  const [selectedSlug, setSelectedSlug] = useState(buildings[0]?.slug ?? "");
  const [savedMessage, setSavedMessage] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const selectedBuilding = useMemo(() => {
    return items.find((building) => building.slug === selectedSlug) ?? items[0];
  }, [items, selectedSlug]);

  function updateMarker(axis: "x" | "y", value: number) {
    setSavedMessage("");
    setItems((buildings) =>
      buildings.map((building) =>
        building.slug === selectedBuilding.slug
          ? {
              ...building,
              marker: {
                ...building.marker,
                [axis]: value
              }
            }
          : building
      )
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setSavedMessage("");
    setSaveError("");

    try {
      const response = await fetch(`/api/admin/map-markers/${selectedBuilding.slug}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          x: selectedBuilding.marker.x,
          y: selectedBuilding.marker.y
        })
      });
      const result = (await response.json()) as { ok?: boolean; message?: string; mode?: string };

      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "Не удалось сохранить маркер");
      }

      setSavedMessage(result.mode === "supabase" ? "Координаты сохранены в Supabase." : "Координаты сохранены в mock-состоянии.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Не удалось сохранить маркер");
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedBuilding) {
    return <div className="admin-panel">Нет маркеров для редактирования.</div>;
  }

  return (
    <div className="admin-map-layout">
      <section className="admin-panel admin-map-canvas">
        <div className="admin-panel__head">
          <h3>Активная карта</h3>
          <button className="primary-button" type="button" onClick={handleSave} disabled={isSaving}>
            <Save size={16} />
            {isSaving ? "Сохраняем..." : "Сохранить"}
          </button>
        </div>
        {savedMessage ? <div className="admin-success">{savedMessage}</div> : null}
        {saveError ? <div className="form-error">{saveError}</div> : null}
        <div className="admin-map-frame">
          <Image src="/assets/settlement-map.png" alt="Карта поселения" width={1672} height={941} className="admin-map-image" priority />
          {items.map((building) => (
            <button
              key={building.slug}
              className={`admin-map-marker ${building.slug === selectedSlug ? "is-selected" : ""}`}
              style={{ left: `${building.marker.x}%`, top: `${building.marker.y}%` }}
              type="button"
              onClick={() => setSelectedSlug(building.slug)}
              aria-label={`Редактировать маркер ${building.title}`}
            >
              <BuildingIcon name={building.icon} size={18} />
            </button>
          ))}
        </div>
      </section>

      <aside className="admin-panel admin-form-panel">
        <div className="admin-panel__head">
          <h3>Маркер</h3>
          <span>{selectedBuilding.title}</span>
        </div>
        <label>
          Здание
          <select value={selectedSlug} onChange={(event) => setSelectedSlug(event.target.value)}>
            {items.map((building) => (
              <option key={building.slug} value={building.slug}>
                {building.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          X: {selectedBuilding.marker.x.toFixed(1)}%
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={selectedBuilding.marker.x}
            onChange={(event) => updateMarker("x", Number(event.target.value))}
          />
        </label>
        <label>
          Y: {selectedBuilding.marker.y.toFixed(1)}%
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={selectedBuilding.marker.y}
            onChange={(event) => updateMarker("y", Number(event.target.value))}
          />
        </label>
        <div className="admin-muted-line">Координаты хранятся в процентах, поэтому маркеры сохраняют позицию при масштабировании карты.</div>
      </aside>
    </div>
  );
}
