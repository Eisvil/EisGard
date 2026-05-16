import { NextResponse } from "next/server";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

type VolunteerPayload = {
  name?: string;
  email?: string;
  phone?: string;
  buildingSlug?: string;
  skills?: string[];
  preferredDates?: string;
  comment?: string;
};

function badRequest(message: string) {
  return NextResponse.json({ ok: false, message }, { status: 400 });
}

export async function POST(request: Request) {
  const payload = (await request.json()) as VolunteerPayload;
  const name = payload.name?.trim();
  const email = payload.email?.trim();

  if (!name) {
    return badRequest("name is required");
  }

  if (!email || !email.includes("@")) {
    return badRequest("valid email is required");
  }

  if (!payload.buildingSlug) {
    return badRequest("buildingSlug is required");
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      application: {
        id: `mock-volunteer-${Date.now()}`,
        status: "new",
        name,
        email,
        buildingSlug: payload.buildingSlug
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

  const { data: application, error } = await supabase
    .from("volunteer_applications")
    .insert({
      building_id: building.id,
      name,
      email,
      phone: payload.phone?.trim() || null,
      skills: payload.skills ?? [],
      preferred_dates: payload.preferredDates?.trim() || null,
      comment: payload.comment?.trim() || null,
      status: "new"
    })
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    application
  });
}
