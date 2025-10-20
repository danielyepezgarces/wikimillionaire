import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// All routes are public - authentication is handled by the app
// This middleware is kept for future use if needed
export function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
