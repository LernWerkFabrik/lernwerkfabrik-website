// app/module/page.tsx
import { listModules } from "@/lib/content";
import ModuleListClient from "./ModuleListClient";

export default async function ModulePage() {
  const modules = await listModules();

  return (
    <main className="mx-auto w-full max-w-6xl p-4 md:p-6">
      <ModuleListClient modules={modules} />
    </main>
  );
}
