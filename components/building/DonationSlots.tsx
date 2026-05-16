import Image from "next/image";
import { Heart } from "lucide-react";
import type { DonationSlot } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

type DonationSlotsProps = {
  slots: DonationSlot[];
};

export function DonationSlots({ slots }: DonationSlotsProps) {
  return (
    <div className="grid gap-3">
      {slots.map((slot) => (
        <article key={slot.id} className="grid grid-cols-[76px_1fr_auto] items-center gap-3 rounded-md border border-black/10 bg-parchment-light/62 p-3 max-sm:grid-cols-[64px_1fr]">
          <div className="relative aspect-square overflow-hidden rounded border border-black/10">
            <Image src={slot.image} alt={slot.title} fill className="object-cover" sizes="80px" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-lg leading-tight">{slot.title}</h3>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(slot.price)}</p>
            <p className="mt-1 text-xs text-ink/65">Осталось {slot.remaining} шт.</p>
          </div>
          <button className="primary-button min-w-28 max-sm:col-span-2" type="button">
            <Heart size={16} />
            Выбрать
          </button>
        </article>
      ))}
    </div>
  );
}

