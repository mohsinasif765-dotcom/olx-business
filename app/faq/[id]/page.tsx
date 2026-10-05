import { FaqDetail } from "@/components/FaqDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FaqDetail id={id} />;
}
