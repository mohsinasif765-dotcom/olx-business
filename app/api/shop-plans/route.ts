import { NextResponse } from "next/server";
import { adminCors } from "@/lib/server/admin-cors";
import { readSettings } from "@/lib/server/db-tables";
import { listLiveShopPlans } from "@/lib/server/shop-catalog";

function json(request: Request, data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { ...adminCors(request, "GET, OPTIONS"), "Cache-Control": "no-store" },
  });
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: adminCors(request, "GET, OPTIONS") });
}

export async function GET(request: Request) {
  try {
    const [plans, settings] = await Promise.all([listLiveShopPlans(), readSettings()]);
    return json(request, {
      plans,
      settings: {
        siteName: String(settings?.siteName || "OLX Business"),
        packagesOn: settings?.packagesOn !== false,
        maintenance: String(settings?.maintenance || ""),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Zuvo read failed";
    return json(request, {
      error: message,
      plans: [],
      settings: { siteName: "OLX Business", packagesOn: true, maintenance: "" },
    });
  }
}
