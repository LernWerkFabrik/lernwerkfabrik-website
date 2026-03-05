// app/dashboard/layout.tsx
import type { ReactNode } from "react";
import DashboardGate from "../DashboardGate";
import ProfessionGate from "@/components/ProfessionGate";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <DashboardGate>
      <ProfessionGate>{children}</ProfessionGate>
    </DashboardGate>
  );
}
