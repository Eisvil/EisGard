import { redirect } from "next/navigation";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAuthConfigured } from "@/lib/supabase/keys";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export type AdminRole = Extract<UserRole, "admin" | "superadmin">;

type AdminAccess =
  | {
      ok: true;
      email: string;
      role: AdminRole;
      isBootstrap: boolean;
    }
  | {
      ok: false;
      reason: "unauthenticated" | "forbidden";
      email?: string;
    };

const adminRoles: AdminRole[] = ["admin", "superadmin"];

function getBootstrapEmails() {
  return (process.env.ADMIN_BOOTSTRAP_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function ensureBootstrapProfile(userId: string, email: string) {
  const admin = getSupabaseAdminClient();

  if (!admin) {
    return;
  }

  await admin.from("profiles").upsert(
    {
      id: userId,
      email,
      role: "superadmin",
      name: email.split("@")[0],
      public_name: email.split("@")[0]
    },
    { onConflict: "id" }
  );
}

export async function getAdminAccess(): Promise<AdminAccess> {
  if (!isSupabaseAuthConfigured()) {
    return {
      ok: true,
      email: "mock-admin@local",
      role: "superadmin",
      isBootstrap: true
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return {
      ok: false,
      reason: "unauthenticated"
    };
  }

  const email = user.email.toLowerCase();
  const bootstrapEmails = getBootstrapEmails();

  if (bootstrapEmails.includes(email)) {
    await ensureBootstrapProfile(user.id, email);

    return {
      ok: true,
      email,
      role: "superadmin",
      isBootstrap: true
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !adminRoles.includes(profile.role as AdminRole)) {
    return {
      ok: false,
      reason: "forbidden",
      email
    };
  }

  return {
    ok: true,
    email,
    role: profile.role as AdminRole,
    isBootstrap: false
  };
}

export async function requireAdminPageAccess() {
  const access = await getAdminAccess();

  if (!access.ok) {
    redirect(`/admin/login?reason=${access.reason}`);
  }

  return access;
}

export async function requireAdminApiAccess() {
  const access = await getAdminAccess();

  if (!access.ok) {
    return {
      access,
      response: Response.json(
        {
          ok: false,
          message: access.reason === "unauthenticated" ? "Authentication required" : "Admin role required"
        },
        { status: access.reason === "unauthenticated" ? 401 : 403 }
      )
    };
  }

  return {
    access,
    response: null
  };
}
