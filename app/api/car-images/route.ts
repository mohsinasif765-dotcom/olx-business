import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const DIR = path.join(process.cwd(), "public", "uploads", "cars");
const OPS_KEY = process.env.OLX_OPS_KEY || "olx-ops-local";
const ADMIN_ORIGIN = process.env.ADMIN_ORIGIN || "http://localhost:3001";
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function cors() {
  return {
    "Access-Control-Allow-Origin": ADMIN_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-olx-ops",
  };
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: cors() });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: cors() });
}

export async function POST(request: Request) {
  if (request.headers.get("x-olx-ops") !== OPS_KEY) {
    return json({ error: "Unauthorized" }, 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Could not read the photo." }, 400);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return json({ error: "Choose a car photo to upload." }, 400);
  }
  const ext = TYPES[file.type];
  if (!ext) {
    return json({ error: "Use a JPG, PNG, or WEBP photo." }, 400);
  }
  if (file.size > MAX_BYTES) {
    return json({ error: "Photo must be 4 MB or smaller." }, 400);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, name), bytes);

  return json({ url: `/uploads/cars/${name}` });
}
