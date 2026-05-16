import type { IconName } from "@/lib/icons";
import type { AdminDonation, Building, BuildingStatus, BuildingZone, ChronicleEntry, DonationSlot, VolunteerApplication } from "@/lib/types";

type CollectionItemRow = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  unit_amount: number | null;
  quantity_total: number | null;
  quantity_funded: number | null;
};

type BuildingRow = {
  slug: string;
  title: string;
  zone: BuildingZone;
  status: BuildingStatus;
  short_description: string | null;
  description: string | null;
  historical_note: string | null;
  budget_amount: number | null;
  collected_amount: number | null;
  main_image_url: string | null;
  icon_lucide_name: IconName | null;
  map_markers?: Array<{
    x_percent: number | string | null;
    y_percent: number | string | null;
  }>;
  collection_items?: CollectionItemRow[];
};

type ChronicleRow = {
  id: string;
  public_name: string | null;
  text: string;
  amount: number | null;
  hours: number | null;
  created_at: string;
  buildings?:
    | {
        slug: string;
      }
    | Array<{
    slug: string;
  }>
    | null;
};

type DonationRow = {
  id: string;
  donor_name: string;
  donor_email: string;
  amount: number;
  status: AdminDonation["status"];
  created_at: string;
  paid_at: string | null;
  buildings?:
    | {
        slug: string;
        title: string;
      }
    | Array<{
        slug: string;
        title: string;
      }>
    | null;
  collection_items?:
    | {
        title: string;
      }
    | Array<{
        title: string;
      }>
    | null;
};

type VolunteerApplicationRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  skills: string[] | null;
  preferred_dates: string | null;
  comment: string | null;
  status: VolunteerApplication["status"];
  created_at: string;
  buildings?:
    | {
        slug: string;
        title: string;
      }
    | Array<{
        slug: string;
        title: string;
      }>
    | null;
  volunteer_hours?: Array<{
    hours: number;
    points: number;
  }>;
};

const fallbackIcon: IconName = "Home";

function firstRelation<T>(value: T | T[] | null | undefined): T | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value ?? undefined;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  if (value === null || value === undefined) {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function mapSlot(row: CollectionItemRow): DonationSlot {
  const quantityTotal = row.quantity_total ?? 0;
  const quantityFunded = row.quantity_funded ?? 0;

  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: row.unit_amount ?? 0,
    remaining: Math.max(0, quantityTotal - quantityFunded),
    image: row.image_url ?? "/assets/buildings/kuznica.png"
  };
}

export function mapBuilding(row: BuildingRow): Building {
  const marker = row.map_markers?.[0];

  return {
    slug: row.slug,
    title: row.title,
    zone: row.zone,
    status: row.status,
    icon: row.icon_lucide_name ?? fallbackIcon,
    marker: {
      x: toNumber(marker?.x_percent, 50),
      y: toNumber(marker?.y_percent, 50)
    },
    shortDescription: row.short_description ?? "",
    description: row.description ?? "",
    historicalNote: row.historical_note ?? "",
    budget: row.budget_amount ?? 0,
    collected: row.collected_amount ?? 0,
    image: row.main_image_url ?? "/assets/buildings/kuznica.png",
    slots: (row.collection_items ?? []).map(mapSlot)
  };
}

export function mapChronicleEntry(row: ChronicleRow): ChronicleEntry {
  const building = firstRelation(row.buildings);

  return {
    id: row.id,
    name: row.public_name ?? "Тайный доброхот",
    action: row.text,
    amount: row.amount ?? undefined,
    hours: row.hours ?? undefined,
    time: formatTime(row.created_at),
    buildingSlug: building?.slug
  };
}

export function mapAdminDonation(row: DonationRow): AdminDonation {
  const building = firstRelation(row.buildings);
  const collectionItem = firstRelation(row.collection_items);

  return {
    id: row.id,
    donorName: row.donor_name,
    donorEmail: row.donor_email,
    buildingSlug: building?.slug ?? "",
    buildingTitle: building?.title ?? "Без объекта",
    slotTitle: collectionItem?.title ?? "Общий вклад",
    amount: row.amount,
    status: row.status,
    createdAt: formatTime(row.created_at),
    paidAt: row.paid_at ? formatTime(row.paid_at) : undefined
  };
}

export function mapVolunteerApplication(row: VolunteerApplicationRow): VolunteerApplication {
  const building = firstRelation(row.buildings);
  const totalHours = (row.volunteer_hours ?? []).reduce((sum, item) => sum + item.hours, 0);
  const totalPoints = (row.volunteer_hours ?? []).reduce((sum, item) => sum + item.points, 0);

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    buildingSlug: building?.slug ?? "",
    buildingTitle: building?.title ?? "Без объекта",
    skills: row.skills ?? [],
    preferredDates: row.preferred_dates ?? "",
    comment: row.comment ?? "",
    status: row.status,
    hours: totalHours,
    points: totalPoints,
    createdAt: formatTime(row.created_at)
  };
}
