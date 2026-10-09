import { NextResponse } from "next/server";
import { storeMemberAvatar } from "@/lib/server/member-avatars";
import { zuvoAdmin } from "@/lib/zuvo";

const MAX_BYTES = 3 * 1024 * 1024;
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function key(account: string) {
  return account.trim().toLowerCase();
}

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "file" }, { status: 400 });
  }

  const account = key(String(form.get("account") || ""));
  if (!account) return NextResponse.json({ error: "account" }, { status: 400 });

  const { data: member, error: memberError } = await zuvoAdmin()
    .from("members")
    .select("account")
    .eq("account", account)
    .maybeSingle();
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });
  if (!member) return NextResponse.json({ error: "login" }, { status: 401 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file" }, { status: 400 });
  const ext = TYPES[file.type];
  if (!ext) return NextResponse.json({ error: "type" }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "size" }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await storeMemberAvatar({
      account,
      bytes,
      contentType: file.type,
      ext,
    });
    return NextResponse.json({ ok: true, avatarUrl: saved.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "save";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
