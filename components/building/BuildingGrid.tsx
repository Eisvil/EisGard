import Image from "next/image";
import Link from "next/link";
import type { Building } from "@/lib/types";
import { formatCurrency, formatPercent, getProgress } from "@/lib/format";
import { statusLabels, zoneLabels } from "@/lib/seed";
import { BuildingIcon } from "@/components/BuildingIcon";

type BuildingGridProps = {
  buildings: Building[];
};

export function BuildingGrid({ buildings }: BuildingGridProps) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {buildings.map((building) => {
        const progress = getProgress(building.collected, building.budget);

        return (
          <Link key={building.slug} href={`/objects/${building.slug}`} className="parchment group block overflow-hidden text-ink transition hover:-translate-y-1">
            <article>
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image src={building.image} alt={building.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 25vw" />
                <span className="absolute left-3 top-3 rounded-full bg-ink/78 px-3 py-1 text-xs font-semibold text-parchment-light">
                  {statusLabels[building.status]}
                </span>
              </div>
              <div className="grid gap-3 p-4">
                <div className="flex items-center gap-2">
                  <BuildingIcon name={building.icon} size={21} className="text-forest" />
                  <div>
                    <h3 className="font-display text-xl leading-tight">{building.title}</h3>
                    <p className="text-xs text-ink/62">{zoneLabels[building.zone]}</p>
                  </div>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>{formatPercent(progress)}</span>
                  <span>{formatCurrency(building.collected)}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-sm text-ink/68">{building.slots.reduce((sum, slot) => sum + slot.remaining, 0)} слотов свободно</p>
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
