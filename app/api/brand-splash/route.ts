import { NextResponse } from "next/server";
import { readBrandAssets } from "@/lib/server/brand-assets";

export async function GET(request: Request) {
  try {
    const { splash, logo } = await readBrandAssets();
    const url = splash || logo || "/logo.png";
    if (/^https?:\/\//i.test(url)) {
      return NextResponse.redirect(url, {
        headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
      });
    }
    return NextResponse.redirect(new URL(url, request.url));
  } catch {
    return NextResponse.redirect(new URL("/logo.png", request.url));
  }
}
