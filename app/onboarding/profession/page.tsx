// app/onboarding/profession/page.tsx
import { Suspense } from "react";
import ProfessionOnboardingClient from "./ProfessionOnboardingClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ProfessionOnboardingClient />
    </Suspense>
  );
}
