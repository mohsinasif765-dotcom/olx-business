import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { CAR_PLANS, type CarKind, type CarPlan } from "@/lib/cars";

const FILE = path.join(process.cwd(), "data", "car-plans.json");
const OPS_KEY = process.env.OLX_OPS_KEY || "olx-ops-local";
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || "http://localhost:3001";

function cors() {
  return {
    "Access-Control-Allow-Origin": ADMIN_ORIGIN,
    "Access-Control-Allow-Methods": "GET, PUT, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-olx-ops",
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: cors() });
}

function isImageRef(value: string) {
  return /^https?:\/\//i.test(value) || value.startsWith("/uploads/") || value.startsWith("/cars/");
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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

export async function GET() {
  return json({ plans: await readPlans() });
}

export async function PUT(request: Request) {
  if (request.headers.get("x-olx-ops") !== OPS_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const incoming = body && typeof body === "object" ? (body as { plans?: unknown }).plans : null;
  if (!Array.isArray(incoming) || !incoming.every(isPlan)) {
    return json({ error: "Each plan needs name, type, invest, return, term, and a photo." }, 400);
  }
  const plans = incoming.map(clean);
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, `${JSON.stringify({ plans }, null, 2)}\n`, "utf8");
  return json({ ok: true, plans });
}
