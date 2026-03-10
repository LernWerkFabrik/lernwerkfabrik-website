import { getWorkerRuntimeEnvAsync } from "@/lib/cloudflare/env";

function normalizePublicValue(value: string | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function serializePublicEnvScript(payload: {
  NEXT_PUBLIC_POSTHOG_HOST: string;
  NEXT_PUBLIC_POSTHOG_KEY: string;
}) {
  return `window.__LWF_PUBLIC_ENV__=${JSON.stringify(payload).replace(/</g, "\\u003c")};`;
}

export default async function PostHogPublicEnvScript() {
  const buildKey = normalizePublicValue(process.env.NEXT_PUBLIC_POSTHOG_KEY);
  const buildHost = normalizePublicValue(process.env.NEXT_PUBLIC_POSTHOG_HOST);

  let postHogKey = buildKey;
  let postHogHost = buildHost;

  if (!postHogKey || !postHogHost) {
    const runtimeEnv = await getWorkerRuntimeEnvAsync();
    postHogKey ||= normalizePublicValue(runtimeEnv?.NEXT_PUBLIC_POSTHOG_KEY);
    postHogHost ||= normalizePublicValue(runtimeEnv?.NEXT_PUBLIC_POSTHOG_HOST);
  }

  return (
    <script
      id="lwf-posthog-public-env"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: serializePublicEnvScript({
          NEXT_PUBLIC_POSTHOG_HOST: postHogHost,
          NEXT_PUBLIC_POSTHOG_KEY: postHogKey,
        }),
      }}
    />
  );
}
