import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/lib/roles";

export interface UserRow {
  user_id: string;
  role: AppRole;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string | null;
}

export async function fetchUsers(): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id, role, profiles(full_name, email, avatar_url, created_at)")
    .order("created_at", { ascending: true, foreignTable: "profiles" });

  if (error) {
    throw new Error(error.message || "Unable to load users.");
  }

  return (data ?? []).map((row: any) => ({
    user_id: row.user_id,
    role: row.role as AppRole,
    full_name: row.profiles?.full_name ?? null,
    email: row.profiles?.email ?? "",
    avatar_url: row.profiles?.avatar_url ?? null,
    created_at: row.profiles?.created_at ?? null,
  }));
}

export async function updateUserRole(userId: string, role: AppRole) {
  const { error } = await supabase
    .from("user_roles")
    .upsert({ user_id: userId, role }, { onConflict: "user_id" });

  if (error) {
    throw new Error(error.message || "Unable to update user role.");
  }
}
