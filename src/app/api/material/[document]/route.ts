import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const documentFiles = {
  "o-que-sao-milhas": {
    filename: "o-que-sao-milhas.pdf",
  },
  "programas-de-fidelidade": {
    filename: "programas-de-fidelidade.pdf",
  },
} as const;

type DocumentKey = keyof typeof documentFiles;

function isDocumentKey(value: string): value is DocumentKey {
  return Object.hasOwn(documentFiles, value);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ document: string }> },
) {
  const { document } = await params;
  if (!isDocumentKey(document)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = await createServerSupabaseClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1)
    .maybeSingle();

  if (!entitlement) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const material = documentFiles[document];
  const file = await readFile(join(process.cwd(), "private", "lesson-01", material.filename));

  return new NextResponse(file, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${material.filename}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
