import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { roleHomePath } from "@/lib/auth/roles";

/**
 * Optimistic auth check only (JWT decode from cookie, no DB hit) — this is a
 * fast bounce for logged-out users, not the source of truth. Every route
 * group's layout re-checks with requirePageRole(), and every Server Action
 * re-checks with requireActionRole(); see the Next.js auth guide's reasoning
 * for why Proxy alone is never sufficient.
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth?.user;
  const isLoginPage = pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL(roleHomePath(req.auth!.user.role), req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png).*)"],
};
