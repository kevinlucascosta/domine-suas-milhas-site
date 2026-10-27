import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

/**
 * Exchanges only password-recovery codes. Keeping this route distinct from
 * OAuth prevents a recovery request from being routed into the course login.
 */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const destination = request.nextUrl.clone();
  destination.pathname = "/redefinir-senha";
  destination.search = "";
  destination.searchParams.set("recovery", "1");

  if (!url || !key || (!code && !(tokenHash && type === "recovery"))) {
    destination.searchParams.set("error", "invalid_link");
    return NextResponse.redirect(destination);
  }

  const response = NextResponse.redirect(destination);
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });

  // A token hash is resilient when the link is opened in a different browser
  // or mobile web view, where the original PKCE cookie may not exist.
  const { error } = tokenHash && type === "recovery"
    ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
    : await supabase.auth.exchangeCodeForSession(code!);

  if (error) {
    destination.searchParams.set("error", "expired_or_used");
    return NextResponse.redirect(destination);
  }

  const redirect = NextResponse.redirect(destination);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
