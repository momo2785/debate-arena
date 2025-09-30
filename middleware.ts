// middleware.ts
import { NextRequest, NextResponse } from "next/server";

const ADMIN_PREFIXES = ["/arena/admin", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    const user = process.env.ADMIN_USER || "";
    const pass = process.env.ADMIN_PASS || "";
    if (!user || !pass) {
      return new NextResponse("Admin credentials not configured", { status: 500 });
    }

    const auth = req.headers.get("authorization") || "";
    const [scheme, encoded] = auth.split(" ");
    if (scheme !== "Basic" || !encoded) {
      return new NextResponse("Authorization required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"' },
      });
    }

    try {
      const decoded = atob(encoded);
      const sep = decoded.indexOf(":");
      const u = sep >= 0 ? decoded.slice(0, sep) : "";
      const p = sep >= 0 ? decoded.slice(sep + 1) : "";
      if (u !== user || p !== pass) {
        return new NextResponse("Unauthorized", {
          status: 401,
          headers: { "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"' },
        });
      }
    } catch {
      return new NextResponse("Invalid Authorization header", { status: 400 });
    }
  }

  // Redirect root → /ask
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/ask", req.url));
  }

  return NextResponse.next();
}

export const config = { matcher: ["/", "/arena/admin/:path*", "/admin/:path*"] };
