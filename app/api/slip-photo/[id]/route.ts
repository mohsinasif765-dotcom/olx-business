import { NextResponse } from "next/server";
import { readDepositSlipImage } from "@/lib/server/deposit-slips";

function bytesFromDataUrl(image: string) {
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  return { type: match[1], buf: Buffer.from(match[2], "base64") };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const image = await readDepositSlipImage(id);
    if (!image) return new NextResponse("Not found", { status: 404 });
    if (/^https?:\/\//i.test(image)) {
      return NextResponse.redirect(image, {
        headers: { "Cache-Control": "private, max-age=300" },
      });
    }
    const parsed = bytesFromDataUrl(image);
    if (parsed) {
      return new NextResponse(new Uint8Array(parsed.buf), {
        headers: { "Content-Type": parsed.type, "Cache-Control": "private, max-age=300" },
      });
    }
    return new NextResponse("Not found", { status: 404 });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
