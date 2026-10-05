import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="star-field min-h-screen" />}>
      <AuthScreen mode="register" />
    </Suspense>
  );
}
