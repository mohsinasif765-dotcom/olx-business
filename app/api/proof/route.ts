import { NextResponse } from "next/server";
import { storeDepositSlip } from "@/lib/server/deposit-slips";

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
  const id = `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const account = String(form.get("account") || "").trim().toLowerCase();

  try {
    const saved = await storeDepositSlip({
      id,
      account,
      bytes,
      contentType: file.type,
      ext,
    });
    return NextResponse.json({
      ok: true,
      id: saved.id,
      url: saved.url,
      stored: "storage",
    });
  } catch (error) {
    // Last resort: inline data URL so deposit can still submit
    const image = `data:${file.type};base64,${bytes.toString("base64")}`;
    const message = error instanceof Error ? error.message : "save";
    console.error("deposit slip storage failed", message);
    return NextResponse.json({ ok: true, id, url: image, stored: "inline" });
  }
}
