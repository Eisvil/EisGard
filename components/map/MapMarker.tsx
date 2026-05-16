import type { Building } from "@/lib/types";
import { BuildingIcon } from "@/components/BuildingIcon";

type MapMarkerProps = {
  building: Building;
  active: boolean;
  onSelect: (building: Building) => void;
};

export function MapMarker({ building, active, onSelect }: MapMarkerProps) {
  return (
    <button
      type="button"
      className={`map-marker ${active ? "is-active" : ""}`}
      style={{ left: `${building.marker.x}%`, top: `${building.marker.y}%` }}
      onClick={() => onSelect(building)}
      aria-label={`Открыть ${building.title}`}
    >
      <span className="map-marker__icon">
        <BuildingIcon name={building.icon} size={24} />
      </span>
      <span className="map-marker__label">{building.title}</span>
    </button>
  );
}
