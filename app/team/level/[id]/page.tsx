import { TeamLevelDetail } from "@/components/TeamLevelDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TeamLevelDetail id={id} />;
}
