import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";

export async function GET() {
  const guard = await requireAdminApiAccess();

  if (guard.response) {
    return guard.response;
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({ ok: true, mode: "mock", users: [] });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, name, phone, role, points, public_name, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", users: data ?? [] });
}
