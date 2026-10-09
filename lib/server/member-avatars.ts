import { zuvoAdmin } from "@/lib/zuvo";

const BUCKET = "member-avatars";
let bucketReady: Promise<void> | null = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await zuvoAdmin().storage.listBuckets();
      if ((data || []).some((b) => b.name === BUCKET || b.id === BUCKET)) return;
      await zuvoAdmin().storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 3 * 1024 * 1024,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
      });
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  await bucketReady;
}

function publicUrl(path: string) {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function safeKey(account: string) {
  return account
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "_")
    .slice(0, 80);
}

export async function storeMemberAvatar(opts: {
  account: string;
  bytes: Buffer;
  contentType: string;
  ext: string;
}) {
  await ensureBucket();
  const key = safeKey(opts.account);
  const path = `${key}.${opts.ext}`;
  const { error: uploadError } = await zuvoAdmin().storage.from(BUCKET).upload(path, opts.bytes, {
    contentType: opts.contentType,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const url = `${publicUrl(path)}?v=${Date.now()}`;
  const { error } = await zuvoAdmin().from("members").update({ avatar_url: url }).eq("account", opts.account);
  if (error) throw new Error(error.message);
  return { url };
}
