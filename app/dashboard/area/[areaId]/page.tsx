// app/dashboard/area/[areaId]/page.tsx
import { listModules } from "@/lib/content";
import AreaPageClient from "./AreaPageClient";

export default async function AreaPage({
  params,
}: {
  params: Promise<{ areaId: string }>;
}) {
  const { areaId } = await params;
  const modules = await listModules();

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <AreaPageClient areaId={areaId ?? ""} modules={modules as any[]} />
    </main>
  );
}
