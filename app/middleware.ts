import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // If visiting the root "/" path, send them to "/ask"
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/ask", request.url));
  }
  return NextResponse.next();
}

// Apply middleware only for root requests
export const config = {
  matcher: ["/"],
};
