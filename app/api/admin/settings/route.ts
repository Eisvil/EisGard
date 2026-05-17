import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { PaymentProviderPreference } from "@/lib/types";

type SettingsPayload = {
  projectName?: string;
  legalName?: string;
  contactEmail?: string;
  telegramAdminChat?: string;
  donationTerms?: string;
  privacyPolicy?: string;
  paymentProviderPreference?: PaymentProviderPreference;
  tbankCollectionEnabled?: boolean;
  tbankCollectionUrl?: string;
  tbankCollectionTitle?: string;
  tbankCollectionDescription?: string;
  yookassaEnabled?: boolean;
};

const providerValues: PaymentProviderPreference[] = ["mock", "tbank_collection_manual", "yookassa"];

function cleanText(value: string | undefined, fallback: string) {
  const text = value?.trim();
  return text ? text : fallback;
}

function normalizeUrl(value: string | undefined) {
  const url = value?.trim() ?? "";

  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    return parsed.toString();
  } catch {
    return "";
  }
}

export async function PATCH(request: Request) {
  const guard = await requireAdminApiAccess();

  if (guard.response) {
    return guard.response;
  }

  const payload = (await request.json()) as SettingsPayload;
  const paymentProviderPreference = payload.paymentProviderPreference ?? "mock";
  const tbankCollectionEnabled = Boolean(payload.tbankCollectionEnabled);
  const tbankCollectionUrl = normalizeUrl(payload.tbankCollectionUrl);

  if (!providerValues.includes(paymentProviderPreference)) {
    return NextResponse.json({ ok: false, message: "Unsupported payment provider" }, { status: 400 });
  }

  if (tbankCollectionEnabled && !tbankCollectionUrl) {
    return NextResponse.json({ ok: false, message: "T-Bank collection URL is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      settings: {
        ...payload,
        tbankCollectionUrl
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("project_settings")
    .upsert(
      {
        id: "main",
        project_name: cleanText(payload.projectName, "Живое Городище"),
        legal_name: cleanText(payload.legalName, "НКО / фонд будет указан позже"),
        contact_email: cleanText(payload.contactEmail, "info@example.ru"),
        telegram_admin_chat: cleanText(payload.telegramAdminChat, "служебный чат не подключен"),
        donation_terms: cleanText(
          payload.donationTerms,
          "Пожертвование является добровольным вкладом в строительство выбранного объекта. Публичное имя отображается только при согласии участника."
        ),
        privacy_policy: cleanText(
          payload.privacyPolicy,
          "Персональные данные используются для подтверждения вклада, связи с участником и ведения цифровой летописи проекта."
        ),
        payment_provider_preference: paymentProviderPreference,
        tbank_collection_enabled: tbankCollectionEnabled,
        tbank_collection_url: tbankCollectionUrl || null,
        tbank_collection_title: cleanText(payload.tbankCollectionTitle, "Сбор Т-Банка"),
        tbank_collection_description: cleanText(
          payload.tbankCollectionDescription,
          "Внешняя ссылка на сбор денег в Т-Банке. После оплаты администратор подтверждает вклад вручную."
        ),
        yookassa_enabled: Boolean(payload.yookassaEnabled)
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", settings: data });
}
