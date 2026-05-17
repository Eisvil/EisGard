import { adminDonations, buildings, chronicleEntries, volunteerApplications } from "./seed";
import { getSupabaseClient } from "./supabase/client";
import { mapAdminDonation, mapBuilding, mapChronicleEntry, mapProjectSettings, mapVolunteerApplication } from "./supabase/mappers";
import type { AdminDonation, Building, ChronicleEntry, ProjectSettings, VolunteerApplication } from "./types";

const fallbackProjectSettings: ProjectSettings = {
  projectName: "Живое Городище",
  legalName: "НКО / фонд будет указан позже",
  contactEmail: "info@example.ru",
  telegramAdminChat: "служебный чат не подключен",
  donationTerms:
    "Пожертвование является добровольным вкладом в строительство выбранного объекта. Публичное имя отображается только при согласии участника.",
  privacyPolicy:
    "Персональные данные используются для подтверждения вклада, связи с участником и ведения цифровой летописи проекта.",
  paymentProviderPreference: "mock",
  tbankCollectionEnabled: false,
  tbankCollectionUrl: "",
  tbankCollectionTitle: "Сбор Т-Банка",
  tbankCollectionDescription:
    "Внешняя ссылка на сбор денег в Т-Банке. После оплаты администратор подтверждает вклад вручную.",
  yookassaEnabled: false
};

function warnAndFallback(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[data] Supabase ${scope} fallback:`, error);
  }
}

async function trySupabase<T>(scope: string, query: () => Promise<T>, fallback: T): Promise<T> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return fallback;
  }

  try {
    return await query();
  } catch (error) {
    warnAndFallback(scope, error);
    return fallback;
  }
}

export async function getBuildings(): Promise<Building[]> {
  return trySupabase(
    "getBuildings",
    async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return buildings;
      }

      const { data, error } = await supabase
        .from("buildings")
        .select(
          `
          slug,
          title,
          zone,
          status,
          short_description,
          description,
          historical_note,
          budget_amount,
          collected_amount,
          main_image_url,
          icon_lucide_name,
          sort_order,
          map_markers!inner(x_percent, y_percent, is_visible),
          collection_items(
            id,
            title,
            description,
            image_url,
            unit_amount,
            quantity_total,
            quantity_funded,
            status,
            sort_order
          )
        `
        )
        .eq("is_visible", true)
        .eq("map_markers.is_visible", true)
        .neq("collection_items.status", "hidden")
        .order("sort_order", { ascending: true })
        .order("sort_order", { referencedTable: "collection_items", ascending: true });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapBuilding);
    },
    buildings
  );
}

export async function getBuildingBySlug(slug: string): Promise<Building | undefined> {
  const allBuildings = await getBuildings();
  return allBuildings.find((building) => building.slug === slug);
}

export async function getChronicleEntries(options?: {
  buildingSlug?: string;
  limit?: number;
}): Promise<ChronicleEntry[]> {
  const fallbackEntries = chronicleEntries
    .filter((entry) => !options?.buildingSlug || entry.buildingSlug === options.buildingSlug)
    .slice(0, options?.limit ?? chronicleEntries.length);

  return trySupabase(
    "getChronicleEntries",
    async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return fallbackEntries;
      }

      let query = supabase
        .from("chronicle_entries")
        .select(
          `
          id,
          public_name,
          text,
          amount,
          hours,
          created_at,
          buildings(slug)
        `
        )
        .eq("is_visible", true)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

      if (options?.buildingSlug) {
        query = query.eq("buildings.slug", options.buildingSlug);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapChronicleEntry);
    },
    fallbackEntries
  );
}

export async function getSettlementStats() {
  const allBuildings = await getBuildings();
  const totalCollected = allBuildings.reduce((sum, building) => sum + building.collected, 0);

  return {
    participants: 1248,
    totalCollected,
    volunteerHours: 2146,
    activeObjects: allBuildings.length
  };
}

export async function getAdminDonations(): Promise<AdminDonation[]> {
  return trySupabase(
    "getAdminDonations",
    async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return adminDonations;
      }

      const { data, error } = await supabase
        .from("donations")
        .select(
          `
          id,
          donor_name,
          donor_email,
          amount,
          status,
          created_at,
          paid_at,
          buildings(slug, title),
          collection_items(title)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapAdminDonation);
    },
    adminDonations
  );
}

export async function getVolunteerApplications(): Promise<VolunteerApplication[]> {
  return trySupabase(
    "getVolunteerApplications",
    async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return volunteerApplications;
      }

      const { data, error } = await supabase
        .from("volunteer_applications")
        .select(
          `
          id,
          name,
          email,
          phone,
          skills,
          preferred_dates,
          comment,
          status,
          created_at,
          buildings(slug, title),
          volunteer_hours(hours, points)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data ?? []).map(mapVolunteerApplication);
    },
    volunteerApplications
  );
}

export async function getProjectSettings(): Promise<ProjectSettings> {
  return trySupabase(
    "getProjectSettings",
    async () => {
      const supabase = getSupabaseClient();

      if (!supabase) {
        return fallbackProjectSettings;
      }

      const { data, error } = await supabase
        .from("project_settings")
        .select(
          `
          project_name,
          legal_name,
          contact_email,
          telegram_admin_chat,
          donation_terms,
          privacy_policy,
          payment_provider_preference,
          tbank_collection_enabled,
          tbank_collection_url,
          tbank_collection_title,
          tbank_collection_description,
          yookassa_enabled
        `
        )
        .eq("id", "main")
        .single();

      if (error) {
        throw error;
      }

      return mapProjectSettings(data);
    },
    fallbackProjectSettings
  );
}
