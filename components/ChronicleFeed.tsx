import Link from "next/link";
import { Clock, ScrollText } from "lucide-react";
import type { ChronicleEntry } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type ChronicleFeedProps = {
  entries: ChronicleEntry[];
  showAllLink?: boolean;
};

export function ChronicleFeed({ entries, showAllLink = false }: ChronicleFeedProps) {
  return (
    <div className="grid gap-3">
      {entries.map((entry) => (
        <article key={entry.id} className="flex gap-3 rounded-md border border-black/10 bg-parchment-light/62 p-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink-soft text-gold">
            <ScrollText size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm leading-6">
              <strong>{entry.name}</strong> {entry.action}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink/62">
              {entry.amount ? <span>{formatCurrency(entry.amount)}</span> : null}
              {entry.hours ? <span>{entry.hours} волонтерских часов</span> : null}
              <span className="inline-flex items-center gap-1">
                <Clock size={13} />
                {entry.time}
              </span>
            </div>
          </div>
        </article>
      ))}
      {showAllLink ? (
        <Link href="/chronicle" className="secondary-button justify-self-start">
          Смотреть всю летопись
        </Link>
      ) : null}
    </div>
  );
}
