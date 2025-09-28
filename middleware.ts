// middleware.ts
import { NextRequest, NextResponse } from "next/server";

/** Protect /admin with Basic Auth (ADMIN_USER / ADMIN_PASS)
 *  and redirect "/" -> "/ask"
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---- Protect /admin ----
  if (pathname.startsWith("/admin")) {
    const user = process.env.ADMIN_USER || "";
    const pass = process.env.ADMIN_PASS || "";

    const auth = req.headers.get("authorization") || "";
    const [scheme, encoded] = auth.split(" ");
    let valid = false;

    if (scheme === "Basic" && encoded) {
      try {
        // atob works in Edge runtime; Buffer does not.
        const decoded = atob(encoded);
        const sep = decoded.indexOf(":");
        const u = decoded.slice(0, sep);
        const p = decoded.slice(sep + 1);
        if (u === user && p === pass) valid = true;
      } catch {}
    }

    if (!valid) {
      return new NextResponse("Authorization required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"',
        },
      });
    }

    return NextResponse.next();
  }

  // ---- Redirect only the root to /ask ----
  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = "/ask";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*"],
};
