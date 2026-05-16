"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
import type { Building, BuildingStatus, BuildingZone } from "@/lib/types";
import { statusLabels, zoneLabels } from "@/lib/seed";
import { BuildingCard } from "@/components/building/BuildingCard";
import { MapMarker } from "./MapMarker";

const zones: Array<BuildingZone | "all"> = ["all", "craft", "public", "household", "residential"];
const statuses: Array<BuildingStatus | "all"> = ["all", "idea", "fundraising", "building", "active"];

type SettlementMapProps = {
  buildings: Building[];
};

export function SettlementMap({ buildings }: SettlementMapProps) {
  const [selected, setSelected] = useState<Building>(buildings[0]);
  const [zone, setZone] = useState<BuildingZone | "all">("all");
  const [status, setStatus] = useState<BuildingStatus | "all">("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredBuildings = useMemo(() => {
    return buildings.filter((building) => {
      const zoneMatch = zone === "all" || building.zone === zone;
      const statusMatch = status === "all" || building.status === status;
      return zoneMatch && statusMatch;
    });
  }, [buildings, zone, status]);

  function selectBuilding(building: Building) {
    setSelected(building);
    setSheetOpen(true);
  }

  return (
    <section className="map-section">
      <div className="map-toolbar shell">
        <div>
          <p className="eyebrow">Интерактивная карта</p>
          <h1>Выберите, что построим вместе</h1>
        </div>
        <div className="filters" aria-label="Фильтры карты">
          <select value={zone} onChange={(event) => setZone(event.target.value as BuildingZone | "all")} aria-label="Фильтр по зоне">
            {zones.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Все зоны" : zoneLabels[item]}
              </option>
            ))}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as BuildingStatus | "all")} aria-label="Фильтр по статусу">
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "Все статусы" : statusLabels[item]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="settlement-stage shell">
        <div className="map-card">
          <Image
            src="/assets/settlement-map.png"
            alt="Карта исторического поселения"
            width={1672}
            height={941}
            className="settlement-image"
            priority
            sizes="(max-width: 1024px) 100vw, 1120px"
          />
          <div className="map-vignette" />
          {filteredBuildings.map((building) => (
            <MapMarker key={building.slug} building={building} active={building.slug === selected.slug} onSelect={selectBuilding} />
          ))}
          <div className="legend" aria-label="Легенда статусов">
            {(["idea", "fundraising", "building", "active"] as BuildingStatus[]).map((item) => (
              <span key={item}>
                <i data-status={item} />
                {statusLabels[item]}
              </span>
            ))}
          </div>
        </div>

        <aside className="desktop-card">
          <BuildingCard building={selected} />
        </aside>
      </div>

      <div className={`mobile-sheet ${sheetOpen ? "is-open" : ""}`} aria-hidden={!sheetOpen}>
        <div className="mobile-sheet__panel">
          <button className="mobile-sheet__close" type="button" onClick={() => setSheetOpen(false)} aria-label="Закрыть карточку">
            <X size={20} />
          </button>
          <BuildingCard building={selected} compact />
        </div>
      </div>
    </section>
  );
}
