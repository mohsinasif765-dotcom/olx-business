import { NextResponse } from "next/server";
import { readBrandAssets } from "@/lib/server/brand-assets";

export async function GET() {
  try {
    const assets = await readBrandAssets();
    return NextResponse.json(assets, {
      headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=600" },
    });
  } catch {
    return NextResponse.json({ logo: "/logo.png", splash: "/logo.png" });
  }
}
