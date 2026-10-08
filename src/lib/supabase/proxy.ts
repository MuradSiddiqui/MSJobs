import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { isAdminEmail } from "@/lib/admin";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/jobs",
  "/saved",
  "/applications",
  "/cv",
  "/profile",
  "/settings",
  "/onboarding",
  "/admin",
] as const;

const AUTH_PAGES = ["/login", "/signup"] as const;

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
  Expires: "0",
  Pragma: "no-cache",
} as const;

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function applyCacheHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(CACHE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  applyCacheHeaders(response);

  const supabase = createServerClient(
    env().NEXT_PUBLIC_SUPABASE_URL,
    env().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
          const extra = headers ?? {};
          for (const [key, value] of Object.entries({ ...CACHE_HEADERS, ...extra })) {
            response.headers.set(key, value);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims.sub === "string" ? data.claims.sub : null;
  const path = request.nextUrl.pathname;

  if (path === "/" || matchesPrefix(path, "/auth")) {
    return response;
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => matchesPrefix(path, prefix));
  const isAuthPage = AUTH_PAGES.some((prefix) => matchesPrefix(path, prefix));

  if (!userId && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return applyCacheHeaders(NextResponse.redirect(url));
  }

  if (userId && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return applyCacheHeaders(NextResponse.redirect(url));
  }

  // Approval gate: new signups stay locked on /pending until the admin
  // approves them. The admin account bypasses the check entirely.
  if (userId) {
    const email = typeof data?.claims?.email === "string" ? data.claims.email : null;
    const admin = isAdminEmail(email);
    if (!admin && matchesPrefix(path, "/admin")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return applyCacheHeaders(NextResponse.redirect(url));
    }
    if (!admin && isProtected && path !== "/pending") {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("id", userId)
        .maybeSingle();
      if (profile?.is_approved !== true) {
        const url = request.nextUrl.clone();
        url.pathname = "/pending";
        url.search = "";
        return applyCacheHeaders(NextResponse.redirect(url));
      }
    }
  }

  return response;
}
