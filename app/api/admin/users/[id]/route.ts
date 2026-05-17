import { NextResponse } from "next/server";
import { requireAdminApiAccess } from "@/lib/auth/admin";
import { getSupabaseAdminClient, isSupabaseAdminConfigured } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

type UserPatchPayload = {
  role?: UserRole;
};

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedRoles: UserRole[] = ["participant", "moderator", "admin"];

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireAdminApiAccess();

  if (guard.response) {
    return guard.response;
  }

  const { id } = await context.params;
  const payload = (await request.json()) as UserPatchPayload;

  if (!payload.role || !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ ok: false, message: "Unsupported role" }, { status: 400 });
  }

  if (guard.access.role !== "superadmin" && payload.role === "admin") {
    return NextResponse.json({ ok: false, message: "Only superadmin can grant admin role" }, { status: 403 });
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json({
      ok: true,
      mode: "mock",
      user: {
        id,
        role: payload.role
      }
    });
  }

  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ ok: false, message: "Supabase admin client is not configured" }, { status: 500 });
  }

  const { data: targetUser, error: targetError } = await supabase.from("profiles").select("id, role").eq("id", id).single();

  if (targetError || !targetUser) {
    return NextResponse.json({ ok: false, message: targetError?.message ?? "User not found" }, { status: 404 });
  }

  if (targetUser.role === "superadmin" && guard.access.role !== "superadmin") {
    return NextResponse.json({ ok: false, message: "Only superadmin can modify superadmin users" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: payload.role
    })
    .eq("id", id)
    .select("id, role")
    .single();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }

  await supabase.from("admin_audit_log").insert({
    action: "update_user_role",
    entity_type: "profile",
    entity_id: id,
    payload: {
      role: payload.role,
      actor: guard.access.email
    }
  });

  return NextResponse.json({ ok: true, mode: "supabase", user: data });
}
