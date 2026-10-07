import { zuvoAdmin } from "@/lib/zuvo";

const BUCKET = "deposit-slips";
let bucketReady: Promise<void> | null = null;

async function ensureBucket() {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data } = await zuvoAdmin().storage.listBuckets();
      if ((data || []).some((b) => b.name === BUCKET || b.id === BUCKET)) return;
      await zuvoAdmin().storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 4 * 1024 * 1024,
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

export async function storeDepositSlip(opts: {
  id: string;
  account: string;
  bytes: Buffer;
  contentType: string;
  ext: string;
}) {
  await ensureBucket();
  const path = `${opts.id}.${opts.ext}`;
  const { error: uploadError } = await zuvoAdmin().storage.from(BUCKET).upload(path, opts.bytes, {
    contentType: opts.contentType,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const url = publicUrl(path);

  // Optional DB index row (ok if table missing)
  await zuvoAdmin().from("deposit_slips").upsert({
    id: opts.id,
    account: opts.account,
    image: url,
    created_at: new Date().toISOString(),
  });

  return { id: opts.id, url };
}

export async function readDepositSlipImage(id: string) {
  // Prefer Storage public files
  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    const path = `${id}.${ext === "jpeg" ? "jpg" : ext}`;
    const url = publicUrl(path);
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) return url;
    } catch {
      /* try next */
    }
  }

  const { data, error } = await zuvoAdmin().from("deposit_slips").select("image").eq("id", id).maybeSingle();
  if (!error && data?.image) return String(data.image);
  return "";
}
