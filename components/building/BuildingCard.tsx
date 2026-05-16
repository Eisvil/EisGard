import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import type { Building } from "@/lib/types";
import { statusLabels, zoneLabels } from "@/lib/seed";
import { ProgressSummary } from "./ProgressSummary";
import { BuildingIcon } from "@/components/BuildingIcon";

type BuildingCardProps = {
  building: Building;
  compact?: boolean;
};

export function BuildingCard({ building, compact = false }: BuildingCardProps) {
  return (
    <article className="parchment grid gap-4 p-4 text-ink">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink-soft text-gold">
          <BuildingIcon name={building.icon} size={24} />
        </span>
        <div>
          <h2 className="font-display text-2xl leading-none">{building.title}</h2>
          <p className="mt-1 text-sm text-ink/72">{zoneLabels[building.zone]} зона</p>
        </div>
      </div>

      <div className="relative aspect-[4/3] overflow-hidden rounded-md border border-black/10">
        <Image src={building.image} alt={building.title} fill className="object-cover" sizes={compact ? "280px" : "420px"} />
        <span className="absolute left-3 top-3 rounded-full bg-ink/78 px-3 py-1 text-xs font-semibold text-parchment-light">
          {statusLabels[building.status]}
        </span>
      </div>

      <p className="text-sm leading-6 text-ink/84">{compact ? building.shortDescription : building.description}</p>

      <ProgressSummary collected={building.collected} budget={building.budget} />

      <div className="grid gap-2">
        <Link href={`/objects/${building.slug}`} className="primary-button w-full">
          Поддержать объект
          <Heart size={17} />
        </Link>
        <Link href={`/objects/${building.slug}`} className="secondary-button w-full">
          Подробнее об объекте
          <ArrowRight size={17} />
        </Link>
      </div>
    </article>
  );
}
