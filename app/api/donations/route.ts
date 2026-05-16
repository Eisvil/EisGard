import { NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type DonationPayload = {
  buildingSlug?: string;
  slotId?: string;
  donorName?: string;
  donorEmail?: string;
  amount?: number;
  publishName?: boolean;
  comment?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as DonationPayload;
  const donorName = payload.donorName?.trim();
  const donorEmail = payload.donorEmail?.trim();
  const amount = Number(payload.amount ?? 0);

  if (!payload.buildingSlug) {
    return badRequest("buildingSlug is required");
  }

  if (!payload.slotId) {
    return badRequest("slotId is required");
  }

  if (!donorName) {
    return badRequest("donorName is required");
  }

  if (!donorEmail || !donorEmail.includes("@")) {
    return badRequest("valid donorEmail is required");
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest("amount must be positive");
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      donation: {
        id: `mock-donation-${Date.now()}`,
        status: "paid",
        donorName,
        donorEmail,
        amount,
        publishName: payload.publishName ?? true
      }
    });
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase client is not configured" }, { status: 500 });
  }

  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("id")
    .eq("slug", payload.buildingSlug)
    .single();

  if (buildingError || !building) {
    return NextResponse.json({ ok: false, message: "Building not found" }, { status: 404 });
  }

  const { data: item, error: itemError } = await supabase
    .from("collection_items")
    .select("id")
    .eq("id", payload.slotId)
    .eq("building_id", building.id)
    .single();

  if (itemError || !item) {
    return NextResponse.json({ ok: false, message: "Collection item not found" }, { status: 404 });
  }

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .insert({
      building_id: building.id,
      item_id: item.id,
      donor_name: donorName,
      donor_email: donorEmail,
      amount,
      status: "pending",
      publish_name: payload.publishName ?? true,
      public_name: payload.publishName === false ? null : donorName,
      comment: payload.comment ?? null,
      provider: "mock"
    })
    .select("id, status")
    .single();

  if (donationError) {
    return NextResponse.json({ ok: false, message: donationError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    donation
  });
}

