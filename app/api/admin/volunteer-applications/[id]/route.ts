import { NextResponse } from "next/server";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { VolunteerStatus } from "@/lib/types";

type VolunteerPatchPayload = {
  status?: VolunteerStatus;
  comment?: string;
  hours?: number;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const payload = (await request.json()) as VolunteerPatchPayload;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      application: {
        id,
        ...payload,
        points: payload.hours ? payload.hours * 5 : undefined
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data: currentApplication, error: currentError } = await supabase
    .from("volunteer_applications")
    .select("id, name, user_id, building_id, status")
    .eq("id", id)
    .single();

  if (currentError || !currentApplication) {
    return NextResponse.json({ ok: false, message: currentError?.message ?? "Application not found" }, { status: 404 });
  }

  const { data: application, error } = await supabase
    .from("volunteer_applications")
    .update({
      status: payload.status,
      comment: payload.comment
    })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  if (payload.hours && payload.hours > 0) {
    const points = payload.hours * 5;

    const { data: hoursEntry } = await supabase
      .from("volunteer_hours")
      .insert({
        application_id: currentApplication.id,
        user_id: currentApplication.user_id,
        building_id: currentApplication.building_id,
        hours: payload.hours,
        points,
        comment: payload.comment ?? null
      })
      .select("id")
      .single();

    await supabase.from("chronicle_entries").insert({
      type: "volunteer_hours",
      building_id: currentApplication.building_id,
      volunteer_hours_id: hoursEntry?.id,
      text: `зачислил(а) ${payload.hours} волонтерских часов`,
      public_name: currentApplication.name,
      hours: payload.hours,
      is_visible: true
    });
  }

  return NextResponse.json({ ok: true, mode: "supabase", application });
}
