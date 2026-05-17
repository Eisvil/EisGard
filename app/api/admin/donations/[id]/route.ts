import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { DonationStatus } from "@/lib/types";

type DonationPatchPayload = {
  status?: DonationStatus;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAdminApiAccess();

  if (guard.response) {
    return guard.response;
  }

  const { id } = await context.params;
  const payload = (await request.json()) as DonationPatchPayload;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id is required" }, { status: 400 });
  }

  if (!payload.status) {
    return NextResponse.json({ ok: false, message: "status is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      donation: {
        id,
        status: payload.status,
        paidAt: payload.status === "paid" ? "только что" : null
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data: currentDonation, error: currentError } = await supabase
    .from("donations")
    .select(
      `
      id,
      amount,
      status,
      donor_name,
      public_name,
      publish_name,
      paid_at,
      building_id,
      item_id,
      buildings(title),
      collection_items(title)
    `
    )
    .eq("id", id)
    .single();

  if (currentError || !currentDonation) {
    return NextResponse.json({ ok: false, message: currentError?.message ?? "Donation not found" }, { status: 404 });
  }

  const wasPaid = currentDonation.status === "paid";
  const willBePaid = payload.status === "paid";

  if (wasPaid && willBePaid) {
    return NextResponse.json({
      ok: true,
      mode: "supabase",
      donation: {
        id: currentDonation.id,
        status: currentDonation.status,
        paid_at: currentDonation.paid_at
      }
    });
  }

  if (wasPaid && !willBePaid) {
    return NextResponse.json(
      { ok: false, message: "Paid donations require a refund workflow before status changes." },
      { status: 409 }
    );
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .update({
      status: payload.status,
      paid_at: willBePaid ? new Date().toISOString() : null
    })
    .eq("id", id)
    .select("id, status, paid_at")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  if (!wasPaid && willBePaid) {
    const { data: buildingTotals } = await supabase
      .from("buildings")
      .select("collected_amount")
      .eq("id", currentDonation.building_id)
      .single();

    await supabase
      .from("buildings")
      .update({
        collected_amount: (buildingTotals?.collected_amount ?? 0) + currentDonation.amount
      })
      .eq("id", currentDonation.building_id);

    if (currentDonation.item_id) {
      const { data: itemTotals } = await supabase
        .from("collection_items")
        .select("collected_amount, quantity_funded")
        .eq("id", currentDonation.item_id)
        .single();

      await supabase
        .from("collection_items")
        .update({
          collected_amount: (itemTotals?.collected_amount ?? 0) + currentDonation.amount,
          quantity_funded: (itemTotals?.quantity_funded ?? 0) + 1
        })
        .eq("id", currentDonation.item_id);
    }

    const publicName = currentDonation.publish_name
      ? currentDonation.public_name || currentDonation.donor_name
      : "Тайный доброхот";
    const itemRelation = currentDonation.collection_items as unknown;
    const itemTitle = Array.isArray(itemRelation)
      ? (itemRelation[0] as { title?: string } | undefined)?.title
      : (itemRelation as { title?: string } | null | undefined)?.title;

    await supabase.from("chronicle_entries").insert({
      type: "donation",
      building_id: currentDonation.building_id,
      item_id: currentDonation.item_id,
      donation_id: currentDonation.id,
      text: itemTitle ? `поддержал(а) "${itemTitle}"` : "сделал(а) вклад в строительство",
      public_name: publicName,
      amount: currentDonation.amount,
      is_visible: true
    });
  }

  return NextResponse.json({ ok: true, mode: "supabase", donation });
}
