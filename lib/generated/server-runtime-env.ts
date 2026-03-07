import "server-only";

export const SERVER_RUNTIME_ENV = {
  mode: "placeholder",
  values: {
    NEXT_PUBLIC_SUPABASE_URL: "",
    SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    SUPABASE_SERVICE_ROLE_KEY: "",
  },
} as const;
