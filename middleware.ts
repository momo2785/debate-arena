// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Protect /admin with Basic Auth (ADMIN_USER / ADMIN_PASS)
 * and redirect site root "/" to the public page "/ask".
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1) BASIC AUTH for /admin (and its subpaths)
  if (pathname.startsWith("/admin")) {
    const user = process.env.ADMIN_USER || "";
    const pass = process.env.ADMIN_PASS || "";

    const auth = req.headers.get("authorization") || "";

    // Expect header: "Basic base64(user:pass)"
    const [scheme, encoded] = auth.split(" ");
    let valid = false;

    if (scheme === "Basic" && encoded) {
      try {
        const decoded = Buffer.from(encoded, "base64").toString("utf8");
        const [u, p] = decoded.split(":");
        if (u === user && p === pass) valid = true;
      } catch {
        // ignore, will fall through to 401
      }
    }

    if (!valid) {
      return new NextResponse("Authorization required", {
        status: 401,
        headers: {
          // This triggers the browser's native username/password prompt
          "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"',
        },
      });
    }

    // Auth OK → continue to /admin
    return NextResponse.next();
  }

  // 2) PUBLIC HOME: redirect "/" → "/ask"
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/ask";
    return NextResponse.redirect(url);
  }

  // Everything else → continue
  return NextResponse.next();
}

// Run this middleware only on "/" and "/admin"
export const config = {
  matcher: ["/", "/admin/:path*"],
};
