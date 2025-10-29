import { betterFetch } from "@better-fetch/fetch";
import type { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
 
type Session = typeof auth.$Infer.Session;
const protectedRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
    const {nextUrl} = request;
	const { data: session } = await betterFetch<Session>("/api/auth/get-session", {
		baseURL: request.nextUrl.origin,
		headers: {
			cookie: request.headers.get("cookie") || "", 
		},
	});

    const isLoggedIn = !!session;
    const isOnProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
    const isOnAuthRoute = nextUrl.pathname.startsWith("/auth");
  
    if (isOnProtectedRoute && !isLoggedIn) {
      return NextResponse.redirect(new URL("/auth/sign-in", request.url));
    }
  
    if (isOnAuthRoute && isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
 
	return NextResponse.next();
}
 
export const config = {
    matcher: [
      '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
}