import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentUserEmail() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user?.email ?? null;
}
