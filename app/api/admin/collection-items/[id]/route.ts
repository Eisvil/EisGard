import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

type CollectionItemPatchPayload = {
  title?: string;
  description?: string;
  price?: number;
  remaining?: number;
  status?: string;
  buildingSlug?: string;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as CollectionItemPatchPayload;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      item: {
        id,
        ...payload
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  let buildingId: string | undefined;

  if (payload.buildingSlug) {
    const { data: building, error: buildingError } = await supabase
      .from("buildings")
      .select("id")
      .eq("slug", payload.buildingSlug)
      .single();

    if (buildingError || !building) {
      return NextResponse.json({ ok: false, message: "Building not found" }, { status: 404 });
    }

    buildingId = building.id;
  }

  const updatePayload = {
    title: payload.title,
    description: payload.description,
    unit_amount: payload.price,
    quantity_total: payload.remaining,
    status: payload.status,
    building_id: buildingId
  };

  const { data, error } = await supabase
    .from("collection_items")
    .update(updatePayload)
    .eq("id", id)
    .select("id, title, status")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", item: data });
}

