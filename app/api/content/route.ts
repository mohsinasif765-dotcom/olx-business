import { NextResponse } from "next/server";
import { readSite } from "@/lib/server/site";

export async function GET() {
  try {
    const site = await readSite();
    return NextResponse.json(
      {
        siteName: site.siteName,
        telegram: site.telegram,
        whatsapp: site.whatsapp,
        handle: site.handle,
        cms: site.cms,
        faqs: site.faqs,
        notices: site.notices,
        coins: site.coins,
        flags: site.flags,
        finance: site.finance,
        walletMode: site.walletMode,
        displayCurrency: site.displayCurrency,
        usdtToPkrRate: site.usdtToPkrRate,
        usdtFx: site.usdtFx,
        about: site.about,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
