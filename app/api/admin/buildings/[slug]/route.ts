import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

type BuildingPatchPayload = {
  title?: string;
  zone?: string;
  status?: string;
  shortDescription?: string;
  description?: string;
  historicalNote?: string;
  budget?: number;
  collected?: number;
};

type RouteContext = {
  params: Promise<{
    slug: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const payload = (await request.json()) as BuildingPatchPayload;

  if (!slug) {
    return NextResponse.json({ ok: false, message: "slug is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      building: {
        slug,
        ...payload
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const updatePayload = {
    title: payload.title,
    zone: payload.zone,
    status: payload.status,
    short_description: payload.shortDescription,
    description: payload.description,
    historical_note: payload.historicalNote,
    budget_amount: payload.budget,
    collected_amount: payload.collected
  };

  const { data, error } = await supabase
    .from("buildings")
    .update(updatePayload)
    .eq("slug", slug)
    .select("slug, title, status")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", building: data });
}

