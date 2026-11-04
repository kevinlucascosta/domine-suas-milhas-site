import { NextResponse } from "next/server";
import { claimCourseAccessForUser } from "@/lib/course-access";
import { createServerSupabaseClient, hasSupabaseServerConfig } from "@/lib/supabase/server";

export async function POST() {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  const email = claims?.claims.email;
  if (!userId || typeof email !== "string") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const access = await claimCourseAccessForUser({ id: userId, email });
    if (access === "unavailable") return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
    if (access !== "granted") return NextResponse.json({ access: "pending" }, { status: 202 });
    return NextResponse.json({ access: "granted" });
  } catch {
    return NextResponse.json({ error: "access_claim_failed" }, { status: 500 });
  }
}
