import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const DIR = path.join(process.cwd(), "public", "uploads", "deposits");
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "file" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const name = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await mkdir(DIR, { recursive: true });
  await writeFile(path.join(DIR, name), bytes);
  return NextResponse.json({ url: `/uploads/deposits/${name}` });
}
