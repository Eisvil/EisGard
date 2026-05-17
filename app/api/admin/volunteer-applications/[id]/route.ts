import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
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
  const guard = await requireAdminApiAccess();

  if (guard.response) {
    return guard.response;
  }

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

    const { data: existingHours, error: existingHoursError } = await supabase
      .from("volunteer_hours")
      .select("id")
      .eq("application_id", currentApplication.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingHoursError) {
      return NextResponse.json({ ok: false, message: existingHoursError.message }, { status: 500 });
    }

    const hoursPayload = {
      application_id: currentApplication.id,
      user_id: currentApplication.user_id,
      building_id: currentApplication.building_id,
      hours: payload.hours,
      points,
      comment: payload.comment ?? null
    };

    const { data: hoursEntry, error: hoursError } = existingHours
      ? await supabase
          .from("volunteer_hours")
          .update(hoursPayload)
          .eq("id", existingHours.id)
          .select("id")
          .single()
      : await supabase.from("volunteer_hours").insert(hoursPayload).select("id").single();

    if (hoursError) {
      return NextResponse.json({ ok: false, message: hoursError.message }, { status: 500 });
    }

    const chroniclePayload = {
      type: "volunteer_hours" as const,
      building_id: currentApplication.building_id,
      volunteer_hours_id: hoursEntry.id,
      text: `зачислил(а) ${payload.hours} волонтерских часов`,
      public_name: currentApplication.name,
      hours: payload.hours,
      is_visible: true
    };

    if (existingHours) {
      await supabase
        .from("chronicle_entries")
        .update(chroniclePayload)
        .eq("volunteer_hours_id", hoursEntry.id)
        .eq("type", "volunteer_hours");
    } else {
      await supabase.from("chronicle_entries").insert(chroniclePayload);
    }
  }

  return NextResponse.json({ ok: true, mode: "supabase", application });
}
