import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { CAR_PLANS, type CarKind, type CarPlan } from "@/lib/cars";
import { adminCors } from "@/lib/server/admin-cors";

const FILE = path.join(process.cwd(), "data", "car-plans.json");
const OPS_KEY = process.env.OLX_OPS_KEY || "olx-ops-local";

function json(request: Request, data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: adminCors(request, "GET, PUT, POST, OPTIONS") });
}

function isImageRef(value: string) {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:image/") ||
    value.startsWith("/uploads/") ||
    value.startsWith("/cars/")
  );
}

function isPlan(row: unknown): row is CarPlan {
  if (!row || typeof row !== "object") return false;
  const p = row as Record<string, unknown>;
  const kind = p.kind === "used" ? "used" : p.kind === "new" ? "new" : null;
  const image = typeof p.image === "string" ? p.image.trim() : "";
  return (
    typeof p.id === "string" &&
    p.id.trim().length > 0 &&
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    kind !== null &&
    typeof p.invest === "string" &&
    typeof p.returns === "string" &&
    typeof p.term === "string" &&
    isImageRef(image)
  );
}

function clean(row: CarPlan): CarPlan {
  const kind: CarKind = row.kind === "used" ? "used" : "new";
  return {
    id: row.id.trim(),
    kind,
    name: row.name.trim(),
    invest: row.invest.trim(),
    returns: row.returns.trim(),
    term: row.term.trim(),
    image: row.image.trim(),
  };
}

async function readPlans(): Promise<CarPlan[]> {
  try {
    const raw = await readFile(FILE, "utf8");
    const parsed = JSON.parse(raw) as { plans?: unknown };
    const rows = Array.isArray(parsed.plans) ? parsed.plans.filter(isPlan).map(clean) : [];
    return rows.length ? rows : CAR_PLANS;
  } catch {
    return CAR_PLANS;
  }
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: adminCors(request, "GET, PUT, POST, OPTIONS") });
}

export async function GET(request: Request) {
  return json(request, { plans: await readPlans() });
}

export async function PUT(request: Request) {
  if (request.headers.get("x-olx-ops") !== OPS_KEY) {
    return json(request, { error: "Unauthorized" }, 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(request, { error: "Invalid JSON" }, 400);
  }
  const incoming = body && typeof body === "object" ? (body as { plans?: unknown }).plans : null;
  if (!Array.isArray(incoming) || !incoming.every(isPlan)) {
    return json(request, { error: "Each plan needs name, type, invest, return, term, and a photo." }, 400);
  }
  const plans = incoming.map(clean);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, `${JSON.stringify({ plans }, null, 2)}\n`, "utf8");
  return json(request, { ok: true, plans });
}
