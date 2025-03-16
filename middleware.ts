import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

let isInitialized = false;

export async function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
  runtime: 'nodejs',
}; 