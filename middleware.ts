import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isSessionTokenValid } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname.startsWith("/admin/login");
  const isAdminApi = pathname.startsWith("/api/admin");
  const isLoginApi = pathname.startsWith("/api/admin/login");

  if ((isAdminArea && !isLoginPage) || (isAdminApi && !isLoginApi)) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (!(await isSessionTokenValid(token))) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
