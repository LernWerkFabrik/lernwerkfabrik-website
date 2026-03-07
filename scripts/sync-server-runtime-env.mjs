import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const mode = process.argv[2] === "generate" ? "generate" : "reset";
const rootDir = process.cwd();
const targetPath = path.join(rootDir, "lib", "generated", "server-runtime-env.ts");

function writeFile(content) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, content, "utf8");
}

function createPlaceholderContent() {
  return `import "server-only";

export const SERVER_RUNTIME_ENV = {
  mode: "placeholder",
  values: {
    NEXT_PUBLIC_SUPABASE_URL: "",
    SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  },
} as const;
`;
}

function createGeneratedContent() {
  const values = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    SUPABASE_URL: process.env.SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  };

  return `import "server-only";

export const SERVER_RUNTIME_ENV = {
  mode: "generated",
  values: ${JSON.stringify(values, null, 2)},
} as const;
`;
}

writeFile(mode === "generate" ? createGeneratedContent() : createPlaceholderContent());
