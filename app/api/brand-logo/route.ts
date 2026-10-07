import { NextResponse } from "next/server";
import { readBrandAssets } from "@/lib/server/brand-assets";

export async function GET(request: Request) {
  try {
    const { logo } = await readBrandAssets();
    if (/^https?:\/\//i.test(logo)) {
      return NextResponse.redirect(logo, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
      });
    }
    return NextResponse.redirect(new URL(logo, request.url));
  } catch {
    return NextResponse.redirect(new URL("/logo.png", request.url));
  }
}
