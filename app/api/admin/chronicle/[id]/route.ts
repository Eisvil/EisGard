import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

type ChroniclePatchPayload = {
  publicName?: string;
  text?: string;
  isVisible?: boolean;
  isPinned?: boolean;
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
  const payload = (await request.json()) as ChroniclePatchPayload;

  if (!id) {
    return NextResponse.json({ ok: false, message: "id is required" }, { status: 400 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      entry: {
        id,
        ...payload
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("chronicle_entries")
    .update({
      public_name: payload.publicName,
      text: payload.text,
      is_visible: payload.isVisible,
      is_pinned: payload.isPinned
    })
    .eq("id", id)
    .select("id, public_name, is_visible, is_pinned")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", entry: data });
}
