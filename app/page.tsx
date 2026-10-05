import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

export default function Home() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <AuthScreen mode="login" />
    </Suspense>
  );
}
