import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/curso", "/aula", "/ferramentas", "/comparador", "/missoes",
  "/quiz", "/projeto-final", "/progresso", "/perfil", "/certificado",
];

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const needsAccess = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));

  if (!url || !key) {
    // Development can run without a configured Supabase project. Production
    // must never turn a configuration error into access to premium routes.
    if (needsAccess && process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "access_not_configured" }, { status: 503 });
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const redirectWithSessionCookies = (destination: URL) => {
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: claims } = await supabase.auth.getClaims();
  if (!needsAccess) return response;

  const userId = claims?.claims.sub;
  if (!userId) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/cadastro";
    destination.searchParams.set("next", request.nextUrl.pathname);
    return redirectWithSessionCookies(destination);
  }

  const { data: entitlement } = await supabase
    .from("entitlements")
    .select("status")
    .eq("user_id", userId)
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    .limit(1)
    .maybeSingle();

  if (!entitlement) {
    const destination = request.nextUrl.clone();
    destination.pathname = "/boas-vindas";
    destination.searchParams.set("status", "pending");
    return redirectWithSessionCookies(destination);
  }

  return response;
}
