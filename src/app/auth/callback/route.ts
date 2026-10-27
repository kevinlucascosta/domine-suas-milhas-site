import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { claimCourseAccessForUser } from "@/lib/course-access";

function destinationFor(request: NextRequest, path: "/curso" | "/boas-vindas" | "/cadastro" | "/redefinir-senha", reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  if (path === "/redefinir-senha") url.searchParams.set("recovery", "1");
  if (reason) url.searchParams.set("oauth", reason);
  if (path === "/boas-vindas") url.searchParams.set("status", "pending");
  return url;
}

/** Completes Supabase PKCE OAuth, then checks the payment on the server. */
export async function GET(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const code = request.nextUrl.searchParams.get("code");
  const isPasswordRecovery = request.nextUrl.searchParams.get("next") === "/redefinir-senha";
  if (!url || !key || !code) return NextResponse.redirect(destinationFor(request, "/cadastro", "failed"));

  const response = NextResponse.redirect(destinationFor(request, "/cadastro", "failed"));
  const redirectWithSessionCookies = (destination: URL) => {
    const redirect = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)),
    },
  });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return response;

  if (isPasswordRecovery) {
    return redirectWithSessionCookies(destinationFor(request, "/redefinir-senha"));
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return response;

  try {
    const access = await claimCourseAccessForUser(user);
    return redirectWithSessionCookies(destinationFor(request, access === "granted" ? "/curso" : "/boas-vindas"));
  } catch {
    return redirectWithSessionCookies(destinationFor(request, "/boas-vindas"));
  }
}
