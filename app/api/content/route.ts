import { NextResponse } from "next/server";
import { readSite } from "@/lib/server/site";

export async function GET() {
  try {
    const site = await readSite();
    return NextResponse.json(
      {
        siteName: site.siteName,
        telegram: site.telegram,
        handle: site.handle,
        cms: site.cms,
        faqs: site.faqs,
        notices: site.notices,
        coins: site.coins,
        flags: site.flags,
        finance: site.finance,
      },
      { headers: { "Cache-Control": "public, max-age=15, stale-while-revalidate=60" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
