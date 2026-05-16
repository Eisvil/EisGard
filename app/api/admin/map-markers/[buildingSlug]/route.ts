import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

type MarkerPatchPayload = {
  x?: number;
  y?: number;
};

type RouteContext = {
  params: Promise<{
    buildingSlug: string;
  }>;
};

function isPercent(value: number | undefined) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { buildingSlug } = await context.params;
  const payload = (await request.json()) as MarkerPatchPayload;

  if (!buildingSlug) {
    return NextResponse.json({ ok: false, message: "buildingSlug is required" }, { status: 400 });
  }

  if (!isPercent(payload.x) || !isPercent(payload.y)) {
    return NextResponse.json({ ok: false, message: "x and y must be numbers from 0 to 100" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      marker: {
        buildingSlug,
        x: payload.x,
        y: payload.y
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data: building, error: buildingError } = await supabase
    .from("buildings")
    .select("id")
    .eq("slug", buildingSlug)
    .single();

  if (buildingError || !building) {
    return NextResponse.json({ ok: false, message: "Building not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("map_markers")
    .update({
      x_percent: payload.x,
      y_percent: payload.y
    })
    .eq("building_id", building.id)
    .select("id, x_percent, y_percent")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", marker: data });
}

