// app/logout/page.tsx
import { Suspense } from "react";
import LogoutClient from "./LogoutClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LogoutClient />
    </Suspense>
  );
}
