import type { User } from "@supabase/supabase-js";
import { createServiceRoleClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export type CourseAccessResult = "granted" | "pending" | "unavailable";

/** Resolves paid course access solely from a verified Supabase user and server-side purchase records. */
export async function claimCourseAccessForUser(user: User): Promise<CourseAccessResult> {
  const email = user.email?.trim().toLowerCase();
  if (!email || !hasSupabaseServerConfig()) return "unavailable";

  const service = createServiceRoleClient();
  const { data: existingEntitlement, error: entitlementError } = await service
    .from("entitlements")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (entitlementError) throw entitlementError;
  if (existingEntitlement) return "granted";

  const { data: access, error } = await service.rpc("claim_kiwify_access", {
    p_user_id: user.id,
    p_email: email,
  });
  if (error) throw error;
  return access === "granted" ? "granted" : "pending";
}
