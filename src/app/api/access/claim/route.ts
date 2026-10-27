import { NextResponse } from "next/server";
import { claimCourseAccessForUser } from "@/lib/course-access";
import { createServerSupabaseClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function POST() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const access = await claimCourseAccessForUser(user);
    if (access === "unavailable") return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
    if (access !== "granted") return NextResponse.json({ access: "pending" }, { status: 202 });
    return NextResponse.json({ access: "granted" });
  } catch {
    return NextResponse.json({ error: "access_claim_failed" }, { status: 500 });
  }
}
